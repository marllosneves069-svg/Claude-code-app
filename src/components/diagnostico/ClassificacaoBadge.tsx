import { CLASSIFICACAO_COR_CLASSES } from "@/lib/diagnostico/classificacaoCores";
import { CLASSIFICACAO_LABEL } from "@/lib/diagnostico/pontuacao";
import type { Classificacao } from "@/lib/diagnostico/types";

export function ClassificacaoBadge({ classificacao }: { classificacao: Classificacao }) {
  const cor = CLASSIFICACAO_COR_CLASSES[classificacao];
  return <span className={`badge ${cor.bg} ${cor.fg}`}>{CLASSIFICACAO_LABEL[classificacao]}</span>;
}
