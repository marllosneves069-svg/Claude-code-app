"use client";

import { MoodFace } from "@/components/survey/MoodFace";
import { SCALE_5_LABELS } from "@/lib/questions";
import { cn } from "@/lib/utils";

export function ScaleFivePicker({ value, onSelect }: { value: number | null; onSelect: (value: number) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
      {SCALE_5_LABELS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              "flex flex-row items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all duration-150 sm:flex-col sm:items-center sm:gap-2 sm:py-5 sm:text-center",
              active
                ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm"
                : "border-[var(--border)] bg-white hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <span className={cn(active && "animate-pop")}>
              <MoodFace value={opt.value as 1 | 2 | 3 | 4 | 5} active={active} size={44} />
            </span>
            <span className="flex items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0.5">
              <span className={cn("text-lg font-semibold", active ? "text-[var(--accent)]" : "text-[var(--foreground)]")}>
                {opt.value}
              </span>
              <span className="text-sm text-[var(--muted)] sm:text-center">{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
