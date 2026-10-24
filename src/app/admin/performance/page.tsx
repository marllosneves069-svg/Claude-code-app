import { resolveRange, rangeLabel } from "@/lib/date-range";
import { getAdTaxRate } from "@/lib/settings";
import { getLastSyncRuns, getPerformanceData, getTopProducts } from "@/lib/performance-queries";
import {
  formatBRL,
  formatInt,
  formatPct,
  formatReportText,
  formatRoas,
  pctChange,
} from "@/lib/performance-metrics";
import { formatDateTime } from "@/lib/utils";
import type { SyncRunRow } from "@/lib/database.types";
import { StatCard } from "@/components/admin/StatCard";
import { DateRangeSelector } from "@/components/admin/performance/DateRangeSelector";
import { SyncButton } from "@/components/admin/performance/SyncButton";
import { CopyReportButton } from "@/components/admin/performance/CopyReportButton";
import { FunnelBars } from "@/components/admin/performance/FunnelBars";
import { PerformanceDailyChart } from "@/components/admin/charts/PerformanceDailyChart";

// The "Atualizar agora" Server Action runs a full sync, which can take a while
// because of Tiny's rate limit.
export const maxDuration = 300;

const DELTA_LABEL = "% vs período anterior";

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { preset, range } = resolveRange(await searchParams);
  const taxRate = await getAdTaxRate();
  const [data, products, syncRuns] = await Promise.all([
    getPerformanceData(range, taxRate),
    getTopProducts(range),
    getLastSyncRuns(),
  ]);
  const { funnel, previous } = data;
  const period = rangeLabel(range);
  const neverSynced = !syncRuns.meta && !syncRuns.tiny;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Performance</h1>
          <p className="text-sm text-[var(--muted)]">Meta Ads + vendas do Tiny · {period}</p>
          <SyncStatus runs={syncRuns} />
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <DateRangeSelector key={`${range.from}-${range.to}`} preset={preset} range={range} />
          <CopyReportButton text={formatReportText(funnel, period)} />
          <SyncButton />
        </div>
      </div>

      {neverSynced ? (
        <NotConfigured />
      ) : (
        <>
          {!data.hasData && (
            <div className="card px-5 py-4 text-sm text-[var(--muted)]">
              Nenhum dado sincronizado para este período.
            </div>
          )}

          <Section title="Mídia" subtitle="Meta Ads">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Pessoas alcançadas"
                value={funnel.reach == null ? "—" : `${funnel.reachIsApproximate ? "≈ " : ""}${formatInt(funnel.reach)}`}
                {...delta(funnel.reach, previous.reach)}
                helper={funnel.reachIsApproximate ? "Soma diária (Meta indisponível)" : undefined}
              />
              <StatCard label="Impressões" value={formatInt(funnel.impressions)} {...delta(funnel.impressions, previous.impressions)} />
              <StatCard label="Clicaram no link" value={formatInt(funnel.linkClicks)} {...delta(funnel.linkClicks, previous.linkClicks)} />
              <StatCard
                label="Contatos / form nativo"
                value={formatInt(funnel.contacts)}
                {...delta(funnel.contacts, previous.contacts)}
              />
              <StatCard
                label="Custo por contato"
                value={formatBRL(funnel.costPerContact)}
                {...delta(funnel.costPerContact, previous.costPerContact, "down")}
              />
              <StatCard label="Investimento em anúncios" value={formatBRL(funnel.spend)} {...delta(funnel.spend, previous.spend)} />
              <StatCard
                label={`Imposto (${formatPct(funnel.taxRate, 2)})`}
                value={formatBRL(funnel.tax)}
                helper={`Total com imposto: ${formatBRL(funnel.spend + funnel.tax)}`}
              />
            </div>
          </Section>

          <Section title="Comercial" subtitle="Pedidos do Tiny">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Orçamentos em aberto"
                value={formatInt(funnel.openOrders)}
                {...delta(funnel.openOrders, previous.openOrders)}
              />
              <StatCard label="Valor parado em orçamento" value={formatBRL(funnel.openValue)} {...delta(funnel.openValue, previous.openValue)} />
              <StatCard
                label="Custo por orçamento"
                value={formatBRL(funnel.costPerOpenOrder)}
                {...delta(funnel.costPerOpenOrder, previous.costPerOpenOrder, "down")}
              />
              <StatCard label="Compraram" value={formatInt(funnel.purchases)} {...delta(funnel.purchases, previous.purchases)} />
              <StatCard
                label="Custo por venda"
                value={formatBRL(funnel.costPerPurchase)}
                {...delta(funnel.costPerPurchase, previous.costPerPurchase, "down")}
              />
              <StatCard
                label="Conversão contato → venda"
                value={formatPct(funnel.contactToPurchaseRate)}
                {...delta(funnel.contactToPurchaseRate, previous.contactToPurchaseRate)}
              />
            </div>
          </Section>

          <Section title="Resultado">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Faturamento" value={formatBRL(funnel.revenue)} {...delta(funnel.revenue, previous.revenue)} />
              <StatCard label="ROAS" value={formatRoas(funnel.roas)} {...delta(funnel.roas, previous.roas)} helper="Faturamento ÷ investimento" />
              <StatCard label="Ticket médio" value={formatBRL(funnel.averageTicket)} {...delta(funnel.averageTicket, previous.averageTicket)} />
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h2 className="mb-1 text-base font-semibold">Investimento × faturamento</h2>
              <p className="mb-2 text-sm text-[var(--muted)]">Por dia, com o ROAS diário</p>
              <PerformanceDailyChart data={data.daily} />
            </div>
            <div className="card p-5">
              <h2 className="mb-1 text-base font-semibold">Funil comercial</h2>
              <p className="mb-5 text-sm text-[var(--muted)]">Do contato à venda</p>
              <FunnelBars
                steps={[
                  { label: "Contatos", value: funnel.contacts },
                  { label: "Orçamentos em aberto", value: funnel.openOrders },
                  { label: "Compraram", value: funnel.purchases },
                ]}
              />
            </div>
          </div>

          <CampaignsTable campaigns={data.campaigns} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card overflow-hidden lg:col-span-2">
              <h2 className="px-5 pt-5 text-base font-semibold">Produtos mais vendidos</h2>
              <p className="px-5 pb-3 text-sm text-[var(--muted)]">Pedidos aprovados/faturados no período</p>
              <Table
                head={["Produto", "Qtd.", "Faturamento", "Margem bruta", "Estoque"]}
                rows={products.top.map((p) => [
                  <ProductName key="name" name={p.name} sku={p.sku} />,
                  formatInt(p.quantity),
                  formatBRL(p.revenue),
                  formatBRL(p.margin),
                  formatInt(p.stock),
                ])}
                empty="Nenhum item de pedido sincronizado no período."
              />
            </div>
            <div className="card overflow-hidden">
              <h2 className="px-5 pt-5 text-base font-semibold">Estoque baixo</h2>
              <p className="px-5 pb-3 text-sm text-[var(--muted)]">Produtos vendidos no período com até 5 un.</p>
              <Table
                head={["Produto", "Estoque"]}
                rows={products.lowStock.map((p) => [<ProductName key="name" name={p.name} sku={p.sku} />, formatInt(p.stock)])}
                empty="Nenhum produto com estoque baixo."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** StatCard delta props: % change vs the previous period of the same length. */
function delta(current: number | null, prev: number | null, deltaGoodDirection: "up" | "down" = "up") {
  return { delta: pctChange(current, prev), deltaLabel: DELTA_LABEL, deltaGoodDirection };
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        {title}
        {subtitle && <span className="font-normal normal-case tracking-normal"> · {subtitle}</span>}
      </h2>
      {children}
    </section>
  );
}

function CampaignsTable({ campaigns }: { campaigns: Awaited<ReturnType<typeof getPerformanceData>>["campaigns"] }) {
  return (
    <div className="card overflow-hidden">
      <h2 className="px-5 pt-5 text-base font-semibold">Campanhas</h2>
      <p className="px-5 pb-3 text-sm text-[var(--muted)]">ROAS Meta = valor de compra atribuído pelo pixel ÷ investimento</p>
      <Table
        head={["Campanha", "Investimento", "Impressões", "Cliques", "Contatos", "Custo/contato", "ROAS Meta"]}
        rows={campaigns.map((c) => [
          <span key="name" className="font-medium text-[var(--foreground)]">
            {c.campaign_name}
          </span>,
          formatBRL(c.spend),
          formatInt(c.impressions),
          formatInt(c.link_clicks),
          formatInt(c.contacts),
          formatBRL(c.costPerContact),
          formatRoas(c.metaRoas),
        ])}
        empty="Nenhuma campanha com investimento no período."
      />
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) {
    return <p className="px-5 pb-5 text-sm text-[var(--muted)]">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-[var(--border)] bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {head.map((h, i) => (
              <th key={h} className={i === 0 ? "px-5 py-2.5" : "px-4 py-2.5 text-right"}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, r) => (
            <tr key={r} className="border-b border-[var(--border)] last:border-0">
              {cells.map((cell, i) => (
                <td key={i} className={i === 0 ? "px-5 py-3" : "whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductName({ name, sku }: { name: string; sku: string | null }) {
  return (
    <div>
      <p className="font-medium text-[var(--foreground)]">{name}</p>
      {sku && <p className="text-xs text-[var(--muted)]">SKU {sku}</p>}
    </div>
  );
}

const SOURCE_LABEL = { meta: "Meta", tiny: "Tiny" } as const;
const STATUS_LABEL: Record<SyncRunRow["status"], string> = {
  running: "em andamento",
  success: "ok",
  partial: "parcial",
  error: "erro",
};

function SyncStatus({ runs }: { runs: Awaited<ReturnType<typeof getLastSyncRuns>> }) {
  const entries = (["meta", "tiny"] as const).flatMap((source) => {
    const run = runs[source];
    return run ? [{ source, run }] : [];
  });
  if (entries.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-[var(--muted)]">
      Última atualização:{" "}
      {entries.map(({ source, run }, i) => (
        <span key={source} title={run.error ?? undefined}>
          {i > 0 && " · "}
          {SOURCE_LABEL[source]} {formatDateTime(run.finished_at ?? run.started_at)} (
          <span className={run.status === "error" ? "text-[var(--danger)]" : undefined}>{STATUS_LABEL[run.status]}</span>)
        </span>
      ))}
    </p>
  );
}

function NotConfigured() {
  return (
    <div className="card mx-auto flex max-w-xl flex-col gap-3 p-6 text-sm text-[var(--muted)]">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Nenhum dado sincronizado ainda</h2>
      <p>Para começar:</p>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          Rode a migration <code>supabase/migrations/0002_performance.sql</code> no Supabase.
        </li>
        <li>
          Preencha <code>META_ACCESS_TOKEN</code>, <code>META_AD_ACCOUNT_ID</code> e <code>TINY_API_TOKEN</code> no{" "}
          <code>.env.local</code> (veja o README).
        </li>
        <li>
          Rode <code>npm run sync</code> para a primeira carga (ou clique em &ldquo;Atualizar agora&rdquo;).
        </li>
      </ol>
    </div>
  );
}
