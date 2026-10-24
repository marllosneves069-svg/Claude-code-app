"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runSync, type SyncResult } from "@/lib/sync";

export interface SyncNowState {
  results?: SyncResult[];
  error?: string;
}

/** "Atualizar agora" on /admin/performance. Runs within the page's maxDuration (300s). */
export async function syncNowAction(): Promise<SyncNowState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  try {
    const results = await runSync(createAdminClient(), {
      trigger: "manual",
      deadline: Date.now() + 240_000,
    });
    revalidatePath("/admin/performance");
    return { results };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao sincronizar." };
  }
}

export interface AdTaxFormState {
  error?: string;
  success?: boolean;
}

export async function updateAdTaxRateAction(_prev: AdTaxFormState, formData: FormData): Promise<AdTaxFormState> {
  const percent = Number(String(formData.get("taxPercent") ?? "").replace(",", "."));
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: "Informe um percentual entre 0 e 100." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "ad_tax_rate", value: { rate: percent / 100 }, updated_at: new Date().toISOString() });
  if (error) return { error: "Não foi possível salvar o imposto." };

  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/performance");
  return { success: true };
}
