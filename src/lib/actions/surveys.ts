"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { QUESTION_TEMPLATES } from "@/lib/questions";
import { monthLabel } from "@/lib/metrics";

export interface SurveyFormState {
  error?: string;
}

export async function createSurveyAction(_prev: SurveyFormState, formData: FormData): Promise<SurveyFormState> {
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const audience = String(formData.get("audience") ?? "all_active");
  const selectedClientIds = formData.getAll("client_ids").map(String);

  if (!month || !year) {
    return { error: "Selecione o mês e o ano da pesquisa." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("surveys")
    .select("id")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();
  if (existing) {
    return { error: "Já existe uma pesquisa cadastrada para esse mês." };
  }

  let clientIds: string[] = selectedClientIds;
  if (audience === "all_active") {
    const { data: activeClients } = await supabase.from("clients").select("id").eq("status", "active");
    clientIds = (activeClients ?? []).map((c) => c.id);
  }

  if (clientIds.length === 0) {
    return { error: "Nenhum cliente selecionado para esta pesquisa." };
  }

  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .insert({ name: monthLabel(month, year), month, year, status: "in_progress" })
    .select("id")
    .single();

  if (surveyError || !survey) {
    return { error: "Não foi possível criar a pesquisa." };
  }

  const { error: questionsError } = await supabase.from("survey_questions").insert(
    QUESTION_TEMPLATES.map((q) => ({
      survey_id: survey.id,
      code: q.code,
      question: q.question,
      question_type: q.question_type,
      order: q.order,
      is_mhs: q.is_mhs,
      is_retention: q.is_retention,
      weight: q.weight,
    }))
  );

  const { error: invitationsError } = await supabase.from("survey_invitations").insert(
    clientIds.map((clientId) => ({
      survey_id: survey.id,
      client_id: clientId,
      status: "pending" as const,
    }))
  );

  if (questionsError || invitationsError) {
    return { error: "Pesquisa criada, mas houve um erro ao gerar os links. Tente novamente." };
  }

  revalidatePath("/admin/pesquisas");
  redirect(`/admin/pesquisas/${survey.id}`);
}

export async function deleteSurveyAction(surveyId: string) {
  const supabase = await createClient();
  await supabase.from("surveys").delete().eq("id", surveyId);
  revalidatePath("/admin/pesquisas");
  revalidatePath("/admin");
  redirect("/admin/pesquisas");
}

export async function toggleSurveyStatusAction(surveyId: string, currentStatus: "in_progress" | "closed") {
  const supabase = await createClient();
  const nextStatus = currentStatus === "closed" ? "in_progress" : "closed";
  await supabase
    .from("surveys")
    .update({ status: nextStatus, closed_at: nextStatus === "closed" ? new Date().toISOString() : null })
    .eq("id", surveyId);
  revalidatePath(`/admin/pesquisas/${surveyId}`);
  revalidatePath("/admin/pesquisas");
  revalidatePath("/admin");
}
