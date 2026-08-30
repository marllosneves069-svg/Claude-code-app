import Link from "next/link";
import { getAllResponses } from "@/lib/queries";
import { monthLabel } from "@/lib/metrics";
import { NpsBadge } from "@/components/admin/HealthBadge";
import { formatDateTime } from "@/lib/utils";

export default async function ResponsesPage() {
  const responses = await getAllResponses();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Respostas</h1>
        <p className="text-sm text-[var(--muted)]">Todas as respostas recebidas, mais recentes primeiro</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3">Mês</th>
                <th className="px-5 py-3">NPS</th>
                <th className="px-5 py-3">MHS</th>
                <th className="px-5 py-3">Respondido em</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--foreground)]">{r.client.company_name}</p>
                    <p className="text-xs text-[var(--muted)]">{r.client.contact_name}</p>
                  </td>
                  <td className="px-5 py-3.5">{monthLabel(r.survey.month, r.survey.year)}</td>
                  <td className="px-5 py-3.5">
                    <NpsBadge nps={r.nps_score} />
                  </td>
                  <td className="px-5 py-3.5">{r.mhs_percentage != null ? `${Math.round(r.mhs_percentage)}/100` : "—"}</td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{formatDateTime(r.submitted_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/respostas/${r.id}`} className="text-sm font-medium text-[var(--accent)] hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {responses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                    Nenhuma resposta recebida ainda.
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
