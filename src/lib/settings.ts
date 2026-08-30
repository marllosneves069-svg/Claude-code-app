import { DEFAULT_HEALTH_THRESHOLDS, type HealthThresholds } from "@/lib/metrics";
import { createClient } from "@/lib/supabase/server";

export async function getHealthThresholds(): Promise<HealthThresholds> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "health_thresholds").single();
  if (!data?.value) return DEFAULT_HEALTH_THRESHOLDS;
  return { ...DEFAULT_HEALTH_THRESHOLDS, ...(data.value as Partial<HealthThresholds>) };
}
