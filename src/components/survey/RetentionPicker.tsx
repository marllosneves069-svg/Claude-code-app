"use client";

import { RETENTION_LABELS } from "@/lib/questions";
import { cn } from "@/lib/utils";

// Intensity is intentionally inverted vs. the numeric value: "muito
// desapontado" (value 1) is the *best* outcome for retention, so it gets the
// strongest visual weight even though it is the first/lowest option.
const INTENSITY = [4, 3, 2, 1, 0];

export function RetentionPicker({ value, onSelect }: { value: number | null; onSelect: (value: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {RETENTION_LABELS.map((opt, i) => {
        const active = value === opt.value;
        const opacity = 0.35 + (INTENSITY[i] / 4) * 0.65;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              "flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-150",
              active ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm animate-pop" : "border-[var(--border)] bg-white hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: "var(--accent)", opacity }}
            />
            <span className={cn("text-base font-medium", active ? "text-[var(--accent)]" : "text-[var(--foreground)]")}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
