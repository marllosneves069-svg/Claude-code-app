import { DEFAULT_HEALTH_THRESHOLDS, type HealthThresholds } from "@/lib/metrics";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_AD_TAX_RATE } from "@/lib/performance-metrics";

export async function getHealthThresholds(): Promise<HealthThresholds> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "health_thresholds").single();
  if (!data?.value) return DEFAULT_HEALTH_THRESHOLDS;
  return { ...DEFAULT_HEALTH_THRESHOLDS, ...(data.value as Partial<HealthThresholds>) };
}

export async function getAdTaxRate(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "ad_tax_rate").maybeSingle();
  const rate = Number((data?.value as { rate?: number } | undefined)?.rate);
  return Number.isFinite(rate) ? rate : DEFAULT_AD_TAX_RATE;
}
