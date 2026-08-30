"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Deleting a response frees up its invitation link so the client could
 * answer again (status reset to pending), and reopens the survey if
 * deleting this response takes it back below 100% response rate.
 */
export async function deleteResponseAction(responseId: string) {
  const supabase = await createClient();

  const { data: response } = await supabase
    .from("responses")
    .select("invitation_id, survey_id")
    .eq("id", responseId)
    .maybeSingle();

  if (!response) {
    redirect("/admin/respostas");
  }

  await supabase.from("responses").delete().eq("id", responseId);

  await supabase
    .from("survey_invitations")
    .update({ status: "pending", answered_at: null })
    .eq("id", response.invitation_id);

  await supabase
    .from("surveys")
    .update({ status: "in_progress", closed_at: null })
    .eq("id", response.survey_id)
    .eq("status", "closed");

  revalidatePath("/admin/respostas");
  revalidatePath(`/admin/pesquisas/${response.survey_id}`);
  revalidatePath("/admin");
  redirect("/admin/respostas");
}
