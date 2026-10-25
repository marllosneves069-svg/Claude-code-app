-- ============================================================================
-- NPS/MHS Platform — Initial schema
-- ============================================================================
-- Security model:
--   * All tables have RLS enabled.
--   * Only the `authenticated` role (logged-in admin users, via Supabase Auth)
--     and `service_role` (server-only, used by the public survey routes) can
--     read/write these tables. The `anon` role has NO policies at all — the
--     public survey pages never talk to Postgres with the anon key, they go
--     through Next.js Route Handlers that use the service-role key on the
--     server. This guarantees a client answering a survey can never query
--     another client's data, list clients, or see dashboard metrics.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- clients
-- ----------------------------------------------------------------------------
create type client_status as enum ('active', 'paused', 'ended');

create table clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text,
  whatsapp text,
  service text,
  start_date date,
  status client_status not null default 'active',
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_status_idx on clients (status);

-- ----------------------------------------------------------------------------
-- surveys (one monthly round)
-- ----------------------------------------------------------------------------
create type survey_status as enum ('draft', 'in_progress', 'closed');

create table surveys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2000 and 2100),
  status survey_status not null default 'in_progress',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (month, year)
);

-- ----------------------------------------------------------------------------
-- survey_questions (snapshot of the questionnaire used by a given survey,
-- so past rounds stay stable even if the question catalog evolves later)
-- ----------------------------------------------------------------------------
create type question_type as enum ('nps', 'scale_5', 'scale_5_inverted', 'text');

create table survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys (id) on delete cascade,
  code text not null, -- stable machine key, e.g. 'nps', 'satisfaction', 'retention', 'feedback'
  question text not null,
  question_type question_type not null,
  "order" smallint not null,
  is_mhs boolean not null default false,
  is_retention boolean not null default false,
  weight numeric not null default 1,
  created_at timestamptz not null default now(),
  unique (survey_id, code)
);

-- ----------------------------------------------------------------------------
-- survey_invitations — one per (survey, client), carries the public token
-- ----------------------------------------------------------------------------
create type invitation_status as enum ('pending', 'answered');

create table survey_invitations (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  status invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  unique (survey_id, client_id),
  unique (token)
);

create index survey_invitations_token_idx on survey_invitations (token);
create index survey_invitations_survey_idx on survey_invitations (survey_id);
create index survey_invitations_client_idx on survey_invitations (client_id);

-- ----------------------------------------------------------------------------
-- responses — one per invitation (enforced by the unique FK below)
-- ----------------------------------------------------------------------------
create table responses (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references survey_invitations (id) on delete cascade,
  survey_id uuid not null references surveys (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  nps_score smallint not null check (nps_score between 0 and 10),
  mhs_average numeric(4, 2),
  mhs_percentage numeric(5, 2),
  retention_answer smallint check (retention_answer between 1 and 5),
  feedback text,
  submitted_at timestamptz not null default now(),
  unique (invitation_id) -- hard constraint: one response per invitation/link
);

create index responses_survey_idx on responses (survey_id);
create index responses_client_idx on responses (client_id);

-- ----------------------------------------------------------------------------
-- response_answers — raw per-question answers (audit trail, future weighting)
-- ----------------------------------------------------------------------------
create table response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses (id) on delete cascade,
  question_id uuid not null references survey_questions (id) on delete cascade,
  numeric_value smallint,
  text_value text,
  unique (response_id, question_id)
);

-- ----------------------------------------------------------------------------
-- settings — single-row-per-key configuration (health thresholds, etc.)
-- ----------------------------------------------------------------------------
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('health_thresholds', jsonb_build_object(
    'healthyMin', 80,
    'attentionMin', 60,
    'detractorNpsMax', 6,
    'lowRetentionCodes', jsonb_build_array(4, 5)
  ));

-- ----------------------------------------------------------------------------
-- updated_at helper trigger
-- ----------------------------------------------------------------------------
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table clients enable row level security;
alter table surveys enable row level security;
alter table survey_questions enable row level security;
alter table survey_invitations enable row level security;
alter table responses enable row level security;
alter table response_answers enable row level security;
alter table settings enable row level security;

-- Admin (any authenticated user) has full access. This is an internal,
-- single-tenant tool for the agency's own team — every logged-in user is
-- staff. service_role (used server-side for the public survey flow)
-- bypasses RLS entirely by default, so no explicit policy is needed for it.
create policy "authenticated_full_access" on clients
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on surveys
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on survey_questions
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on survey_invitations
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on responses
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on response_answers
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on settings
  for all to authenticated using (true) with check (true);

-- No policies are created for the `anon` role on any table above: the
-- public /pesquisa/[token] flow is served exclusively by server-side route
-- handlers using the service-role key, scoped tightly to a single token
-- lookup and a single insert. This is what prevents a client from ever
-- listing other clients, other tokens, or dashboard data.
