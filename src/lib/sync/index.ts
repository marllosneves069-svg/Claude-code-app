// Sync job: pulls Meta Ads insights and Tiny orders/products into Supabase.
//
// Called from three places, all server-side with the service-role client:
//   * src/app/api/cron/sync/route.ts  — daily cron
//   * src/lib/actions/performance.ts  — "Atualizar agora" button
//   * scripts/sync-performance.ts     — `npm run sync` (long initial backfill)
//
// Tiny's per-minute quota makes a full backfill slow, so the Tiny sync takes
// a `deadline`: it stops cleanly when time runs out (status "partial") and the
// next run picks up where it left off (orders without items, products
// without stock).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SyncSource, SyncStatus } from "@/lib/database.types";
import { addDays, todayInStore } from "@/lib/date-range";
import { fetchCampaignDaily, getMetaConfig } from "@/lib/integrations/meta";
import {
  getOrderDetail,
  getProductStock,
  getTinyConfig,
  listStockUpdates,
  searchOrders,
  searchProducts,
  type TinyConfig,
  type TinyOrderSummary,
} from "@/lib/integrations/tiny";

const BACKFILL_DAYS = Number(process.env.SYNC_BACKFILL_DAYS) || 90;
/** Meta revises recent days as attribution settles, so every run re-pulls this window. */
const META_REFRESH_DAYS = 7;
/** A run stuck in "running" longer than this is considered dead and no longer blocks new runs. */
const STALE_RUN_MS = 15 * 60 * 1000;

export interface SyncOptions {
  trigger: "cron" | "manual" | "script";
  /** Epoch ms after which the Tiny sync stops starting new API calls. */
  deadline?: number;
  sources?: SyncSource[];
}

export interface SyncResult {
  source: SyncSource;
  status: SyncStatus | "skipped";
  message?: string;
  stats?: Record<string, unknown>;
}

export async function runSync(supabase: SupabaseClient, options: SyncOptions): Promise<SyncResult[]> {
  const sources = options.sources ?? ["meta", "tiny"];
  const results: SyncResult[] = [];
  if (sources.includes("meta")) results.push(await runMetaSync(supabase, options));
  if (sources.includes("tiny")) results.push(await runTinySync(supabase, options));
  return results;
}

// ----------------------------------------------------------------------------
// sync_runs bookkeeping
// ----------------------------------------------------------------------------
async function isRunning(supabase: SupabaseClient, source: SyncSource): Promise<boolean> {
  const { data } = await supabase
    .from("sync_runs")
    .select("id")
    .eq("source", source)
    .eq("status", "running")
    .gte("started_at", new Date(Date.now() - STALE_RUN_MS).toISOString())
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function startRun(supabase: SupabaseClient, source: SyncSource, trigger: string): Promise<string> {
  const { data, error } = await supabase.from("sync_runs").insert({ source, trigger }).select("id").single();
  if (error) throw new Error(`Não foi possível registrar o sync: ${error.message}`);
  return data.id as string;
}

async function finishRun(
  supabase: SupabaseClient,
  id: string,
  status: SyncStatus,
  stats: Record<string, unknown>,
  error?: string
) {
  await supabase
    .from("sync_runs")
    .update({ status, stats, error: error ?? null, finished_at: new Date().toISOString() })
    .eq("id", id);
}

/** Latest value of a cursor some previous run saved into `stats`. */
async function lastCursor(supabase: SupabaseClient, source: SyncSource, key: string): Promise<string | null> {
  const { data } = await supabase
    .from("sync_runs")
    .select("stats")
    .eq("source", source)
    .not(`stats->>${key}`, "is", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.stats as Record<string, string> | undefined)?.[key] ?? null;
}

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ----------------------------------------------------------------------------
// Meta
// ----------------------------------------------------------------------------
async function runMetaSync(supabase: SupabaseClient, options: SyncOptions): Promise<SyncResult> {
  const config = getMetaConfig();
  if (!config) return { source: "meta", status: "skipped", message: "META_ACCESS_TOKEN/META_AD_ACCOUNT_ID não configurados." };
  if (await isRunning(supabase, "meta")) return { source: "meta", status: "skipped", message: "Já existe um sync do Meta em andamento." };

  const runId = await startRun(supabase, "meta", options.trigger);
  const today = todayInStore();
  const hasHistory = (await lastCursor(supabase, "meta", "synced_until")) != null;
  const since = addDays(today, -((hasHistory ? META_REFRESH_DAYS : BACKFILL_DAYS) - 1));
  const stats: Record<string, unknown> = { since, until: today };

  try {
    const rows = await fetchCampaignDaily(config, since, today);
    const syncedAt = new Date().toISOString();
    for (const batch of chunk(rows, 500)) {
      const { error } = await supabase
        .from("meta_campaign_daily")
        .upsert(batch.map((r) => ({ ...r, synced_at: syncedAt })), { onConflict: "date,campaign_id" });
      if (error) throw new Error(`Supabase: ${error.message}`);
    }
    stats.rows = rows.length;
    stats.synced_until = today;
    await finishRun(supabase, runId, "success", stats);
    return { source: "meta", status: "success", stats };
  } catch (err) {
    await finishRun(supabase, runId, "error", stats, errorMessage(err));
    return { source: "meta", status: "error", message: errorMessage(err), stats };
  }
}

// ----------------------------------------------------------------------------
// Tiny
// ----------------------------------------------------------------------------
class DeadlineReached extends Error {}

async function runTinySync(supabase: SupabaseClient, options: SyncOptions): Promise<SyncResult> {
  const config = getTinyConfig();
  if (!config) return { source: "tiny", status: "skipped", message: "TINY_API_TOKEN não configurado." };
  if (await isRunning(supabase, "tiny")) return { source: "tiny", status: "skipped", message: "Já existe um sync do Tiny em andamento." };

  const runId = await startRun(supabase, "tiny", options.trigger);
  const startedAt = new Date();
  const deadline = options.deadline ?? Number.POSITIVE_INFINITY;
  const checkDeadline = () => {
    if (Date.now() > deadline) throw new DeadlineReached();
  };
  const stats: Record<string, unknown> = {};

  try {
    stats.orders = await syncOrders(supabase, config, checkDeadline);
    // Only advance the incremental cursor once every changed order was saved.
    stats.orders_cursor = startedAt.toISOString();
    stats.items = await syncOrderItems(supabase, config, checkDeadline);
    stats.products = await syncProducts(supabase, config, checkDeadline);
    stats.stock = await syncStock(supabase, config, checkDeadline);
    stats.stock_cursor = startedAt.toISOString();
    await finishRun(supabase, runId, "success", stats);
    return { source: "tiny", status: "success", stats };
  } catch (err) {
    if (err instanceof DeadlineReached) {
      const message = "Tempo esgotado — o próximo sync continua de onde parou.";
      await finishRun(supabase, runId, "partial", stats, message);
      return { source: "tiny", status: "partial", message, stats };
    }
    await finishRun(supabase, runId, "error", stats, errorMessage(err));
    return { source: "tiny", status: "error", message: errorMessage(err), stats };
  }
}

async function syncOrders(supabase: SupabaseClient, config: TinyConfig, checkDeadline: () => void) {
  const cursor = await lastCursor(supabase, "tiny", "orders_cursor");
  const filter = cursor
    ? // 1 day of overlap so nothing changed around the previous run is missed.
      { updatedSince: new Date(Date.parse(cursor) - 24 * 60 * 60 * 1000) }
    : { from: addDays(todayInStore(), -(BACKFILL_DAYS - 1)), to: todayInStore() };

  let saved = 0;
  for await (const page of searchOrders(config, filter)) {
    await saveOrders(supabase, page);
    saved += page.length;
    checkDeadline();
  }
  return { mode: cursor ? "incremental" : "backfill", saved };
}

async function saveOrders(supabase: SupabaseClient, orders: TinyOrderSummary[]) {
  if (orders.length === 0) return;
  const { data: existing } = await supabase
    .from("tiny_orders")
    .select("tiny_id, valor")
    .in(
      "tiny_id",
      orders.map((o) => o.tiny_id)
    );
  const previousValor = new Map((existing ?? []).map((o) => [o.tiny_id as string, Number(o.valor)]));
  const syncedAt = new Date().toISOString();

  // Orders whose total changed get their items re-fetched. Two upserts because
  // supabase-js nulls out columns missing from some rows of a batch.
  const changed = orders.filter((o) => previousValor.has(o.tiny_id) && previousValor.get(o.tiny_id) !== o.valor);
  const rest = orders.filter((o) => !changed.includes(o));
  for (const [rows, extra] of [
    [rest, {}],
    [changed, { items_synced_at: null }],
  ] as const) {
    if (rows.length === 0) continue;
    const { error } = await supabase
      .from("tiny_orders")
      .upsert(rows.map((o) => ({ ...o, ...extra, synced_at: syncedAt })), { onConflict: "tiny_id" });
    if (error) throw new Error(`Supabase: ${error.message}`);
  }
}

/** Items are only needed for sales (top products), so cancelled orders are skipped. */
async function syncOrderItems(supabase: SupabaseClient, config: TinyConfig, checkDeadline: () => void) {
  const { data: pending } = await supabase
    .from("tiny_orders")
    .select("tiny_id")
    .neq("situacao_group", "excluded")
    .is("items_synced_at", null)
    .order("data_pedido", { ascending: false })
    .limit(1000);

  let synced = 0;
  for (const { tiny_id } of pending ?? []) {
    checkDeadline();
    const detail = await getOrderDetail(config, tiny_id);
    await supabase.from("tiny_order_items").delete().eq("order_id", tiny_id);
    if (detail && detail.items.length > 0) {
      const { error } = await supabase
        .from("tiny_order_items")
        .insert(detail.items.map((item) => ({ ...item, order_id: tiny_id })));
      if (error) throw new Error(`Supabase: ${error.message}`);
    }
    await supabase
      .from("tiny_orders")
      .update({ ecommerce: detail?.ecommerce ?? null, items_synced_at: new Date().toISOString() })
      .eq("tiny_id", tiny_id);
    synced++;
  }
  return { synced, remaining: (pending?.length ?? 0) - synced };
}

async function syncProducts(supabase: SupabaseClient, config: TinyConfig, checkDeadline: () => void) {
  let saved = 0;
  for await (const page of searchProducts(config)) {
    const syncedAt = new Date().toISOString();
    const { error } = await supabase
      .from("tiny_products")
      .upsert(page.map((p) => ({ ...p, synced_at: syncedAt })), { onConflict: "tiny_id" });
    if (error) throw new Error(`Supabase: ${error.message}`);
    saved += page.length;
    checkDeadline();
  }
  return { saved };
}

async function syncStock(supabase: SupabaseClient, config: TinyConfig, checkDeadline: () => void) {
  const cursor = await lastCursor(supabase, "tiny", "stock_cursor");
  // Tiny only keeps ~30 days of stock-change history.
  const since = cursor ? new Date(Date.parse(cursor) - 60 * 60 * 1000) : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

  let updated = 0;
  for await (const page of listStockUpdates(config, since)) {
    const now = new Date().toISOString();
    for (const item of page) {
      await supabase.from("tiny_products").update({ estoque: item.estoque, estoque_synced_at: now }).eq("tiny_id", item.tiny_id);
    }
    updated += page.length;
    checkDeadline();
  }

  // Products that sold but never had their stock read (no change in the
  // window above) — read them one by one, a bounded batch per run.
  const { data: soldIds } = await supabase.from("tiny_order_items").select("product_id").not("product_id", "is", null).limit(5000);
  const ids = [...new Set((soldIds ?? []).map((r) => r.product_id as string))];
  let fetched = 0;
  if (ids.length > 0) {
    const { data: missing } = await supabase
      .from("tiny_products")
      .select("tiny_id")
      .in("tiny_id", ids.slice(0, 500))
      .is("estoque_synced_at", null)
      .limit(100);
    for (const { tiny_id } of missing ?? []) {
      checkDeadline();
      const estoque = await getProductStock(config, tiny_id);
      await supabase
        .from("tiny_products")
        .update({ estoque, estoque_synced_at: new Date().toISOString() })
        .eq("tiny_id", tiny_id);
      fetched++;
    }
  }
  return { updated, fetched };
}
