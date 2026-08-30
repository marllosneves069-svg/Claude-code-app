import type { QuestionType } from "@/lib/database.types";

export interface QuestionTemplate {
  code: string;
  question: string;
  question_type: QuestionType;
  order: number;
  is_mhs: boolean;
  is_retention: boolean;
  weight: number;
  placeholder?: string;
}

/**
 * The fixed questionnaire. Copied into `survey_questions` whenever a new
 * monthly survey is created, so historical rounds stay stable even if this
 * catalog changes later. `weight` is already wired into the MHS average so
 * per-question weighting can be introduced later without a schema change.
 */
export const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    code: "nps",
    question:
      "De 0 a 10, o quanto você recomendaria nossa empresa para outro empresário que busca melhorar seus resultados de marketing e vendas?",
    question_type: "nps",
    order: 1,
    is_mhs: false,
    is_retention: false,
    weight: 1,
  },
  {
    code: "satisfaction",
    question: "Pensando no último mês, qual é o seu nível geral de satisfação com o nosso trabalho?",
    question_type: "scale_5",
    order: 2,
    is_mhs: true,
    is_retention: false,
    weight: 1,
  },
  {
    code: "results",
    question: "Como você avalia os resultados que estamos gerando para sua empresa?",
    question_type: "scale_5",
    order: 3,
    is_mhs: true,
    is_retention: false,
    weight: 1,
  },
  {
    code: "strategy",
    question: "Como você avalia a clareza da estratégia e das próximas ações do seu projeto?",
    question_type: "scale_5",
    order: 4,
    is_mhs: true,
    is_retention: false,
    weight: 1,
  },
  {
    code: "communication",
    question: "Como você avalia nossa comunicação e agilidade no atendimento?",
    question_type: "scale_5",
    order: 5,
    is_mhs: true,
    is_retention: false,
    weight: 1,
  },
  {
    code: "proactivity",
    question: "Como você avalia nossa proatividade em identificar problemas e novas oportunidades?",
    question_type: "scale_5",
    order: 6,
    is_mhs: true,
    is_retention: false,
    weight: 1,
  },
  {
    code: "deadlines",
    question: "Como você avalia o cumprimento dos prazos e combinados?",
    question_type: "scale_5",
    order: 7,
    is_mhs: true,
    is_retention: false,
    weight: 1,
  },
  {
    code: "trust",
    question: "O quanto você sente confiança na gestão e nas decisões tomadas no seu projeto?",
    question_type: "scale_5",
    order: 8,
    is_mhs: true,
    is_retention: false,
    weight: 1,
  },
  {
    code: "value",
    question:
      "Considerando o investimento realizado, como você avalia o valor que entregamos para sua empresa?",
    question_type: "scale_5",
    order: 9,
    is_mhs: true,
    is_retention: false,
    weight: 1,
  },
  {
    code: "retention",
    question: "Quão desapontado você ficaria se a Up Growth deixasse de atender você?",
    question_type: "scale_5_inverted",
    order: 10,
    is_mhs: false,
    is_retention: true,
    weight: 1,
  },
  {
    code: "feedback",
    question: "Qual é o principal ponto que poderíamos melhorar para gerar mais valor para sua empresa?",
    question_type: "text",
    order: 11,
    is_mhs: false,
    is_retention: false,
    weight: 1,
    placeholder: "Conte para nós. Seu feedback é muito importante...",
  },
];

/** Labels for the 1-5 satisfaction scale faces, progressively more positive. */
export const SCALE_5_LABELS = [
  { value: 1, label: "Muito insatisfeito" },
  { value: 2, label: "Insatisfeito" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Satisfeito" },
  { value: 5, label: "Muito satisfeito" },
];

/** Labels for the retention question — order is fixed by the spec, meaning is inverted. */
export const RETENTION_LABELS = [
  { value: 1, label: "Muito desapontado" },
  { value: 2, label: "Desapontado" },
  { value: 3, label: "Indiferente" },
  { value: 4, label: "Pouco desapontado" },
  { value: 5, label: "Nada desapontado" },
];

export const DIMENSION_LABELS: Record<string, string> = {
  satisfaction: "Satisfação geral",
  results: "Resultados",
  strategy: "Estratégia",
  communication: "Atendimento",
  proactivity: "Proatividade",
  deadlines: "Prazos",
  trust: "Confiança",
  value: "Valor percebido",
};
