import "server-only";
import { createDiagnosticoAdminClient } from "@/lib/supabase/diagnostico-admin";
import type {
  AchadoRegra,
  AlertaDiagnostico,
  Classificacao,
  DiagnosticoPilarId,
  GargaloIdentificado,
  NotasPilares,
  PerfilEmpresa,
  ResultadoDiagnostico,
} from "./types";

export interface DiagnosticoParaInserir {
  perfil: PerfilEmpresa;
  resultado: ResultadoDiagnostico;
}

export interface RespostaParaInserir {
  codigo: string;
  pilar: DiagnosticoPilarId;
  opcaoIndex: number;
  pontuacao: number;
  nivelAlerta: "critico" | "atencao" | null;
}

/** Insere o diagnóstico e suas respostas individuais. Retorna o id gerado. */
export async function salvarDiagnostico(
  dados: DiagnosticoParaInserir,
  respostas: RespostaParaInserir[]
): Promise<string> {
  const supabase = createDiagnosticoAdminClient();
  const { perfil, resultado } = dados;

  const gargalos = [resultado.gargaloPrincipal, resultado.gargaloSecundario, resultado.gargaloTerciario].filter(
    (g): g is GargaloIdentificado => g != null
  );

  const { data, error } = await supabase
    .from("diagnosticos")
    .insert({
      nome: perfil.nome,
      empresa: perfil.empresa,
      whatsapp: perfil.whatsapp,
      email: perfil.email,
      cidade: perfil.cidade,
      estado: perfil.estado,
      segmento: perfil.segmento,
      segmento_outro: perfil.segmento === "outro" ? perfil.segmentoOutro : null,
      tempo_empresa: perfil.tempoEmpresa,
      faturamento_mensal: perfil.faturamentoMensal,
      quantidade_pessoas: perfil.quantidadePessoas,
      quantidade_vendedores: perfil.quantidadeVendedores,
      leads_mensais: perfil.leadsMensais,
      investimento_anuncios: perfil.investimentoAnuncios,
      ticket_medio: perfil.ticketMedio,
      modelo_operacional: perfil.modeloOperacional,
      funcao_principal: perfil.funcaoPrincipal,
      maior_problema: perfil.maiorProblema,

      nota_marketing: resultado.notas.marketing,
      nota_comercial: resultado.notas.comercial,
      nota_pessoas: resultado.notas.pessoas,
      nota_operacao: resultado.notas.operacao,
      nota_financeiro: resultado.notas.financeiro,
      nota_gestao: resultado.notas.gestao,
      nota_geral: resultado.notaGeral,
      classificacao: resultado.classificacao,

      gargalo_principal: resultado.gargaloPrincipal?.pilar ?? null,
      gargalo_secundario: resultado.gargaloSecundario?.pilar ?? null,
      gargalo_terciario: resultado.gargaloTerciario?.pilar ?? null,
      gargalos_detalhe: gargalos,

      achados_regras: resultado.achadosRegras,
      alertas: resultado.alertas,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível salvar o diagnóstico.");
  }

  const linhasRespostas = respostas.map((r) => ({
    diagnostico_id: data.id,
    pilar: r.pilar,
    codigo: r.codigo,
    opcao_index: r.opcaoIndex,
    pontuacao: r.pontuacao,
    nivel_alerta: r.nivelAlerta,
  }));

  const { error: errorRespostas } = await supabase.from("diagnostico_respostas").insert(linhasRespostas);
  if (errorRespostas) {
    throw new Error(errorRespostas.message);
  }

  return data.id as string;
}

export interface DiagnosticoResultadoView {
  id: string;
  createdAt: string;
  perfil: PerfilEmpresa;
  notas: NotasPilares;
  notaGeral: number;
  classificacao: Classificacao;
  alertas: AlertaDiagnostico[];
  achadosRegras: AchadoRegra[];
  gargalos: GargaloIdentificado[];
  diagnosticoGerado: string | null;
}

export async function buscarDiagnosticoPorId(id: string): Promise<DiagnosticoResultadoView | null> {
  const supabase = createDiagnosticoAdminClient();

  const { data, error } = await supabase.from("diagnosticos").select("*").eq("id", id).maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    createdAt: data.created_at,
    perfil: {
      nome: data.nome,
      empresa: data.empresa,
      whatsapp: data.whatsapp,
      email: data.email,
      cidade: data.cidade,
      estado: data.estado,
      segmento: data.segmento,
      segmentoOutro: data.segmento_outro ?? "",
      tempoEmpresa: data.tempo_empresa,
      faturamentoMensal: data.faturamento_mensal,
      quantidadePessoas: data.quantidade_pessoas,
      quantidadeVendedores: data.quantidade_vendedores,
      leadsMensais: data.leads_mensais,
      investimentoAnuncios: data.investimento_anuncios,
      ticketMedio: data.ticket_medio,
      modeloOperacional: data.modelo_operacional,
      funcaoPrincipal: data.funcao_principal,
      maiorProblema: data.maior_problema,
    },
    notas: {
      marketing: Number(data.nota_marketing),
      comercial: Number(data.nota_comercial),
      pessoas: Number(data.nota_pessoas),
      operacao: Number(data.nota_operacao),
      financeiro: Number(data.nota_financeiro),
      gestao: Number(data.nota_gestao),
    },
    notaGeral: Number(data.nota_geral),
    classificacao: data.classificacao,
    alertas: data.alertas ?? [],
    achadosRegras: data.achados_regras ?? [],
    gargalos: data.gargalos_detalhe ?? [],
    diagnosticoGerado: data.diagnostico_gerado ?? null,
  };
}
