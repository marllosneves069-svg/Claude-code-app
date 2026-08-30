import Link from "next/link";
import { Plus } from "lucide-react";
import { getSurveys } from "@/lib/queries";
import { monthLabel } from "@/lib/metrics";
import { cn } from "@/lib/utils";

const STATUS_LABEL = { draft: "Rascunho", in_progress: "Em andamento", closed: "Encerrada" } as const;
const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-500",
  in_progress: "bg-blue-50 text-blue-700",
  closed: "bg-green-50 text-green-700",
} as const;

export default async function SurveysPage() {
  const surveys = await getSurveys();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Pesquisas</h1>
          <p className="text-sm text-[var(--muted)]">Rodadas mensais de satisfação</p>
        </div>
        <Link href="/admin/pesquisas/nova" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nova pesquisa mensal
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {surveys.map((s) => {
          const rate = s.total > 0 ? Math.round((s.answered / s.total) * 100) : 0;
          return (
            <Link key={s.id} href={`/admin/pesquisas/${s.id}`} className="card flex items-center justify-between p-5 transition-colors hover:bg-gray-50">
              <div>
                <p className="font-medium text-[var(--foreground)]">{monthLabel(s.month, s.year)}</p>
                <span className={cn("badge mt-1.5", STATUS_STYLE[s.status])}>{STATUS_LABEL[s.status]}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {s.answered} / {s.total} respostas
                </p>
                <p className="text-xs text-[var(--muted)]">{rate}%</p>
              </div>
            </Link>
          );
        })}

        {surveys.length === 0 && (
          <div className="card p-10 text-center text-sm text-[var(--muted)]">
            Nenhuma pesquisa criada ainda. Comece cadastrando clientes e criando a primeira rodada mensal.
          </div>
        )}
      </div>
    </div>
  );
}
