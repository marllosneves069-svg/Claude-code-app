import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SurveyRunner, type RunnerQuestion } from "@/components/survey/SurveyRunner";
import { AlreadyAnsweredScreen } from "@/components/survey/StateScreens";

export const dynamic = "force-dynamic";

export default async function PublicSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: invitation } = await supabase
    .from("survey_invitations")
    .select("id, status, survey_id, client:clients(contact_name, status)")
    .eq("token", token)
    .maybeSingle();

  if (!invitation) notFound();

  if (invitation.status === "answered") {
    return <AlreadyAnsweredScreen />;
  }

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, code, question, question_type, order, is_mhs, is_retention")
    .eq("survey_id", invitation.survey_id)
    .order("order", { ascending: true });

  const runnerQuestions: RunnerQuestion[] = (questions ?? []).map((q) => ({
    id: q.id,
    code: q.code,
    question: q.question,
    question_type: q.question_type,
    order: q.order,
    placeholder: q.code === "feedback" ? "Conte para nós. Seu feedback é muito importante..." : undefined,
  }));

  const client = invitation.client as unknown as { contact_name: string; status: string } | null;

  return <SurveyRunner token={token} contactName={client?.contact_name ?? "cliente"} questions={runnerQuestions} />;
}
