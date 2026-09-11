import { PILARES } from "./pilares";
import { MAX_PONTOS_POR_PILAR, PERGUNTAS_POR_CODIGO, TOTAL_PERGUNTAS } from "./perguntas";
import { identificarGargalos } from "./regras";
import type {
  AlertaDiagnostico,
  Classificacao,
  DiagnosticoPilarId,
  NotasPilares,
  RespostaEnviada,
  RespostaResolvida,
  ResultadoDiagnostico,
} from "./types";

/** Erro de validação de payload — nunca deve acontecer vindo do wizard oficial. */
export class RespostasInvalidasError extends Error {}

/**
 * Resolve as respostas enviadas pelo cliente (apenas código + índice da
 * alternativa) contra o catálogo canônico de perguntas, para nunca confiar
 * em pontuação vinda do navegador.
 */
export function resolverRespostas(respostas: RespostaEnviada[]): RespostaResolvida[] {
  if (respostas.length !== TOTAL_PERGUNTAS) {
    throw new RespostasInvalidasError(`Esperado ${TOTAL_PERGUNTAS} respostas, recebido ${respostas.length}.`);
  }

  const codigosVistos = new Set<string>();

  return respostas.map((r) => {
    if (codigosVistos.has(r.codigo)) {
      throw new RespostasInvalidasError(`Pergunta ${r.codigo} respondida mais de uma vez.`);
    }
    codigosVistos.add(r.codigo);

    const pergunta = PERGUNTAS_POR_CODIGO.get(r.codigo);
    if (!pergunta) {
      throw new RespostasInvalidasError(`Pergunta desconhecida: ${r.codigo}.`);
    }

    const opcao = pergunta.opcoes[r.opcaoIndex];
    if (!opcao) {
      throw new RespostasInvalidasError(`Alternativa inválida para ${r.codigo}: ${r.opcaoIndex}.`);
    }

    return {
      codigo: r.codigo,
      pilar: pergunta.pilar,
      opcaoIndex: r.opcaoIndex,
      pontuacao: opcao.pontuacao,
    };
  });
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularNotaPilar(respostasDoPilar: RespostaResolvida[]): number {
  const soma = respostasDoPilar.reduce((acc, r) => acc + r.pontuacao, 0);
  return arredondar((soma / MAX_PONTOS_POR_PILAR) * 100);
}

export function calcularNotasPilares(respostas: RespostaResolvida[]): NotasPilares {
  const notas = {} as NotasPilares;
  for (const pilar of PILARES) {
    const respostasDoPilar = respostas.filter((r) => r.pilar === pilar.id);
    notas[pilar.id] = calcularNotaPilar(respostasDoPilar);
  }
  return notas;
}

export function calcularNotaGeral(notas: NotasPilares): number {
  const valores = Object.values(notas);
  return arredondar(valores.reduce((a, b) => a + b, 0) / valores.length);
}

export function classificar(nota: number): Classificacao {
  if (nota < 40) return "critico";
  if (nota < 60) return "atencao";
  if (nota < 80) return "em_desenvolvimento";
  return "estruturado";
}

export const CLASSIFICACAO_LABEL: Record<Classificacao, string> = {
  critico: "Crítico",
  atencao: "Atenção",
  em_desenvolvimento: "Em desenvolvimento",
  estruturado: "Estruturado",
};

/** Respostas 0 ou 2 -> alerta crítico. Respostas 5 -> ponto de atenção. */
export function identificarAlertas(respostas: RespostaResolvida[]): AlertaDiagnostico[] {
  const alertas: AlertaDiagnostico[] = [];
  for (const r of respostas) {
    if (r.pontuacao <= 2) {
      alertas.push({ codigo: r.codigo, pilar: r.pilar, nivel: "critico" });
    } else if (r.pontuacao === 5) {
      alertas.push({ codigo: r.codigo, pilar: r.pilar, nivel: "atencao" });
    }
  }
  return alertas;
}

export function nivelAlertaDaResposta(pontuacao: number): "critico" | "atencao" | null {
  if (pontuacao <= 2) return "critico";
  if (pontuacao === 5) return "atencao";
  return null;
}

/**
 * Ponto de entrada único: recebe as respostas já resolvidas e devolve o
 * resultado completo do diagnóstico (notas, classificação, alertas e
 * gargalos priorizados pelo motor de regras — nunca só a nota mais baixa).
 */
export function processarDiagnostico(respostas: RespostaResolvida[]): ResultadoDiagnostico {
  const notas = calcularNotasPilares(respostas);
  const notaGeral = calcularNotaGeral(notas);
  const classificacao = classificar(notaGeral);
  const alertas = identificarAlertas(respostas);
  const { achados, principal, secundario, terciario } = identificarGargalos(notas, alertas);

  return {
    notas,
    notaGeral,
    classificacao,
    alertas,
    achadosRegras: achados,
    gargaloPrincipal: principal,
    gargaloSecundario: secundario,
    gargaloTerciario: terciario,
  };
}

export function agruparPorPilar(respostas: RespostaResolvida[]): Record<DiagnosticoPilarId, RespostaResolvida[]> {
  const grupos = {} as Record<DiagnosticoPilarId, RespostaResolvida[]>;
  for (const pilar of PILARES) {
    grupos[pilar.id] = respostas.filter((r) => r.pilar === pilar.id);
  }
  return grupos;
}
