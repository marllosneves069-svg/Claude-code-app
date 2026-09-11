"use client";

import { cn } from "@/lib/utils";

export function OptionCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-150",
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_0_1px_var(--accent)]"
          : "border-[var(--border)] bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-[var(--accent)] bg-[var(--accent)]" : "border-gray-300"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
      <span className="leading-snug text-[var(--foreground)]">{label}</span>
    </button>
  );
}
