import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-lg font-semibold text-[var(--foreground)]">Relatórios</h1>
      <p className="text-sm text-[var(--muted)]">
        Exportações e relatórios consolidados por período chegam em uma próxima etapa. Por enquanto, o
        Dashboard já traz a evolução de NPS, MHS, distribuição de promotores/detratores e as dimensões
        avaliadas por período.
      </p>
      <Link href="/admin" className="btn-primary">
        Ir para o Dashboard
      </Link>
    </div>
  );
}
