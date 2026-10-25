import "server-only";
import { createClient } from "@/lib/supabase/server";
import { eachDay, previousRange, type DateRange } from "@/lib/date-range";
import { getMetaConfig, getPeriodReach } from "@/lib/integrations/meta";
import { buildFunnel, isSale, sumTinyOrders, type Funnel, type MetaTotals } from "@/lib/performance-metrics";
import type { MetaCampaignDailyRow, SyncRunRow, TinyOrderRow, TinySituacaoGroup } from "@/lib/database.types";

/** Products at or below this many units show up in "Estoque baixo". */
const LOW_STOCK_THRESHOLD = 5;
/** PostgREST caps responses at 1000 rows by default, so larger reads are paged. */
const PAGE_SIZE = 1000;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await build(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

type MetaRow = Pick<
  MetaCampaignDailyRow,
  "date" | "campaign_id" | "campaign_name" | "spend" | "impressions" | "reach" | "link_clicks" | "messaging_conversations" | "leads" | "meta_purchases" | "meta_purchase_value"
>;
type OrderRow = Pick<TinyOrderRow, "data_pedido" | "situacao_group" | "valor">;

function getMetaRows(supabase: SupabaseServerClient, range: DateRange) {
  return fetchAll<MetaRow>((from, to) =>
    supabase
      .from("meta_campaign_daily")
      .select(
        "date, campaign_id, campaign_name, spend, impressions, reach, link_clicks, messaging_conversations, leads, meta_purchases, meta_purchase_value"
      )
      .gte("date", range.from)
      .lte("date", range.to)
      .order("date")
      .order("campaign_id")
      .range(from, to)
  );
}

function getOrderRows(supabase: SupabaseServerClient, range: DateRange) {
  return fetchAll<OrderRow>((from, to) =>
    supabase
      .from("tiny_orders")
      .select("data_pedido, situacao_group, valor")
      .gte("data_pedido", range.from)
      .lte("data_pedido", range.to)
      .order("tiny_id")
      .range(from, to)
  );
}

function inRange(date: string, range: DateRange) {
  return date >= range.from && date <= range.to;
}

async function sumMeta(rows: MetaRow[], range: DateRange): Promise<MetaTotals> {
  const totals: MetaTotals = {
    reach: null,
    reachIsApproximate: false,
    impressions: 0,
    linkClicks: 0,
    messagingConversations: 0,
    leads: 0,
    spend: 0,
  };
  let dailyReachSum = 0;
  for (const r of rows) {
    totals.impressions += Number(r.impressions);
    totals.linkClicks += Number(r.link_clicks);
    totals.messagingConversations += Number(r.messaging_conversations);
    totals.leads += Number(r.leads);
    totals.spend += Number(r.spend);
    dailyReachSum += Number(r.reach);
  }

  const config = getMetaConfig();
  if (config && rows.length > 0) {
    try {
      totals.reach = await getPeriodReach(config, range.from, range.to);
      return totals;
    } catch {
      // Fall through to the approximation below.
    }
  }
  if (rows.length > 0) {
    totals.reach = dailyReachSum;
    totals.reachIsApproximate = true;
  }
  return totals;
}

export interface DailyPoint {
  date: string;
  spend: number;
  revenue: number;
  contacts: number;
  purchases: number;
  roas: number | null;
}

export interface CampaignSummary {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  link_clicks: number;
  contacts: number;
  costPerContact: number | null;
  metaPurchases: number;
  metaRoas: number | null;
}

export interface PerformanceData {
  hasData: boolean;
  funnel: Funnel;
  previous: Funnel;
  daily: DailyPoint[];
  campaigns: CampaignSummary[];
}

export async function getPerformanceData(range: DateRange, taxRate: number): Promise<PerformanceData> {
  const supabase = await createClient();
  const prev = previousRange(range);
  const wide = { from: prev.from, to: range.to };
  const [metaRows, orderRows] = await Promise.all([getMetaRows(supabase, wide), getOrderRows(supabase, wide)]);

  const metaCurrent = metaRows.filter((r) => inRange(r.date, range));
  const metaPrevious = metaRows.filter((r) => inRange(r.date, prev));
  const ordersCurrent = orderRows.filter((o) => inRange(o.data_pedido, range));
  const ordersPrevious = orderRows.filter((o) => inRange(o.data_pedido, prev));

  const [metaTotals, metaPrevTotals] = await Promise.all([sumMeta(metaCurrent, range), sumMeta(metaPrevious, prev)]);

  return {
    hasData: metaCurrent.length > 0 || ordersCurrent.length > 0,
    funnel: buildFunnel(metaTotals, sumTinyOrders(ordersCurrent), taxRate),
    previous: buildFunnel(metaPrevTotals, sumTinyOrders(ordersPrevious), taxRate),
    daily: buildDaily(range, metaCurrent, ordersCurrent),
    campaigns: buildCampaigns(metaCurrent),
  };
}

function buildDaily(range: DateRange, meta: MetaRow[], orders: OrderRow[]): DailyPoint[] {
  const byDay = new Map<string, DailyPoint>(
    eachDay(range).map((date) => [date, { date, spend: 0, revenue: 0, contacts: 0, purchases: 0, roas: null }])
  );
  for (const r of meta) {
    const p = byDay.get(r.date);
    if (!p) continue;
    p.spend += Number(r.spend);
    p.contacts += Number(r.messaging_conversations) + Number(r.leads);
  }
  for (const o of orders) {
    const p = byDay.get(o.data_pedido);
    if (!p || !isSale(o.situacao_group)) continue;
    p.revenue += Number(o.valor);
    p.purchases += 1;
  }
  for (const p of byDay.values()) p.roas = p.spend > 0 ? p.revenue / p.spend : null;
  return [...byDay.values()];
}

function buildCampaigns(meta: MetaRow[]): CampaignSummary[] {
  const byCampaign = new Map<string, CampaignSummary & { purchaseValue: number }>();
  for (const r of meta) {
    const c = byCampaign.get(r.campaign_id) ?? {
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name,
      spend: 0,
      impressions: 0,
      link_clicks: 0,
      contacts: 0,
      costPerContact: null,
      metaPurchases: 0,
      metaRoas: null,
      purchaseValue: 0,
    };
    c.campaign_name = r.campaign_name;
    c.spend += Number(r.spend);
    c.impressions += Number(r.impressions);
    c.link_clicks += Number(r.link_clicks);
    c.contacts += Number(r.messaging_conversations) + Number(r.leads);
    c.metaPurchases += Number(r.meta_purchases);
    c.purchaseValue += Number(r.meta_purchase_value);
    byCampaign.set(r.campaign_id, c);
  }
  return [...byCampaign.values()]
    .map(({ purchaseValue, ...c }) => ({
      ...c,
      costPerContact: c.contacts > 0 ? c.spend / c.contacts : null,
      metaRoas: c.spend > 0 && purchaseValue > 0 ? purchaseValue / c.spend : null,
    }))
    .filter((c) => c.spend > 0 || c.contacts > 0)
    .sort((a, b) => b.spend - a.spend);
}

// ----------------------------------------------------------------------------
// Products
// ----------------------------------------------------------------------------
export interface ProductSummary {
  key: string;
  sku: string | null;
  name: string;
  quantity: number;
  revenue: number;
  /** null when Tiny has no cost price for the product. */
  margin: number | null;
  stock: number | null;
}

interface ItemWithOrder {
  product_id: string | null;
  sku: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  order: { data_pedido: string; situacao_group: TinySituacaoGroup };
}

export async function getTopProducts(range: DateRange, limit = 15): Promise<{ top: ProductSummary[]; lowStock: ProductSummary[] }> {
  const supabase = await createClient();
  const items = await fetchAll<ItemWithOrder>((from, to) =>
    supabase
      .from("tiny_order_items")
      .select("product_id, sku, descricao, quantidade, valor_unitario, order:tiny_orders!inner(data_pedido, situacao_group)")
      .neq("order.situacao_group", "excluded")
      .gte("order.data_pedido", range.from)
      .lte("order.data_pedido", range.to)
      .order("id")
      .range(from, to)
  );

  const byProduct = new Map<string, ProductSummary & { productId: string | null }>();
  for (const item of items) {
    const key = item.product_id ?? item.sku ?? item.descricao;
    const p = byProduct.get(key) ?? {
      key,
      productId: item.product_id,
      sku: item.sku,
      name: item.descricao,
      quantity: 0,
      revenue: 0,
      margin: null,
      stock: null,
    };
    p.quantity += Number(item.quantidade);
    p.revenue += Number(item.quantidade) * Number(item.valor_unitario);
    byProduct.set(key, p);
  }

  const sold = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue);
  const productIds = sold.map((p) => p.productId).filter((id): id is string => id != null);
  const catalog = new Map<string, { preco_custo: number | null; estoque: number | null }>();
  for (let i = 0; i < productIds.length; i += 200) {
    const { data } = await supabase
      .from("tiny_products")
      .select("tiny_id, preco_custo, estoque")
      .in("tiny_id", productIds.slice(i, i + 200));
    for (const row of data ?? []) {
      catalog.set(row.tiny_id, {
        preco_custo: row.preco_custo == null ? null : Number(row.preco_custo),
        estoque: row.estoque == null ? null : Number(row.estoque),
      });
    }
  }

  const enriched: ProductSummary[] = sold.map(({ productId, ...p }) => {
    const info = productId ? catalog.get(productId) : undefined;
    const cost = info?.preco_custo;
    return {
      ...p,
      margin: cost != null && cost > 0 ? p.revenue - cost * p.quantity : null,
      stock: info?.estoque ?? null,
    };
  });

  return {
    top: enriched.slice(0, limit),
    lowStock: enriched
      .filter((p) => p.stock != null && p.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, limit),
  };
}

// ----------------------------------------------------------------------------
// Sync status
// ----------------------------------------------------------------------------
export async function getLastSyncRuns(): Promise<Partial<Record<SyncRunRow["source"], SyncRunRow>>> {
  const supabase = await createClient();
  const { data } = await supabase.from("sync_runs").select("*").order("started_at", { ascending: false }).limit(20);
  const latest: Partial<Record<SyncRunRow["source"], SyncRunRow>> = {};
  for (const run of (data ?? []) as SyncRunRow[]) {
    if (!latest[run.source]) latest[run.source] = run;
  }
  return latest;
}
