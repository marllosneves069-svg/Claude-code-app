/**
 * Meta Ads + Tiny sync from the command line — same job as the daily cron,
 * without a time limit. Use it for the first backfill (Tiny's rate limit makes
 * it slow: ~28 requests/min by default) or to force a full refresh.
 *
 * Usage:
 *   npm run sync              # Meta + Tiny
 *   npm run sync -- meta      # only Meta
 *   npm run sync -- tiny      # only Tiny
 */
import { createClient } from "@supabase/supabase-js";
import { runSync } from "../src/lib/sync";
import type { SyncSource } from "../src/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: npx tsx --env-file=.env.local scripts/sync-performance.ts"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const requested = process.argv.slice(2).filter((a): a is SyncSource => a === "meta" || a === "tiny");

async function main() {
  console.log(`Sincronizando ${requested.length ? requested.join(" + ") : "meta + tiny"}...`);
  const results = await runSync(supabase, { trigger: "script", sources: requested.length ? requested : undefined });
  for (const r of results) {
    console.log(`\n[${r.source}] ${r.status}${r.message ? ` — ${r.message}` : ""}`);
    if (r.stats) console.log(JSON.stringify(r.stats, null, 2));
  }
  if (results.some((r) => r.status === "error")) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
