import { formatInt, formatPct } from "@/lib/performance-metrics";

/**
 * Contatos → orçamentos → compras as proportional bars. Each step shows its
 * share of the first one (contatos): an order that becomes a sale leaves
 * "Em aberto", so step-to-step rates would be meaningless.
 */
export function FunnelBars({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="flex flex-col gap-4">
      {steps.map((step, i) => {
        const base = i > 0 ? steps[0].value : null;
        return (
          <div key={step.label}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium text-[var(--foreground)]">{step.label}</span>
              <span className="text-[var(--muted)]">
                <span className="font-semibold text-[var(--foreground)]">{formatInt(step.value)}</span>
                {base != null && <> · {formatPct(base > 0 ? step.value / base : null)} dos {steps[0].label.toLowerCase()}</>}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(step.value / max) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
