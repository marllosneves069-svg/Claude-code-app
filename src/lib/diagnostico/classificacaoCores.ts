import type { Classificacao } from "./types";

export const CLASSIFICACAO_COR_HEX: Record<Classificacao, string> = {
  critico: "#dc2626",
  atencao: "#d97706",
  em_desenvolvimento: "#4f46e5",
  estruturado: "#16a34a",
};

export const CLASSIFICACAO_COR_CLASSES: Record<Classificacao, { bg: string; fg: string }> = {
  critico: { bg: "bg-red-50", fg: "text-red-600" },
  atencao: { bg: "bg-amber-50", fg: "text-amber-600" },
  em_desenvolvimento: { bg: "bg-indigo-50", fg: "text-[var(--accent)]" },
  estruturado: { bg: "bg-green-50", fg: "text-green-600" },
};
