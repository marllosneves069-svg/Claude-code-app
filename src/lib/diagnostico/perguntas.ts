import { PILARES } from "./pilares";
import type { DiagnosticoPilarId, OpcaoPergunta, PerguntaDiagnostico } from "./types";

/**
 * PLACEHOLDER — fase 1 (estrutura).
 *
 * As 36 perguntas completas do Diagnóstico Empresarial 360 ainda serão
 * fornecidas. Para não inventar conteúdo de negócio, cada pergunta abaixo é
 * gerada estruturalmente (código, pilar, ordem e 5 alternativas com a escala
 * de pontuação oficial 0/2/5/8/10), com enunciado e rótulos de alternativa
 * genéricos — só descrevendo a posição na escala, do nível mais básico ao
 * mais estruturado.
 *
 * Para adicionar o conteúdo real de uma pergunta, edite apenas `enunciado` e
 * os `label` das opções do item correspondente — a estrutura (ordem das
 * pontuações, cálculo, alertas) não muda.
 */
const OPCOES_PLACEHOLDER: OpcaoPergunta[] = [
  { label: "Alternativa A — nível mais básico", pontuacao: 0 },
  { label: "Alternativa B — nível inicial", pontuacao: 2 },
  { label: "Alternativa C — nível intermediário", pontuacao: 5 },
  { label: "Alternativa D — nível avançado", pontuacao: 8 },
  { label: "Alternativa E — nível mais estruturado", pontuacao: 10 },
];

function criarPerguntasPlaceholder(pilar: DiagnosticoPilarId, prefixo: string): PerguntaDiagnostico[] {
  return Array.from({ length: 6 }, (_, i) => {
    const codigo = `${prefixo}${String(i + 1).padStart(2, "0")}`;
    return {
      codigo,
      pilar,
      ordem: i + 1,
      enunciado: `Pergunta ${codigo} — conteúdo a ser definido`,
      opcoes: OPCOES_PLACEHOLDER.map((o) => ({ ...o })),
    };
  });
}

export const PERGUNTAS: PerguntaDiagnostico[] = PILARES.flatMap((p) => criarPerguntasPlaceholder(p.id, p.prefixo));

export const PERGUNTAS_POR_CODIGO = new Map(PERGUNTAS.map((p) => [p.codigo, p]));

export function perguntasDoPilar(pilar: DiagnosticoPilarId): PerguntaDiagnostico[] {
  return PERGUNTAS.filter((p) => p.pilar === pilar).sort((a, b) => a.ordem - b.ordem);
}

export const TOTAL_PERGUNTAS = PERGUNTAS.length; // 36
export const MAX_PONTOS_POR_PILAR = 60; // 6 perguntas x 10 pontos
