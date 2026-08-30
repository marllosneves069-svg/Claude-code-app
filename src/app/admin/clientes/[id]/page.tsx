import Link from "next/link";
import { notFound } from "next/navigation";
import { differenceInMonths } from "date-fns";
import { Pencil } from "lucide-react";
import { getClientById, getClientHistory } from "@/lib/queries";
import { getHealthThresholds } from "@/lib/settings";
import { isDetractorAlert, isLowRetentionAlert, monthLabel } from "@/lib/metrics";
import { HealthBadge, NpsBadge } from "@/components/admin/HealthBadge";
import { ClientHistoryChart } from "@/components/admin/charts/ClientHistoryChart";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteClientAction } from "@/lib/actions/clients";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { RETENTION_LABELS } from "@/lib/questions";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, thresholds] = await Promise.all([getClientById(id), getHealthThresholds()]);
  if (!client) notFound();

  const history = await getClientHistory(id, thresholds);
  const latest = history[history.length - 1] ?? null;

  const tenureMonths = client.start_date ? differenceInMonths(new Date(), new Date(client.start_date)) : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">{client.company_name}</h1>
            <StatusPill status={client.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {client.contact_name} · {client.service ?? "Serviço não informado"}
            {tenureMonths != null && ` · ${tenureMonths} meses como cliente`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/clientes/${client.id}/editar`} className="btn-secondary">
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <DeleteButton
            label="Excluir cliente"
            action={deleteClientAction.bind(null, client.id)}
            confirmMessage={`Excluir "${client.company_name}"? Isso apaga também todas as respostas e convites de pesquisa desse cliente. Não pode ser desfeito.`}
            className="border border-red-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="MHS atual" value={latest ? `${Math.round(latest.mhsPercentage)}/100` : "—"} />
        <MetricCard label="NPS atual" value={latest ? String(latest.nps) : "—"} />
        <div className="card p-5">
          <p className="text-sm font-medium text-[var(--muted)]">Classificação</p>
          <div className="mt-2">
            <HealthBadge status={latest?.health ?? null} />
          </div>
        </div>
        <MetricCard label="Última resposta" value={latest ? formatDate(latest.submittedAt) : "—"} />
      </div>

      {latest && isDetractorAlert(latest.nps, thresholds) && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠ Cliente detrator no último ciclo (NPS {latest.nps}).
        </div>
      )}
      {latest && isLowRetentionAlert(latest.retentionAnswer, thresholds) && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠ Baixa percepção de indispensabilidade no último ciclo.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-base font-semibold">Histórico de saúde (MHS)</h2>
          <ClientHistoryChart history={history} metric="mhs" />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-base font-semibold">Histórico de NPS</h2>
          <ClientHistoryChart history={history} metric="nps" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-base font-semibold">Histórico mensal</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                <th className="px-5 py-3">Mês</th>
                <th className="px-5 py-3">NPS</th>
                <th className="px-5 py-3">MHS</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Data da resposta</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h) => (
                <tr key={h.surveyId} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium">{monthLabel(h.month, h.year)}</td>
                  <td className="px-5 py-3.5">
                    <NpsBadge nps={h.nps} />
                  </td>
                  <td className="px-5 py-3.5">{Math.round(h.mhsPercentage)}/100</td>
                  <td className="px-5 py-3.5">
                    <HealthBadge status={h.health} />
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{formatDateTime(h.submittedAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/respostas/${h.responseId}`}
                      className="text-sm font-medium text-[var(--accent)] hover:underline"
                    >
                      Ver resposta
                    </Link>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                    Este cliente ainda não respondeu nenhuma pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {latest && (
        <div className="card p-5">
          <h2 className="mb-1 text-base font-semibold">Último feedback</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">{monthLabel(latest.month, latest.year)}</p>
          <p className={cn("text-sm", latest.feedback ? "text-[var(--foreground)]" : "italic text-[var(--muted)]")}>
            {latest.feedback || "O cliente não deixou um comentário neste ciclo."}
          </p>
          {latest.retentionAnswer && (
            <p className="mt-4 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
              Dependência percebida:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {RETENTION_LABELS.find((l) => l.value === latest.retentionAnswer)?.label}
              </span>
            </p>
          )}
        </div>
      )}

      {client.notes && (
        <div className="card p-5">
          <h2 className="mb-2 text-base font-semibold">Observações internas</h2>
          <p className="whitespace-pre-wrap text-sm text-[var(--muted)]">{client.notes}</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "paused" | "ended" }) {
  const labels = { active: "Ativo", paused: "Pausado", ended: "Encerrado" };
  const styles = {
    active: "bg-green-50 text-green-700",
    paused: "bg-amber-50 text-amber-700",
    ended: "bg-gray-100 text-gray-500",
  };
  return <span className={cn("badge", styles[status])}>{labels[status]}</span>;
}
