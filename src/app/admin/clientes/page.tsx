import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getClientsWithLatestMetrics } from "@/lib/queries";
import { getHealthThresholds } from "@/lib/settings";
import { HealthBadge } from "@/components/admin/HealthBadge";
import { formatDate, cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "healthy", label: "Saudáveis" },
  { key: "attention", label: "Atenção" },
  { key: "risk", label: "Risco" },
  { key: "pending", label: "Não responderam" },
] as const;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").toLowerCase().trim();
  const filter = params.filter ?? "all";

  const thresholds = await getHealthThresholds();
  const clients = await getClientsWithLatestMetrics(thresholds);

  const filtered = clients.filter((c) => {
    if (q && !`${c.company_name} ${c.contact_name}`.toLowerCase().includes(q)) return false;
    if (filter === "healthy") return c.latestHealth === "healthy";
    if (filter === "attention") return c.latestHealth === "attention";
    if (filter === "risk") return c.latestHealth === "risk";
    if (filter === "pending") return !c.hasRespondedLatestSurvey;
    return true;
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Clientes</h1>
          <p className="text-sm text-[var(--muted)]">{clients.length} clientes na carteira</p>
        </div>
        <Link href="/admin/clientes/novo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-[220px]" action="/admin/clientes">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="hidden" name="filter" value={filter} />
          <input name="q" defaultValue={q} placeholder="Buscar por empresa ou responsável" className="input pl-9" />
        </form>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/clientes?filter=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.key ? "bg-[var(--accent)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3">Responsável</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">MHS atual</th>
                <th className="px-5 py-3">NPS atual</th>
                <th className="px-5 py-3">Última resposta</th>
                <th className="px-5 py-3">Situação</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{c.company_name}</td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{c.contact_name}</td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    {c.latestMhsPercentage != null ? `${Math.round(c.latestMhsPercentage)}/100` : "—"}
                  </td>
                  <td className="px-5 py-3.5">{c.latestNps != null ? c.latestNps : "—"}</td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{formatDate(c.lastResponseAt)}</td>
                  <td className="px-5 py-3.5">
                    <HealthBadge status={c.latestHealth} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/clientes/${c.id}`} className="text-sm font-medium text-[var(--accent)] hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
