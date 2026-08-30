import Link from "next/link";
import { notFound } from "next/navigation";
import { getResponseDetail } from "@/lib/queries";
import { monthLabel } from "@/lib/metrics";
import { NpsBadge } from "@/components/admin/HealthBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteResponseAction } from "@/lib/actions/responses";
import { formatDateTime } from "@/lib/utils";
import { RETENTION_LABELS } from "@/lib/questions";

export default async function ResponseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getResponseDetail(id);
  if (!response) notFound();

  const dimensionAnswers = response.answers.filter((a) => a.question_type === "scale_5");
  const feedbackAnswer = response.answers.find((a) => a.question_type === "text");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{response.client.company_name}</h1>
          <p className="text-sm text-[var(--muted)]">
            {response.client.contact_name} · {monthLabel(response.survey.month, response.survey.year)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/clientes/${response.client.id}`} className="text-sm font-medium text-[var(--accent)] hover:underline">
            Ver cliente
          </Link>
          <DeleteButton
            label="Excluir resposta"
            action={deleteResponseAction.bind(null, response.id)}
            confirmMessage={`Excluir esta resposta de "${response.client.company_name}"? O link de convite volta a ficar pendente. Não pode ser desfeito.`}
            className="border border-red-200"
          />
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">Respondido em {formatDateTime(response.submitted_at)}</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm font-medium text-[var(--muted)]">NPS</p>
          <div className="mt-2">
            <NpsBadge nps={response.nps_score} />
          </div>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-[var(--muted)]">MHS</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {response.mhs_percentage != null ? `${Math.round(response.mhs_percentage)}/100` : "—"}
          </p>
          <p className="text-xs text-[var(--muted)]">{response.mhs_average}/5 de média</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-base font-semibold">Respostas por dimensão</h2>
        <ul className="flex flex-col gap-3">
          {dimensionAnswers.map((a) => (
            <li key={a.code} className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">{a.question}</span>
              <span className="font-medium text-[var(--foreground)]">{a.numeric_value}/5</span>
            </li>
          ))}
        </ul>
      </div>

      {response.retention_answer != null && (
        <div className="card p-5">
          <h2 className="mb-1 text-base font-semibold">Dependência percebida</h2>
          <p className="text-sm text-[var(--muted)]">
            &ldquo;Quão desapontado ficaria se deixássemos de atender você?&rdquo;
          </p>
          <p className="mt-2 font-medium text-[var(--foreground)]">
            {RETENTION_LABELS.find((l) => l.value === response.retention_answer)?.label}
          </p>
        </div>
      )}

      <div className="card p-5">
        <h2 className="mb-2 text-base font-semibold">Feedback</h2>
        <p className="text-sm text-[var(--foreground)]">
          {feedbackAnswer?.text_value || response.feedback || <span className="italic text-[var(--muted)]">Sem comentário.</span>}
        </p>
      </div>
    </div>
  );
}
