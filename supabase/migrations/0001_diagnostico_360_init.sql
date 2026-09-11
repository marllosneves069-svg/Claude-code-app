-- ============================================================================
-- Diagnóstico Empresarial 360 — schema
-- ============================================================================
-- This app uses its OWN Supabase project (separate from any other app that
-- may share this repository). Run this migration against that project.
--
-- Security model (same approach used elsewhere in this repo):
--   * RLS is enabled on every table.
--   * Only the `authenticated` role (future admin/consulta area) and the
--     `service_role` (server-only, used by the public diagnostic flow) can
--     read/write these tables. The `anon` role has NO policies — the public
--     wizard never talks to Postgres with the anon key, it goes through a
--     Next.js Route Handler that uses the service-role key on the server
--     (src/lib/supabase/diagnostico-admin.ts), scoped to exactly one insert
--     (submit) and one lookup by id (result page).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- enums
-- ----------------------------------------------------------------------------
create type diagnostico_segmento as enum (
  'brindes_personalizados',
  'grafica',
  'comunicacao_visual',
  'personalizados',
  'varios_segmentos',
  'outro'
);

create type diagnostico_pilar as enum (
  'marketing',
  'comercial',
  'pessoas',
  'operacao',
  'financeiro',
  'gestao'
);

create type diagnostico_classificacao as enum (
  'critico',
  'atencao',
  'em_desenvolvimento',
  'estruturado'
);

create type diagnostico_nivel_alerta as enum ('critico', 'atencao');

create type diagnostico_status as enum ('em_andamento', 'concluido');

-- ----------------------------------------------------------------------------
-- diagnosticos — one row per diagnostic taken (profile + computed result)
-- ----------------------------------------------------------------------------
create table diagnosticos (
  id uuid primary key default gen_random_uuid(),

  -- identificação e perfil da empresa
  nome text not null,
  empresa text not null,
  whatsapp text not null,
  email text not null,
  cidade text not null,
  estado text not null,
  segmento diagnostico_segmento not null,
  segmento_outro text,
  tempo_empresa text not null,
  faturamento_mensal text not null,
  quantidade_pessoas text not null,
  quantidade_vendedores text not null,
  leads_mensais text not null,
  investimento_anuncios text not null,
  ticket_medio text not null,
  modelo_operacional text not null,
  funcao_principal text not null,
  maior_problema text not null,

  -- notas por pilar (0-100) e nota geral
  nota_marketing numeric(5, 2) not null,
  nota_comercial numeric(5, 2) not null,
  nota_pessoas numeric(5, 2) not null,
  nota_operacao numeric(5, 2) not null,
  nota_financeiro numeric(5, 2) not null,
  nota_gestao numeric(5, 2) not null,
  nota_geral numeric(5, 2) not null,
  classificacao diagnostico_classificacao not null,

  -- gargalos: colunas de enum (fáceis de filtrar/agrupar) + detalhe em jsonb
  -- (severidade calculada e explicação, na ordem principal -> terciário)
  gargalo_principal diagnostico_pilar,
  gargalo_secundario diagnostico_pilar,
  gargalo_terciario diagnostico_pilar,
  gargalos_detalhe jsonb not null default '[]'::jsonb,

  -- achados do motor de regras de cruzamento entre pilares (arquitetura
  -- pronta para receber mais regras sem mudança de schema)
  achados_regras jsonb not null default '[]'::jsonb,

  -- alertas individuais (respostas 0/2 = crítico, 5 = atenção)
  alertas jsonb not null default '[]'::jsonb,

  -- reservado para a interpretação por IA (fase futura)
  diagnostico_gerado text,

  status diagnostico_status not null default 'concluido',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index diagnosticos_created_at_idx on diagnosticos (created_at desc);
create index diagnosticos_classificacao_idx on diagnosticos (classificacao);
create index diagnosticos_segmento_idx on diagnosticos (segmento);

-- ----------------------------------------------------------------------------
-- diagnostico_respostas — one row per answered question (audit trail, and
-- what lets us recompute/expand scoring rules later without re-collecting
-- data)
-- ----------------------------------------------------------------------------
create table diagnostico_respostas (
  id uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references diagnosticos (id) on delete cascade,
  pilar diagnostico_pilar not null,
  codigo text not null, -- e.g. 'MKT01' .. 'GES06'
  opcao_index smallint not null check (opcao_index between 0 and 4),
  pontuacao smallint not null check (pontuacao in (0, 2, 5, 8, 10)),
  nivel_alerta diagnostico_nivel_alerta,
  created_at timestamptz not null default now(),
  unique (diagnostico_id, codigo)
);

create index diagnostico_respostas_diagnostico_idx on diagnostico_respostas (diagnostico_id);
create index diagnostico_respostas_pilar_idx on diagnostico_respostas (pilar);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table diagnosticos enable row level security;
alter table diagnostico_respostas enable row level security;

-- Future admin/consulta area: any authenticated user has full access.
create policy "authenticated_full_access" on diagnosticos
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on diagnostico_respostas
  for all to authenticated using (true) with check (true);

-- No policies for `anon`: the public wizard is served exclusively by
-- server-side route handlers using the service-role key.
