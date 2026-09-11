import { nomePilar } from "./pilares";
import type { AchadoRegra, AlertaDiagnostico, DiagnosticoPilarId, GargaloIdentificado, NotasPilares } from "./types";

/**
 * Motor de regras de cruzamento entre pilares.
 *
 * O gargalo principal NUNCA é decidido só pela menor nota isolada: cada
 * pilar recebe uma "severidade" combinando (a) o quanto a nota está longe de
 * 100, (b) quantos alertas críticos/atenção ele concentra e (c) se alguma
 * regra de cruzamento entre pilares o aponta como prioridade. Isso permite,
 * por exemplo, que Comercial suba de prioridade mesmo com nota razoável se
 * Marketing está alto e Comercial baixo (vazamento comercial), ou que Gestão
 * suba de prioridade quando os demais pilares estão OK (dependência do
 * proprietário).
 *
 * Para adicionar uma nova regra, basta acrescentar um item a REGRAS_CRUZAMENTO
 * — nenhuma outra parte do sistema precisa mudar.
 */

const LIMIAR_ALTO = 70;
const LIMIAR_BAIXO = 45;

function alto(nota: number): boolean {
  return nota >= LIMIAR_ALTO;
}

function baixo(nota: number): boolean {
  return nota < LIMIAR_BAIXO;
}

function razoavel(nota: number): boolean {
  return nota >= LIMIAR_BAIXO;
}

interface RegraCruzamento {
  id: string;
  avaliar: (notas: NotasPilares) => Omit<AchadoRegra, "regraId"> | null;
  /** Bônus de severidade aplicado a cada pilar relacionado quando a regra dispara. */
  bonusSeveridade: number;
}

const REGRAS_CRUZAMENTO: RegraCruzamento[] = [
  {
    id: "marketing_alto_comercial_baixo",
    bonusSeveridade: 22,
    avaliar: (n) =>
      alto(n.marketing) && baixo(n.comercial)
        ? {
            pilaresRelacionados: ["marketing", "comercial"],
            titulo: "Possível vazamento comercial",
            explicacao:
              "O Marketing está gerando oportunidades de forma consistente, mas o Comercial não está convertendo essa demanda em vendas na mesma proporção.",
          }
        : null,
  },
  {
    id: "marketing_baixo_comercial_alto",
    bonusSeveridade: 18,
    avaliar: (n) =>
      baixo(n.marketing) && alto(n.comercial)
        ? {
            pilaresRelacionados: ["marketing", "comercial"],
            titulo: "Possível falta de geração de oportunidades",
            explicacao:
              "O time Comercial converte bem, mas o volume de oportunidades geradas pelo Marketing é o que está limitando o crescimento.",
          }
        : null,
  },
  {
    id: "marketing_baixo_comercial_baixo",
    bonusSeveridade: 20,
    avaliar: (n) =>
      baixo(n.marketing) && baixo(n.comercial)
        ? {
            pilaresRelacionados: ["marketing", "comercial"],
            titulo: "Estrutura comercial precisa vir antes de escalar aquisição",
            explicacao:
              "Marketing e Comercial estão, os dois, com maturidade baixa. Investir em mais geração de demanda antes de estruturar o processo comercial tende a desperdiçar investimento.",
          }
        : null,
  },
  {
    id: "comercial_alto_operacao_baixa",
    bonusSeveridade: 20,
    avaliar: (n) =>
      alto(n.comercial) && baixo(n.operacao)
        ? {
            pilaresRelacionados: ["comercial", "operacao"],
            titulo: "Crescimento limitado pela operação",
            explicacao:
              "O Comercial está vendendo bem, mas a estrutura de Operação e Produção não acompanha esse ritmo — risco de atraso, retrabalho e queda na qualidade de entrega.",
          }
        : null,
  },
  {
    id: "pessoas_baixa_gestao_baixa",
    bonusSeveridade: 18,
    avaliar: (n) =>
      baixo(n.pessoas) && baixo(n.gestao)
        ? {
            pilaresRelacionados: ["pessoas", "gestao"],
            titulo: "Possível problema de liderança e gestão de performance",
            explicacao:
              "Pessoas e Gestão estão, os dois, com maturidade baixa — um sinal de que a equipe pode não ter liderança, metas ou acompanhamento de performance claros.",
          }
        : null,
  },
  {
    id: "marketing_comercial_altos_financeiro_baixo",
    bonusSeveridade: 24,
    avaliar: (n) =>
      alto(n.marketing) && alto(n.comercial) && baixo(n.financeiro)
        ? {
            pilaresRelacionados: ["financeiro"],
            titulo: "Possível crescimento sem controle de rentabilidade",
            explicacao:
              "Marketing e Comercial estão puxando crescimento, mas o Financeiro não tem a mesma maturidade — risco real de crescer faturamento sem crescer lucro.",
          }
        : null,
  },
  {
    id: "gestao_baixa_demais_razoaveis",
    bonusSeveridade: 16,
    avaliar: (n) =>
      baixo(n.gestao) &&
      razoavel(n.marketing) &&
      razoavel(n.comercial) &&
      razoavel(n.pessoas) &&
      razoavel(n.operacao) &&
      razoavel(n.financeiro)
        ? {
            pilaresRelacionados: ["gestao"],
            titulo: "Possível dependência excessiva do proprietário",
            explicacao:
              "As demais áreas operam em nível razoável, mas a Gestão está com maturidade baixa — um padrão comum de empresas que ainda dependem do dono para decidir e resolver praticamente tudo.",
          }
        : null,
  },
];

export function avaliarRegrasCruzamento(notas: NotasPilares): AchadoRegra[] {
  const achados: AchadoRegra[] = [];
  for (const regra of REGRAS_CRUZAMENTO) {
    const resultado = regra.avaliar(notas);
    if (resultado) {
      achados.push({ regraId: regra.id, ...resultado });
    }
  }
  return achados;
}

const TODOS_PILARES: DiagnosticoPilarId[] = ["marketing", "comercial", "pessoas", "operacao", "financeiro", "gestao"];

/**
 * Ranking de gargalos: combina distância da nota até 100, peso dos alertas
 * individuais e bônus das regras de cruzamento disparadas. Retorna também os
 * achados brutos das regras (para exibição de apoio na tela de resultado).
 */
export function identificarGargalos(
  notas: NotasPilares,
  alertas: AlertaDiagnostico[]
): {
  achados: AchadoRegra[];
  principal: GargaloIdentificado | null;
  secundario: GargaloIdentificado | null;
  terciario: GargaloIdentificado | null;
} {
  const achados = avaliarRegrasCruzamento(notas);

  const severidade = new Map<DiagnosticoPilarId, number>(TODOS_PILARES.map((p) => [p, 100 - notas[p]]));
  const explicacaoPorPilar = new Map<DiagnosticoPilarId, { titulo: string; explicacao: string }>();

  for (const alerta of alertas) {
    const acrescimo = alerta.nivel === "critico" ? 15 : 5;
    severidade.set(alerta.pilar, (severidade.get(alerta.pilar) ?? 0) + acrescimo);
  }

  const bonusPorRegraId = new Map(REGRAS_CRUZAMENTO.map((r) => [r.id, r.bonusSeveridade]));

  for (const achado of achados) {
    const bonus = bonusPorRegraId.get(achado.regraId) ?? 15;
    for (const pilar of achado.pilaresRelacionados) {
      severidade.set(pilar, (severidade.get(pilar) ?? 0) + bonus);
      // A primeira regra a disparar para este pilar define a explicação exibida.
      if (!explicacaoPorPilar.has(pilar)) {
        explicacaoPorPilar.set(pilar, { titulo: achado.titulo, explicacao: achado.explicacao });
      }
    }
  }

  const ranking = TODOS_PILARES.slice()
    .sort((a, b) => (severidade.get(b) ?? 0) - (severidade.get(a) ?? 0))
    .map((pilar) => criarGargalo(pilar, severidade.get(pilar) ?? 0, notas, alertas, explicacaoPorPilar));

  return {
    achados,
    principal: ranking[0] ?? null,
    secundario: ranking[1] ?? null,
    terciario: ranking[2] ?? null,
  };
}

function criarGargalo(
  pilar: DiagnosticoPilarId,
  severidade: number,
  notas: NotasPilares,
  alertas: AlertaDiagnostico[],
  explicacaoPorPilar: Map<DiagnosticoPilarId, { titulo: string; explicacao: string }>
): GargaloIdentificado {
  const explicacaoRegra = explicacaoPorPilar.get(pilar);
  if (explicacaoRegra) {
    return { pilar, severidade, titulo: explicacaoRegra.titulo, explicacao: explicacaoRegra.explicacao };
  }

  const criticos = alertas.filter((a) => a.pilar === pilar && a.nivel === "critico").length;
  const atencoes = alertas.filter((a) => a.pilar === pilar && a.nivel === "atencao").length;

  const partesAlerta: string[] = [];
  if (criticos > 0) partesAlerta.push(`${criticos} resposta${criticos > 1 ? "s" : ""} em nível crítico`);
  if (atencoes > 0) partesAlerta.push(`${atencoes} ponto${atencoes > 1 ? "s" : ""} de atenção`);

  const explicacao =
    partesAlerta.length > 0
      ? `Nota ${notas[pilar].toFixed(0)}/100, com ${partesAlerta.join(" e ")} nas respostas deste pilar.`
      : `Nota ${notas[pilar].toFixed(0)}/100 — o pilar com menor maturidade estrutural relativa entre os seis avaliados.`;

  return {
    pilar,
    severidade,
    titulo: `Maturidade a desenvolver em ${nomePilar(pilar)}`,
    explicacao,
  };
}
