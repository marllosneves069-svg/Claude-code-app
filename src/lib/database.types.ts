// Hand-written types matching supabase/migrations/0001_init.sql.
// If you have the Supabase CLI, you can replace this with:
//   supabase gen types typescript --linked > src/lib/database.types.ts

export type ClientStatus = "active" | "paused" | "ended";
export type SurveyStatus = "draft" | "in_progress" | "closed";
export type QuestionType = "nps" | "scale_5" | "scale_5_inverted" | "text";
export type InvitationStatus = "pending" | "answered";

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
    };
  };
}
