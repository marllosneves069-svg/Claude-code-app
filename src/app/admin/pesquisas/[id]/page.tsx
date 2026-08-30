import { notFound } from "next/navigation";
import { getSurveyDetail } from "@/lib/queries";
import { monthLabel } from "@/lib/metrics";
import { InvitationLinksTable } from "@/components/admin/InvitationLinksTable";
import { StatCard } from "@/components/admin/StatCard";

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await getSurveyDetail(id);
  if (!survey) notFound();

  const total = survey.invitations.length;
  const answered = survey.invitations.filter((i) => i.status === "answered").length;
  const pending = total - answered;
  const rate = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">{monthLabel(survey.month, survey.year)}</h1>
        <p className="text-sm text-[var(--muted)]">Rodada mensal de satisfação</p>
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
