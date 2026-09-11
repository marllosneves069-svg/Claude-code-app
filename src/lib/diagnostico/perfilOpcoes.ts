import type { SegmentoId } from "./types";

export const SEGMENTOS: { id: SegmentoId; label: string }[] = [
  { id: "brindes_personalizados", label: "Brindes personalizados" },
  { id: "grafica", label: "Gráfica" },
  { id: "comunicacao_visual", label: "Comunicação visual" },
  { id: "personalizados", label: "Personalizados" },
  { id: "varios_segmentos", label: "Atua em vários desses segmentos" },
  { id: "outro", label: "Outro" },
];

export const TEMPO_EMPRESA_OPCOES = ["Menos de 1 ano", "1–2 anos", "3–5 anos", "6–10 anos", "Mais de 10 anos"];

export const FATURAMENTO_MENSAL_OPCOES = [
  "Até R$ 30 mil",
  "R$ 30 mil–R$ 50 mil",
  "R$ 50 mil–R$ 100 mil",
  "R$ 100 mil–R$ 200 mil",
  "R$ 200 mil–R$ 300 mil",
  "R$ 300 mil–R$ 500 mil",
  "Acima de R$ 500 mil",
];

export const QUANTIDADE_PESSOAS_OPCOES = ["Somente proprietário", "2–5", "6–10", "11–20", "21–50", "Mais de 50"];

export const QUANTIDADE_VENDEDORES_OPCOES = ["Somente proprietário", "1", "2", "3–5", "6–10", "Mais de 10"];

export const LEADS_MENSAIS_OPCOES = [
  "Não sei",
  "Menos de 50",
  "50–100",
  "101–300",
  "301–500",
  "501–1.000",
  "Mais de 1.000",
];

export const INVESTIMENTO_ANUNCIOS_OPCOES = [
  "R$ 0",
  "Até R$ 1.000",
  "R$ 1.001–R$ 3.000",
  "R$ 3.001–R$ 5.000",
  "R$ 5.001–R$ 10.000",
  "R$ 10.001–R$ 20.000",
  "Acima de R$ 20.000",
];

export const TICKET_MEDIO_OPCOES = [
  "Não sei",
  "Até R$ 500",
  "R$ 501–R$ 1.000",
  "R$ 1.001–R$ 3.000",
  "R$ 3.001–R$ 5.000",
  "R$ 5.001–R$ 10.000",
  "Acima de R$ 10.000",
];

export const MODELO_OPERACIONAL_OPCOES = [
  "Produz praticamente tudo",
  "Produz a maior parte",
  "Produção e terceirização equilibradas",
  "Terceiriza a maior parte",
  "Terceiriza praticamente tudo",
];

export const FUNCAO_PRINCIPAL_OPCOES = [
  "Vendas",
  "Produção/operação",
  "Administrativo",
  "Financeiro",
  "Gestão de pessoas",
  "Marketing",
  "Resolver problemas de vários setores",
  "Estratégia e gestão",
];

export const UF_OPCOES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];
