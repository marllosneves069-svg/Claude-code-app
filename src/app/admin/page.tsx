import Link from "next/link";
import { getDashboardData, getEvolutionSeries, getPeriods } from "@/lib/queries";
import { getHealthThresholds } from "@/lib/settings";
import { monthLabel } from "@/lib/metrics";
import { PeriodSelector } from "@/components/admin/PeriodSelector";
import { StatCard } from "@/components/admin/StatCard";
import { EvolutionChart } from "@/components/admin/charts/EvolutionChart";
import { DistributionChart } from "@/components/admin/charts/DistributionChart";
import { DimensionsChart } from "@/components/admin/charts/DimensionsChart";
import { RetentionChart } from "@/components/admin/charts/RetentionChart";
import { AlertsList } from "@/components/admin/AlertsList";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const [periods, thresholds] = await Promise.all([getPeriods(), getHealthThresholds()]);

  if (periods.length === 0) {
    return <EmptyDashboard />;
  }

  const month = Number(params.month) || periods[0].month;
  const year = Number(params.year) || periods[0].year;

  const [data, evolution] = await Promise.all([
    getDashboardData(month, year, thresholds),
    getEvolutionSeries(),
  ]);

  const npsDelta = data.previous ? data.nps - data.previous.nps : null;
  const mhsDelta = data.previous ? data.mhsPercentage - data.previous.mhsPercentage : null;
  const rateDelta = data.previous ? data.responseRate - data.previous.responseRate : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Visão da carteira</h1>
          <p className="text-sm text-[var(--muted)]">{monthLabel(month, year)}</p>
        </div>
        <PeriodSelector periods={periods} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="NPS" value={data.nps > 0 ? `+${data.nps}` : data.nps} delta={npsDelta} deltaLabel=" pts vs mês anterior" />
        <StatCard label="MHS médio" value={Math.round(data.mhsPercentage)} suffix="/100" delta={mhsDelta} deltaLabel="% vs mês anterior" />
        <StatCard
          label="Respostas"
          value={`${data.totalResponses}/${data.totalInvitations}`}
          delta={rateDelta}
          deltaLabel="pp vs mês anterior"
          helper={`${data.responseRate}% de taxa de resposta`}
        />
        <StatCard label="Clientes em risco" value={data.clientsAtRisk} deltaGoodDirection="down" helper="MHS abaixo do limite de risco" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Promotores" value={data.promoters} suffix={`(${data.promoterPct}%)`} />
        <StatCard label="Passivos" value={data.passives} suffix={`(${data.passivePct}%)`} />
        <StatCard label="Detratores" value={data.detractors} suffix={`(${data.detractorPct}%)`} />
        <StatCard
          label="Índice de retenção"
          value={`${data.retention.veryDisappointedPct}%`}
          helper='"Muito desapontado" se saíssem'
        />
      </div>

      <div className="card p-5">
        <h2 className="mb-1 text-base font-semibold">Evolução da saúde da carteira</h2>
        <p className="mb-2 text-sm text-[var(--muted)]">NPS e MHS mês a mês</p>
        <EvolutionChart data={evolution} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-base font-semibold">Distribuição do NPS</h2>
          <DistributionChart promoters={data.promoters} passives={data.passives} detractors={data.detractors} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 text-base font-semibold">Média por dimensão</h2>
          <DimensionsChart data={data.dimensionAverages} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold">Clientes que precisam de atenção</h2>
          <AlertsList alerts={data.alerts} />
        </div>
        <div className="card p-5">
          <h2 className="mb-1 text-base font-semibold">Dependência percebida</h2>
          <p className="mb-2 text-sm text-[var(--muted)]">
            &ldquo;Quão desapontado ficaria se deixássemos de atender você?&rdquo;
          </p>
          <RetentionChart retention={data.retention} />
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-lg font-semibold text-[var(--foreground)]">Nenhuma pesquisa ainda</h1>
      <p className="text-sm text-[var(--muted)]">
        Cadastre seus clientes e crie a primeira rodada mensal para começar a ver os resultados aqui.
      </p>
      <div className="flex gap-3">
        <Link href="/admin/clientes/novo" className="btn-secondary">
          Cadastrar cliente
        </Link>
        <Link href="/admin/pesquisas/nova" className="btn-primary">
          Criar pesquisa mensal
        </Link>
      </div>
    </div>
  );
}
