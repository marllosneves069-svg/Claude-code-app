import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  aggregateResponses,
  calculateRetentionIndex,
  isDetractorAlert,
  isLowRetentionAlert,
  mhsPercentageToHealth,
  type HealthThresholds,
  type HealthStatus,
} from "@/lib/metrics";
import { DIMENSION_LABELS } from "@/lib/questions";
import type { ClientRow, ClientStatus, ResponseRow, SurveyRow } from "@/lib/database.types";

export interface PeriodOption {
  survey_id: string;
  month: number;
  year: number;
  status: SurveyRow["status"];
}

export async function getPeriods(): Promise<PeriodOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select("id, month, year, status")
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  return (data ?? []).map((s) => ({ survey_id: s.id, month: s.month, year: s.year, status: s.status }));
}

export async function getSurveyByPeriod(month: number, year: number): Promise<SurveyRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("surveys").select("*").eq("month", month).eq("year", year).maybeSingle();
  return data ?? null;
}

export async function getLatestPeriod(): Promise<{ month: number; year: number } | null> {
  const periods = await getPeriods();
  if (periods.length === 0) return null;
  return { month: periods[0].month, year: periods[0].year };
}

export interface ResponseWithClient extends ResponseRow {
  client: Pick<ClientRow, "id" | "company_name" | "contact_name" | "status">;
}

async function getResponsesForSurvey(surveyId: string): Promise<ResponseWithClient[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("responses")
    .select("*, client:clients(id, company_name, contact_name, status)")
    .eq("survey_id", surveyId);
  return (data as unknown as ResponseWithClient[]) ?? [];
}

async function getInvitationCounts(surveyId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("survey_invitations").select("status").eq("survey_id", surveyId);
  const total = data?.length ?? 0;
  const answered = data?.filter((i) => i.status === "answered").length ?? 0;
  return { total, answered, pending: total - answered };
}

export interface DimensionAverage {
  code: string;
  label: string;
  average: number;
}

async function getDimensionAverages(surveyId: string): Promise<DimensionAverage[]> {
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, code, is_mhs")
    .eq("survey_id", surveyId)
    .eq("is_mhs", true);
  if (!questions || questions.length === 0) return [];

  const { data: answers } = await supabase
    .from("response_answers")
    .select("question_id, numeric_value")
    .in(
      "question_id",
      questions.map((q) => q.id)
    );

  return questions.map((q) => {
    const values = (answers ?? [])
      .filter((a) => a.question_id === q.id && a.numeric_value != null)
      .map((a) => a.numeric_value as number);
    const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { code: q.code, label: DIMENSION_LABELS[q.code] ?? q.code, average: Math.round(average * 100) / 100 };
  });
}

export interface DashboardAlert {
  clientId: string;
  companyName: string;
  type: "detractor" | "mhs_drop" | "nps_drop" | "critical_feedback" | "low_retention";
  message: string;
}

export interface DashboardData {
  survey: SurveyRow | null;
  nps: number;
  mhsPercentage: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  totalResponses: number;
  totalInvitations: number;
  responseRate: number;
  clientsAtRisk: number;
  previous: { nps: number; mhsPercentage: number; responseRate: number } | null;
  dimensionAverages: DimensionAverage[];
  alerts: DashboardAlert[];
  retention: ReturnType<typeof calculateRetentionIndex>;
}

export async function getDashboardData(
  month: number,
  year: number,
  thresholds: HealthThresholds
): Promise<DashboardData> {
  const survey = await getSurveyByPeriod(month, year);

  const empty: DashboardData = {
    survey: null,
    nps: 0,
    mhsPercentage: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
    promoterPct: 0,
    passivePct: 0,
    detractorPct: 0,
    totalResponses: 0,
    totalInvitations: 0,
    responseRate: 0,
    clientsAtRisk: 0,
    previous: null,
    dimensionAverages: [],
    alerts: [],
    retention: calculateRetentionIndex([]),
  };
  if (!survey) return empty;

  const [responses, invitationCounts, dimensionAverages] = await Promise.all([
    getResponsesForSurvey(survey.id),
    getInvitationCounts(survey.id),
    getDimensionAverages(survey.id),
  ]);

  const { npsResult, mhsAvgPercentage } = aggregateResponses(responses);
  const responseRate = invitationCounts.total > 0 ? (invitationCounts.answered / invitationCounts.total) * 100 : 0;

  const clientsAtRisk = responses.filter(
    (r) => mhsPercentageToHealth(r.mhs_percentage ?? 0, thresholds) === "risk"
  ).length;

  // Previous period, for month-over-month deltas.
  const prevDate = new Date(year, month - 2, 1);
  const prevSurvey = await getSurveyByPeriod(prevDate.getMonth() + 1, prevDate.getFullYear());
  let previous: DashboardData["previous"] = null;
  if (prevSurvey) {
    const [prevResponses, prevInvitationCounts] = await Promise.all([
      getResponsesForSurvey(prevSurvey.id),
      getInvitationCounts(prevSurvey.id),
    ]);
    const prevAgg = aggregateResponses(prevResponses);
    previous = {
      nps: prevAgg.npsResult.nps,
      mhsPercentage: prevAgg.mhsAvgPercentage,
      responseRate:
        prevInvitationCounts.total > 0 ? (prevInvitationCounts.answered / prevInvitationCounts.total) * 100 : 0,
    };
  }

  // Alerts: detractors, low retention, critical feedback, and drops vs previous month per client.
  const alerts: DashboardAlert[] = [];
  for (const r of responses) {
    const companyName = r.client?.company_name ?? "Cliente";
    if (isDetractorAlert(r.nps_score, thresholds)) {
      alerts.push({
        clientId: r.client_id,
        companyName,
        type: "detractor",
        message: `Cliente detrator (NPS ${r.nps_score})`,
      });
    }
    if (isLowRetentionAlert(r.retention_answer, thresholds)) {
      alerts.push({
        clientId: r.client_id,
        companyName,
        type: "low_retention",
        message: "Baixa percepção de indispensabilidade",
      });
    }
  }

  if (prevSurvey) {
    const prevResponses = await getResponsesForSurvey(prevSurvey.id);
    const prevByClient = new Map(prevResponses.map((r) => [r.client_id, r]));
    for (const r of responses) {
      const prev = prevByClient.get(r.client_id);
      if (!prev) continue;
      const npsDrop = prev.nps_score - r.nps_score;
      if (npsDrop >= 3) {
        alerts.push({
          clientId: r.client_id,
          companyName: r.client?.company_name ?? "Cliente",
          type: "nps_drop",
          message: `NPS caiu de ${prev.nps_score} para ${r.nps_score}`,
        });
      }
      const mhsDrop = (prev.mhs_percentage ?? 0) - (r.mhs_percentage ?? 0);
      if (mhsDrop >= 10) {
        alerts.push({
          clientId: r.client_id,
          companyName: r.client?.company_name ?? "Cliente",
          type: "mhs_drop",
          message: `MHS caiu de ${Math.round(prev.mhs_percentage ?? 0)} para ${Math.round(r.mhs_percentage ?? 0)}`,
        });
      }
    }
  }

  return {
    survey,
    nps: npsResult.nps,
    mhsPercentage: mhsAvgPercentage,
    promoters: npsResult.promoters,
    passives: npsResult.passives,
    detractors: npsResult.detractors,
    promoterPct: Math.round(npsResult.promoterPct),
    passivePct: Math.round(npsResult.passivePct),
    detractorPct: Math.round(npsResult.detractorPct),
    totalResponses: responses.length,
    totalInvitations: invitationCounts.total,
    responseRate: Math.round(responseRate * 10) / 10,
    clientsAtRisk,
    previous,
    dimensionAverages,
    alerts,
    retention: calculateRetentionIndex(responses.map((r) => r.retention_answer).filter((v): v is number => v != null)),
  };
}

export interface EvolutionPoint {
  month: number;
  year: number;
  nps: number;
  mhsPercentage: number;
  responseRate: number;
}

export async function getEvolutionSeries(limit = 12): Promise<EvolutionPoint[]> {
  const supabase = await createClient();
  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, month, year")
    .order("year", { ascending: true })
    .order("month", { ascending: true });
  if (!surveys) return [];

  const relevant = surveys.slice(-limit);
  const points: EvolutionPoint[] = [];
  for (const survey of relevant) {
    const [responses, invitationCounts] = await Promise.all([
      getResponsesForSurvey(survey.id),
      getInvitationCounts(survey.id),
    ]);
    const { npsResult, mhsAvgPercentage } = aggregateResponses(responses);
    points.push({
      month: survey.month,
      year: survey.year,
      nps: npsResult.nps,
      mhsPercentage: mhsAvgPercentage,
      responseRate: invitationCounts.total > 0 ? (invitationCounts.answered / invitationCounts.total) * 100 : 0,
    });
  }
  return points;
}

// ----------------------------------------------------------------------------
// Clients
// ----------------------------------------------------------------------------

export interface ClientWithLatest extends ClientRow {
  latestNps: number | null;
  latestMhsPercentage: number | null;
  latestHealth: HealthStatus | null;
  lastResponseAt: string | null;
  hasRespondedLatestSurvey: boolean;
}

export async function getClientsWithLatestMetrics(thresholds: HealthThresholds): Promise<ClientWithLatest[]> {
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("*").order("company_name");
  if (!clients) return [];

  const latestPeriod = await getLatestPeriod();
  const latestSurvey = latestPeriod ? await getSurveyByPeriod(latestPeriod.month, latestPeriod.year) : null;

  const { data: latestResponsesRaw } = await supabase
    .from("responses")
    .select("client_id, nps_score, mhs_percentage, submitted_at")
    .order("submitted_at", { ascending: false });

  const latestByClient = new Map<string, { nps_score: number; mhs_percentage: number | null; submitted_at: string }>();
  for (const r of latestResponsesRaw ?? []) {
    if (!latestByClient.has(r.client_id)) {
      latestByClient.set(r.client_id, r);
    }
  }

  let answeredLatestSurveyClientIds = new Set<string>();
  if (latestSurvey) {
    const { data: invitations } = await supabase
      .from("survey_invitations")
      .select("client_id, status")
      .eq("survey_id", latestSurvey.id)
      .eq("status", "answered");
    answeredLatestSurveyClientIds = new Set((invitations ?? []).map((i) => i.client_id));
  }

  return clients.map((c) => {
    const latest = latestByClient.get(c.id);
    return {
      ...c,
      latestNps: latest?.nps_score ?? null,
      latestMhsPercentage: latest?.mhs_percentage ?? null,
      latestHealth: latest ? mhsPercentageToHealth(latest.mhs_percentage ?? 0, thresholds) : null,
      lastResponseAt: latest?.submitted_at ?? null,
      hasRespondedLatestSurvey: answeredLatestSurveyClientIds.has(c.id),
    };
  });
}

export async function getClientById(id: string): Promise<ClientRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export interface ClientHistoryPoint {
  surveyId: string;
  month: number;
  year: number;
  nps: number;
  mhsPercentage: number;
  mhsAverage: number;
  health: HealthStatus;
  submittedAt: string;
  feedback: string | null;
  retentionAnswer: number | null;
  responseId: string;
}

export async function getClientHistory(clientId: string, thresholds: HealthThresholds): Promise<ClientHistoryPoint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("responses")
    .select("*, survey:surveys(id, month, year)")
    .eq("client_id", clientId)
    .order("submitted_at", { ascending: true });

  return (data ?? []).map((r) => {
    const row = r as unknown as ResponseRow & { survey: { id: string; month: number; year: number } };
    return {
      surveyId: row.survey.id,
      month: row.survey.month,
      year: row.survey.year,
      nps: row.nps_score,
      mhsPercentage: row.mhs_percentage ?? 0,
      mhsAverage: row.mhs_average ?? 0,
      health: mhsPercentageToHealth(row.mhs_percentage ?? 0, thresholds),
      submittedAt: row.submitted_at,
      feedback: row.feedback,
      retentionAnswer: row.retention_answer,
      responseId: row.id,
    };
  });
}

export async function getClientStatusCounts(status?: ClientStatus) {
  const supabase = await createClient();
  let query = supabase.from("clients").select("id", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count } = await query;
  return count ?? 0;
}

// ----------------------------------------------------------------------------
// Surveys
// ----------------------------------------------------------------------------

export interface SurveyWithCounts extends SurveyRow {
  total: number;
  answered: number;
}

export async function getSurveys(): Promise<SurveyWithCounts[]> {
  const supabase = await createClient();
  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (!surveys) return [];

  const results: SurveyWithCounts[] = [];
  for (const survey of surveys) {
    const counts = await getInvitationCounts(survey.id);
    results.push({ ...survey, total: counts.total, answered: counts.answered });
  }
  return results;
}

export interface InvitationWithClient {
  id: string;
  token: string;
  status: "pending" | "answered";
  created_at: string;
  answered_at: string | null;
  client: Pick<ClientRow, "id" | "company_name" | "contact_name" | "email" | "whatsapp">;
  response: { nps_score: number; mhs_percentage: number | null; id: string } | null;
}

export interface SurveyDetail extends SurveyRow {
  invitations: InvitationWithClient[];
}

export async function getSurveyDetail(id: string): Promise<SurveyDetail | null> {
  const supabase = await createClient();
  const { data: survey } = await supabase.from("surveys").select("*").eq("id", id).maybeSingle();
  if (!survey) return null;

  const { data: invitations } = await supabase
    .from("survey_invitations")
    .select("id, token, status, created_at, answered_at, client:clients(id, company_name, contact_name, email, whatsapp)")
    .eq("survey_id", id)
    .order("created_at", { ascending: true });

  const { data: responses } = await supabase
    .from("responses")
    .select("id, invitation_id, nps_score, mhs_percentage")
    .eq("survey_id", id);

  const responseByInvitation = new Map((responses ?? []).map((r) => [r.invitation_id, r]));

  return {
    ...survey,
    invitations: ((invitations ?? []) as unknown as InvitationWithClient[]).map((inv) => ({
      ...inv,
      response: responseByInvitation.get(inv.id) ?? null,
    })),
  };
}

// ----------------------------------------------------------------------------
// Responses
// ----------------------------------------------------------------------------

export interface ResponseListItem extends ResponseRow {
  client: Pick<ClientRow, "id" | "company_name" | "contact_name">;
  survey: Pick<SurveyRow, "id" | "month" | "year">;
}

export async function getAllResponses(surveyId?: string): Promise<ResponseListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("responses")
    .select("*, client:clients(id, company_name, contact_name), survey:surveys(id, month, year)")
    .order("submitted_at", { ascending: false });
  if (surveyId) query = query.eq("survey_id", surveyId);
  const { data } = await query;
  return (data as unknown as ResponseListItem[]) ?? [];
}

export interface ResponseDetail extends ResponseRow {
  client: ClientRow;
  survey: SurveyRow;
  answers: { code: string; question: string; question_type: string; numeric_value: number | null; text_value: string | null }[];
}

export async function getResponseDetail(id: string): Promise<ResponseDetail | null> {
  const supabase = await createClient();
  const { data: response } = await supabase
    .from("responses")
    .select("*, client:clients(*), survey:surveys(*)")
    .eq("id", id)
    .maybeSingle();
  if (!response) return null;

  const { data: answers } = await supabase
    .from("response_answers")
    .select("numeric_value, text_value, question:survey_questions(code, question, question_type, order)")
    .eq("response_id", id);

  const sortedAnswers = (answers ?? [])
    .map((a) => {
      const q = a.question as unknown as { code: string; question: string; question_type: string; order: number };
      return { code: q.code, question: q.question, question_type: q.question_type, order: q.order, numeric_value: a.numeric_value, text_value: a.text_value };
    })
    .sort((a, b) => a.order - b.order);

  return { ...(response as unknown as ResponseDetail), answers: sortedAnswers };
}
