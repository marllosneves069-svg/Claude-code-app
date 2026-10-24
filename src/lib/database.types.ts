// Hand-written types matching supabase/migrations/0001_init.sql and 0002_performance.sql.
// If you have the Supabase CLI, you can replace this with:
//   supabase gen types typescript --linked > src/lib/database.types.ts

export type ClientStatus = "active" | "paused" | "ended";
export type SurveyStatus = "draft" | "in_progress" | "closed";
export type QuestionType = "nps" | "scale_5" | "scale_5_inverted" | "text";
export type InvitationStatus = "pending" | "answered";
export type TinySituacaoGroup = "open" | "purchase" | "excluded";
export type SyncSource = "meta" | "tiny";
export type SyncStatus = "running" | "success" | "partial" | "error";

export interface ClientRow {
  id: string;
  company_name: string;
  contact_name: string;
  email: string | null;
  whatsapp: string | null;
  service: string | null;
  start_date: string | null;
  status: ClientStatus;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveyRow {
  id: string;
  name: string;
  month: number;
  year: number;
  status: SurveyStatus;
  is_demo: boolean;
  created_at: string;
  closed_at: string | null;
}

export interface SurveyQuestionRow {
  id: string;
  survey_id: string;
  code: string;
  question: string;
  question_type: QuestionType;
  order: number;
  is_mhs: boolean;
  is_retention: boolean;
  weight: number;
  created_at: string;
}

export interface SurveyInvitationRow {
  id: string;
  survey_id: string;
  client_id: string;
  token: string;
  status: InvitationStatus;
  created_at: string;
  answered_at: string | null;
}

export interface ResponseRow {
  id: string;
  invitation_id: string;
  survey_id: string;
  client_id: string;
  nps_score: number;
  mhs_average: number | null;
  mhs_percentage: number | null;
  retention_answer: number | null;
  feedback: string | null;
  submitted_at: string;
}

export interface ResponseAnswerRow {
  id: string;
  response_id: string;
  question_id: string;
  numeric_value: number | null;
  text_value: string | null;
}

export interface SettingsRow {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface MetaCampaignDailyRow {
  date: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  reach: number;
  link_clicks: number;
  messaging_conversations: number;
  leads: number;
  meta_purchases: number;
  meta_purchase_value: number;
  synced_at: string;
}

export interface TinyOrderRow {
  tiny_id: string;
  numero: string | null;
  numero_ecommerce: string | null;
  data_pedido: string;
  situacao: string;
  situacao_group: TinySituacaoGroup;
  valor: number;
  cliente_nome: string | null;
  vendedor_nome: string | null;
  ecommerce: string | null;
  items_synced_at: string | null;
  synced_at: string;
}

export interface TinyOrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  sku: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

export interface TinyProductRow {
  tiny_id: string;
  sku: string | null;
  nome: string;
  preco: number | null;
  preco_custo: number | null;
  situacao: string | null;
  estoque: number | null;
  estoque_synced_at: string | null;
  synced_at: string;
}

export interface SyncRunRow {
  id: string;
  source: SyncSource;
  trigger: string;
  status: SyncStatus;
  started_at: string;
  finished_at: string | null;
  error: string | null;
  stats: Record<string, unknown>;
}

export interface Database {
  public: {
    Tables: {
      clients: { Row: ClientRow; Insert: Partial<ClientRow>; Update: Partial<ClientRow> };
      surveys: { Row: SurveyRow; Insert: Partial<SurveyRow>; Update: Partial<SurveyRow> };
      survey_questions: {
        Row: SurveyQuestionRow;
        Insert: Partial<SurveyQuestionRow>;
        Update: Partial<SurveyQuestionRow>;
      };
      survey_invitations: {
        Row: SurveyInvitationRow;
        Insert: Partial<SurveyInvitationRow>;
        Update: Partial<SurveyInvitationRow>;
      };
      responses: { Row: ResponseRow; Insert: Partial<ResponseRow>; Update: Partial<ResponseRow> };
      response_answers: {
        Row: ResponseAnswerRow;
        Insert: Partial<ResponseAnswerRow>;
        Update: Partial<ResponseAnswerRow>;
      };
      settings: { Row: SettingsRow; Insert: Partial<SettingsRow>; Update: Partial<SettingsRow> };
      meta_campaign_daily: {
        Row: MetaCampaignDailyRow;
        Insert: Partial<MetaCampaignDailyRow>;
        Update: Partial<MetaCampaignDailyRow>;
      };
      tiny_orders: { Row: TinyOrderRow; Insert: Partial<TinyOrderRow>; Update: Partial<TinyOrderRow> };
      tiny_order_items: {
        Row: TinyOrderItemRow;
        Insert: Partial<TinyOrderItemRow>;
        Update: Partial<TinyOrderItemRow>;
      };
      tiny_products: { Row: TinyProductRow; Insert: Partial<TinyProductRow>; Update: Partial<TinyProductRow> };
      sync_runs: { Row: SyncRunRow; Insert: Partial<SyncRunRow>; Update: Partial<SyncRunRow> };
    };
  };
}
