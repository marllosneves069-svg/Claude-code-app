import type { DiagnosticoPilarId } from "./types";

export interface PilarMeta {
  id: DiagnosticoPilarId;
  nome: string;
  prefixo: string;
  ordem: number;
  descricaoEtapa: string;
}

export const PILARES: PilarMeta[] = [
  {
    id: "marketing",
    nome: "Marketing",
    prefixo: "MKT",
    ordem: 1,
    descricaoEtapa: "Como sua empresa atrai a atenção e gera oportunidades.",
  },
  {
    id: "comercial",
    nome: "Comercial",
    prefixo: "COM",
    ordem: 2,
    descricaoEtapa: "Como as oportunidades são conduzidas até a venda.",
  },
  {
    id: "pessoas",
    nome: "Pessoas",
    prefixo: "PES",
    ordem: 3,
    descricaoEtapa: "Como a equipe é formada, liderada e desenvolvida.",
  },
  {
    id: "operacao",
    nome: "Operação e Produção",
    prefixo: "OPE",
    ordem: 4,
    descricaoEtapa: "Como o que foi vendido é entregue no dia a dia.",
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    prefixo: "FIN",
    ordem: 5,
    descricaoEtapa: "Como a empresa controla custos, preços e rentabilidade.",
  },
  {
    id: "gestao",
    nome: "Gestão",
    prefixo: "GES",
    ordem: 6,
    descricaoEtapa: "Como a empresa é conduzida além da atuação do proprietário.",
  },
];

export const PILARES_POR_ID = new Map(PILARES.map((p) => [p.id, p]));

export function nomePilar(id: DiagnosticoPilarId): string {
  return PILARES_POR_ID.get(id)?.nome ?? id;
}
