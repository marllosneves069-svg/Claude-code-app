import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateMhs } from "@/lib/metrics";

interface IncomingAnswer {
  code: string;
  numeric_value?: number;
  text_value?: string;
}

export async function POST(request: Request) {
  let body: { token?: string; answers?: IncomingAnswer[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const token = body.token;
  const answers = Array.isArray(body.answers) ? body.answers : [];

  if (!token) {
    return NextResponse.json({ error: "Link inválido." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: invitation } = await supabase
    .from("survey_invitations")
    .select("id, survey_id, client_id, status")
    .eq("token", token)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "Pesquisa não encontrada." }, { status: 404 });
  }
  if (invitation.status === "answered") {
    return NextResponse.json({ error: "Esta pesquisa já foi respondida." }, { status: 409 });
  }

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, code, question_type, is_mhs, is_retention, weight")
    .eq("survey_id", invitation.survey_id);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Pesquisa inválida." }, { status: 400 });
  }

  const answerByCode = new Map(answers.map((a) => [a.code, a]));
  const questionByCode = new Map(questions.map((q) => [q.code, q]));

  const npsQuestion = questionByCode.get("nps");
  const npsAnswer = npsQuestion ? answerByCode.get("nps") : undefined;
  if (
    !npsQuestion ||
    npsAnswer?.numeric_value == null ||
    !Number.isInteger(npsAnswer.numeric_value) ||
    npsAnswer.numeric_value < 0 ||
    npsAnswer.numeric_value > 10
  ) {
    return NextResponse.json({ error: "Resposta de NPS inválida." }, { status: 400 });
  }

  const mhsQuestions = questions.filter((q) => q.is_mhs);
  const mhsInputs = mhsQuestions
    .map((q) => {
      const a = answerByCode.get(q.code);
      if (a?.numeric_value == null) return null;
      return { value: a.numeric_value, weight: q.weight };
    })
    .filter((v): v is { value: number; weight: number } => v != null);

  const mhs = calculateMhs(mhsInputs);

  const retentionQuestion = questions.find((q) => q.is_retention);
  const retentionAnswer = retentionQuestion ? answerByCode.get(retentionQuestion.code) : undefined;

  const feedbackQuestion = questionByCode.get("feedback");
  const feedbackAnswer = feedbackQuestion ? answerByCode.get("feedback") : undefined;

  const { data: response, error: insertError } = await supabase
    .from("responses")
    .insert({
      invitation_id: invitation.id,
      survey_id: invitation.survey_id,
      client_id: invitation.client_id,
      nps_score: npsAnswer.numeric_value,
      mhs_average: mhs.average,
      mhs_percentage: mhs.percentage,
      retention_answer: retentionAnswer?.numeric_value ?? null,
      feedback: feedbackAnswer?.text_value ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    // Unique violation on invitation_id -> a response already exists (race condition).
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Esta pesquisa já foi respondida." }, { status: 409 });
    }
    return NextResponse.json({ error: "Não foi possível registrar sua resposta." }, { status: 500 });
  }

  const answerRows = questions
    .map((q) => {
      const a = answerByCode.get(q.code);
      if (!a) return null;
      return {
        response_id: response.id,
        question_id: q.id,
        numeric_value: a.numeric_value ?? null,
        text_value: a.text_value ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  if (answerRows.length > 0) {
    await supabase.from("response_answers").insert(answerRows);
  }

  await supabase
    .from("survey_invitations")
    .update({ status: "answered", answered_at: new Date().toISOString() })
    .eq("id", invitation.id);

  // Auto-close the survey once every invitation has been answered.
  const { data: pendingInvitations } = await supabase
    .from("survey_invitations")
    .select("id")
    .eq("survey_id", invitation.survey_id)
    .eq("status", "pending");

  if (pendingInvitations && pendingInvitations.length === 0) {
    await supabase
      .from("surveys")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", invitation.survey_id)
      .eq("status", "in_progress");
  }

  return NextResponse.json({ ok: true });
}
