export type DiagnosticoPilarId = "marketing" | "comercial" | "pessoas" | "operacao" | "financeiro" | "gestao";

export type Classificacao = "critico" | "atencao" | "em_desenvolvimento" | "estruturado";

export type NivelAlerta = "critico" | "atencao";

export type Pontuacao = 0 | 2 | 5 | 8 | 10;

export type SegmentoId =
  | "brindes_personalizados"
  | "grafica"
  | "comunicacao_visual"
  | "personalizados"
  | "varios_segmentos"
  | "outro";

export interface OpcaoPergunta {
  label: string;
  pontuacao: Pontuacao;
}

export interface PerguntaDiagnostico {
  codigo: string; // ex.: "MKT01"
  pilar: DiagnosticoPilarId;
  ordem: number;
  enunciado: string;
  opcoes: OpcaoPergunta[];
}

/** Perfil da empresa coletado antes das perguntas pontuadas. */
export interface PerfilEmpresa {
  nome: string;
  empresa: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  segmento: SegmentoId;
  segmentoOutro: string;
  tempoEmpresa: string;
  faturamentoMensal: string;
  quantidadePessoas: string;
  quantidadeVendedores: string;
  leadsMensais: string;
  investimentoAnuncios: string;
  ticketMedio: string;
  modeloOperacional: string;
  funcaoPrincipal: string;
  maiorProblema: string;
}

/** O que o wizard envia para a API: só o índice escolhido, nunca a pontuação. */
export interface RespostaEnviada {
  codigo: string;
  opcaoIndex: number;
}

/** Resposta já resolvida no servidor a partir do catálogo canônico de perguntas. */
export interface RespostaResolvida {
  codigo: string;
  pilar: DiagnosticoPilarId;
  opcaoIndex: number;
  pontuacao: Pontuacao;
}

export type NotasPilares = Record<DiagnosticoPilarId, number>;

export interface AlertaDiagnostico {
  codigo: string;
  pilar: DiagnosticoPilarId;
  nivel: NivelAlerta;
}

/** Um achado gerado por uma regra de cruzamento entre pilares. */
export interface AchadoRegra {
  regraId: string;
  pilaresRelacionados: DiagnosticoPilarId[];
  titulo: string;
  explicacao: string;
}

export interface GargaloIdentificado {
  pilar: DiagnosticoPilarId;
  severidade: number;
  titulo: string;
  explicacao: string;
}

export interface ResultadoDiagnostico {
  notas: NotasPilares;
  notaGeral: number;
  classificacao: Classificacao;
  alertas: AlertaDiagnostico[];
  achadosRegras: AchadoRegra[];
  gargaloPrincipal: GargaloIdentificado | null;
  gargaloSecundario: GargaloIdentificado | null;
  gargaloTerciario: GargaloIdentificado | null;
}
