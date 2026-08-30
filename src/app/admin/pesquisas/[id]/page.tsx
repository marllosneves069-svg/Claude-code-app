import { notFound } from "next/navigation";
import { getSurveyDetail } from "@/lib/queries";
import { monthLabel } from "@/lib/metrics";
import { InvitationLinksTable } from "@/components/admin/InvitationLinksTable";
import { StatCard } from "@/components/admin/StatCard";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ToggleSurveyStatusButton } from "@/components/admin/ToggleSurveyStatusButton";
import { deleteSurveyAction, toggleSurveyStatusAction } from "@/lib/actions/surveys";
import { cn } from "@/lib/utils";

const STATUS_LABEL = { draft: "Rascunho", in_progress: "Em andamento", closed: "Encerrada" } as const;
const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-500",
  in_progress: "bg-blue-50 text-blue-700",
  closed: "bg-green-50 text-green-700",
} as const;

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await getSurveyDetail(id);
  if (!survey) notFound();

  const total = survey.invitations.length;
  const answered = survey.invitations.filter((i) => i.status === "answered").length;
  const pending = total - answered;
  const rate = total > 0 ? Math.round((answered / total) * 100) : 0;
  const toggleStatus = survey.status === "closed" ? "closed" : "in_progress";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">{monthLabel(survey.month, survey.year)}</h1>
            <span className={cn("badge", STATUS_STYLE[survey.status])}>{STATUS_LABEL[survey.status]}</span>
          </div>
          <p className="text-sm text-[var(--muted)]">Rodada mensal de satisfação</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleSurveyStatusButton status={toggleStatus} action={toggleSurveyStatusAction.bind(null, survey.id, toggleStatus)} />
          <DeleteButton
            label="Excluir pesquisa"
            action={deleteSurveyAction.bind(null, survey.id)}
            confirmMessage={`Excluir a pesquisa de ${monthLabel(survey.month, survey.year)}? Isso apaga todos os links e respostas dessa rodada. Não pode ser desfeito.`}
            className="border border-red-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de clientes" value={total} />
        <StatCard label="Responderam" value={answered} />
        <StatCard label="Pendentes" value={pending} />
        <StatCard label="Taxa de resposta" value={rate} suffix="%" />
      </div>

      <InvitationLinksTable invitations={survey.invitations} />
    </div>
  );
}
