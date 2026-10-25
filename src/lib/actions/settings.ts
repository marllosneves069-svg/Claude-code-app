"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

export async function updateHealthThresholdsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const healthyMin = Number(formData.get("healthyMin"));
  const attentionMin = Number(formData.get("attentionMin"));
  const detractorNpsMax = Number(formData.get("detractorNpsMax"));
  const lowRetentionCodes = formData.getAll("lowRetentionCodes").map(Number);

  if (Number.isNaN(healthyMin) || Number.isNaN(attentionMin) || Number.isNaN(detractorNpsMax)) {
    return { error: "Valores inválidos." };
  }
  if (attentionMin >= healthyMin) {
    return { error: "O limite de 'Atenção' precisa ser menor que o de 'Saudável'." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ value: { healthyMin, attentionMin, detractorNpsMax, lowRetentionCodes }, updated_at: new Date().toISOString() })
    .eq("key", "health_thresholds");

  if (error) return { error: "Não foi possível salvar as configurações." };

  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  return { success: true };
}
