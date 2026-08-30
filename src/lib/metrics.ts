import type { ResponseRow } from "@/lib/database.types";

export type NpsClass = "promoter" | "passive" | "detractor";
export type HealthStatus = "healthy" | "attention" | "risk";

export interface HealthThresholds {
  healthyMin: number; // MHS 0-100 >= healthyMin -> healthy
  attentionMin: number; // MHS 0-100 >= attentionMin -> attention, below -> risk
  detractorNpsMax: number; // nps_score <= this -> detractor alert
  lowRetentionCodes: number[]; // retention_answer values that trigger a "baixa aderência" alert
}

export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds = {
  healthyMin: 80,
  attentionMin: 60,
  detractorNpsMax: 6,
  lowRetentionCodes: [4, 5],
};

export function classifyNps(score: number): NpsClass {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export interface NpsResult {
  nps: number; // -100..100
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
}

/** Traditional NPS: %promoters - %detractors, over a set of 0-10 scores. */
export function calculateNps(scores: number[]): NpsResult {
  const total = scores.length;
  if (total === 0) {
    return { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0, promoterPct: 0, passivePct: 0, detractorPct: 0 };
  }
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  for (const score of scores) {
    const cls = classifyNps(score);
    if (cls === "promoter") promoters++;
    else if (cls === "passive") passives++;
    else detractors++;
  }
  const promoterPct = (promoters / total) * 100;
  const passivePct = (passives / total) * 100;
  const detractorPct = (detractors / total) * 100;
  const nps = Math.round(promoterPct - detractorPct);
  return { nps, promoters, passives, detractors, total, promoterPct, passivePct, detractorPct };
}

export interface WeightedAnswer {
  value: number; // 1-5
  weight: number;
}

export interface MhsResult {
  average: number; // 1-5
  percentage: number; // 0-100
}

/**
 * Monthly Health Score from a set of 1-5 answers (questions 2-9 by default).
 * Weight-ready: pass per-question weights (defaulting to 1) and the average
 * becomes a weighted mean without any call-site changes elsewhere.
 */
export function calculateMhs(answers: WeightedAnswer[]): MhsResult {
  if (answers.length === 0) return { average: 0, percentage: 0 };
  const weightSum = answers.reduce((acc, a) => acc + a.weight, 0);
  const valueSum = answers.reduce((acc, a) => acc + a.value * a.weight, 0);
  const average = weightSum > 0 ? valueSum / weightSum : 0;
  const percentage = ((average - 1) / 4) * 100;
  return {
    average: Math.round(average * 100) / 100,
    percentage: Math.round(percentage * 10) / 10,
  };
}

export function mhsPercentageToHealth(
  mhsPercentage: number,
  thresholds: HealthThresholds = DEFAULT_HEALTH_THRESHOLDS
): HealthStatus {
  if (mhsPercentage >= thresholds.healthyMin) return "healthy";
  if (mhsPercentage >= thresholds.attentionMin) return "attention";
  return "risk";
}

export function isDetractorAlert(
  npsScore: number,
  thresholds: HealthThresholds = DEFAULT_HEALTH_THRESHOLDS
): boolean {
  return npsScore <= thresholds.detractorNpsMax;
}

export function isLowRetentionAlert(
  retentionAnswer: number | null | undefined,
  thresholds: HealthThresholds = DEFAULT_HEALTH_THRESHOLDS
): boolean {
  if (retentionAnswer == null) return false;
  return thresholds.lowRetentionCodes.includes(retentionAnswer);
}

export const HEALTH_STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: "Saudável",
  attention: "Atenção",
  risk: "Risco",
};

export const HEALTH_STATUS_COLOR: Record<HealthStatus, string> = {
  healthy: "#16a34a",
  attention: "#d97706",
  risk: "#dc2626",
};

export const NPS_CLASS_LABEL: Record<NpsClass, string> = {
  promoter: "Promotor",
  passive: "Passivo",
  detractor: "Detrator",
};

/** Aggregate NPS + average MHS across a list of responses (e.g. one survey round). */
export function aggregateResponses(responses: Pick<ResponseRow, "nps_score" | "mhs_percentage">[]) {
  const npsResult = calculateNps(responses.map((r) => r.nps_score));
  const mhsValues = responses
    .map((r) => r.mhs_percentage)
    .filter((v): v is number => v != null);
  const mhsAvgPercentage =
    mhsValues.length > 0 ? mhsValues.reduce((a, b) => a + b, 0) / mhsValues.length : 0;
  return { npsResult, mhsAvgPercentage: Math.round(mhsAvgPercentage * 10) / 10 };
}

/** Retention ("dependência percebida") distribution + headline index. */
export function calculateRetentionIndex(retentionAnswers: number[]) {
  const total = retentionAnswers.length;
  const distribution = [1, 2, 3, 4, 5].map((value) => {
    const count = retentionAnswers.filter((a) => a === value).length;
    return { value, count, pct: total > 0 ? (count / total) * 100 : 0 };
  });
  const veryDisappointedPct = distribution[0]?.pct ?? 0;
  return { total, distribution, veryDisappointedPct: Math.round(veryDisappointedPct * 10) / 10 };
}

export function monthLabel(month: number, year: number): string {
  const names = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${names[month - 1]} de ${year}`;
}

export function monthShortLabel(month: number, year: number): string {
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${names[month - 1]}/${String(year).slice(2)}`;
}
