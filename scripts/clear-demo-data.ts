/**
 * Removes all demo data created by seed-demo-data.ts (anything flagged
 * is_demo = true on clients/surveys — deleting a survey cascades to its
 * questions/invitations/responses/answers).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/clear-demo-data.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: demoSurveys } = await supabase.from("surveys").select("id").eq("is_demo", true);
  const { data: demoClients } = await supabase.from("clients").select("id").eq("is_demo", true);

  const surveyIds = (demoSurveys ?? []).map((s) => s.id);
  const clientIds = (demoClients ?? []).map((c) => c.id);

  if (surveyIds.length > 0) await supabase.from("surveys").delete().in("id", surveyIds);
  if (clientIds.length > 0) await supabase.from("clients").delete().in("id", clientIds);

  console.log(`Removed ${surveyIds.length} demo surveys and ${clientIds.length} demo clients.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
