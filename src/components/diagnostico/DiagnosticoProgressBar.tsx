export function DiagnosticoProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-[var(--muted)]">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
