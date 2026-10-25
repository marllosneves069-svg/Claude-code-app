-- ============================================================================
-- Performance dashboard — Meta Ads + Tiny (Olist) synced data
-- ============================================================================
-- Security model:
--   * Same as 0001: RLS enabled everywhere, no policies for `anon`.
--   * Logged-in admins (`authenticated`) can only READ these tables. Every
--     write comes from the sync job (cron route, "Atualizar agora" action or
--     `npm run sync`), which runs server-side with the service-role key and
--     bypasses RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- meta_campaign_daily — one row per campaign per day (Meta Ads insights)
-- ----------------------------------------------------------------------------
create table meta_campaign_daily (
  date date not null,
  campaign_id text not null,
  campaign_name text not null,
  spend numeric(12, 2) not null default 0,
  impressions integer not null default 0,
  -- Daily reach. NOT additive across days — period reach is fetched from the
  -- Meta API directly (see src/lib/integrations/meta.ts#getPeriodReach).
  reach integer not null default 0,
  link_clicks integer not null default 0,
  messaging_conversations integer not null default 0,
  leads integer not null default 0,
  meta_purchases integer not null default 0,
  meta_purchase_value numeric(12, 2) not null default 0,
  synced_at timestamptz not null default now(),
  primary key (date, campaign_id)
);

create index meta_campaign_daily_date_idx on meta_campaign_daily (date);

-- ----------------------------------------------------------------------------
-- tiny_orders — sales orders (pedidos de venda) from Tiny
-- ----------------------------------------------------------------------------
-- situacao_group buckets Tiny's situação into what the dashboard needs:
--   open     → "Em aberto" (counted as orçamento em aberto)
--   purchase → Aprovado, Preparando envio, Faturado, Pronto para envio,
--              Enviado, Entregue (counted as venda / faturamento)
--   excluded → Cancelado, Dados incompletos, Não entregue, anything unknown
create type tiny_situacao_group as enum ('open', 'purchase', 'excluded');

create table tiny_orders (
  tiny_id text primary key,
  numero text,
  numero_ecommerce text,
  data_pedido date not null,
  situacao text not null,
  situacao_group tiny_situacao_group not null,
  valor numeric(12, 2) not null default 0,
  cliente_nome text,
  vendedor_nome text,
  ecommerce text,
  items_synced_at timestamptz,
  synced_at timestamptz not null default now()
);

create index tiny_orders_data_pedido_idx on tiny_orders (data_pedido);
create index tiny_orders_items_pending_idx on tiny_orders (situacao_group) where items_synced_at is null;

-- ----------------------------------------------------------------------------
-- tiny_order_items
-- ----------------------------------------------------------------------------
create table tiny_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references tiny_orders (tiny_id) on delete cascade,
  product_id text,
  sku text,
  descricao text not null,
  quantidade numeric(12, 3) not null default 0,
  valor_unitario numeric(12, 2) not null default 0
);

create index tiny_order_items_order_idx on tiny_order_items (order_id);

-- ----------------------------------------------------------------------------
-- tiny_products — catalog + stock
-- ----------------------------------------------------------------------------
create table tiny_products (
  tiny_id text primary key,
  sku text,
  nome text not null,
  preco numeric(12, 2),
  preco_custo numeric(12, 2),
  situacao text,
  estoque numeric(12, 3),
  estoque_synced_at timestamptz,
  synced_at timestamptz not null default now()
);

create index tiny_products_sku_idx on tiny_products (sku);

-- ----------------------------------------------------------------------------
-- sync_runs — audit log of every sync, also used for incremental cursors
-- ----------------------------------------------------------------------------
create type sync_source as enum ('meta', 'tiny');
create type sync_status as enum ('running', 'success', 'partial', 'error');

create table sync_runs (
  id uuid primary key default gen_random_uuid(),
  source sync_source not null,
  trigger text not null,
  status sync_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text,
  stats jsonb not null default '{}'::jsonb
);

create index sync_runs_source_started_idx on sync_runs (source, started_at desc);

-- ----------------------------------------------------------------------------
-- settings — ad tax rate used on the performance dashboard
-- ----------------------------------------------------------------------------
insert into settings (key, value) values
  ('ad_tax_rate', jsonb_build_object('rate', 0.1215))
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Row Level Security — read-only for authenticated, writes via service role
-- ----------------------------------------------------------------------------
alter table meta_campaign_daily enable row level security;
alter table tiny_orders enable row level security;
alter table tiny_order_items enable row level security;
alter table tiny_products enable row level security;
alter table sync_runs enable row level security;

create policy "authenticated_read" on meta_campaign_daily for select to authenticated using (true);
create policy "authenticated_read" on tiny_orders for select to authenticated using (true);
create policy "authenticated_read" on tiny_order_items for select to authenticated using (true);
create policy "authenticated_read" on tiny_products for select to authenticated using (true);
create policy "authenticated_read" on sync_runs for select to authenticated using (true);
