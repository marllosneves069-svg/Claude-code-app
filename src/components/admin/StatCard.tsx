import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  suffix,
  delta,
  deltaLabel,
  deltaGoodDirection = "up",
  helper,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  delta?: number | null;
  deltaLabel?: string;
  deltaGoodDirection?: "up" | "down";
  helper?: string;
}) {
  const hasDelta = delta != null && !Number.isNaN(delta);
  const isFlat = hasDelta && Math.round(delta as number) === 0;
  const isPositiveDirection = hasDelta && (delta as number) > 0;
  const isGood = hasDelta && !isFlat && (deltaGoodDirection === "up" ? isPositiveDirection : !isPositiveDirection);

  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{value}</span>
        {suffix && <span className="text-sm font-medium text-[var(--muted)]">{suffix}</span>}
      </div>
      {hasDelta ? (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium",
            isFlat ? "text-[var(--muted)]" : isGood ? "text-[var(--success)]" : "text-[var(--danger)]"
          )}
        >
          {isFlat ? <Minus className="h-3.5 w-3.5" /> : isPositiveDirection ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          {Math.abs(delta as number).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          {deltaLabel ?? " vs mês anterior"}
        </div>
      ) : helper ? (
        <p className="mt-2 text-xs text-[var(--muted)]">{helper}</p>
      ) : null}
    </div>
  );
}
