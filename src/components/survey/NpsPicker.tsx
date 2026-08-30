"use client";

import { cn } from "@/lib/utils";

const SENTIMENT_BUCKETS = [
  { max: 2, label: "Muito insatisfeito", color: "#dc2626" },
  { max: 4, label: "Insatisfeito", color: "#f97316" },
  { max: 6, label: "Neutro", color: "#d97706" },
  { max: 8, label: "Satisfeito", color: "#65a30d" },
  { max: 10, label: "Muito satisfeito", color: "#16a34a" },
];

function sentimentFor(score: number) {
  return SENTIMENT_BUCKETS.find((b) => score <= b.max)!;
}

export function NpsPicker({ value, onSelect }: { value: number | null; onSelect: (value: number) => void }) {
  const scores = Array.from({ length: 11 }, (_, i) => i);
  const sentiment = value != null ? sentimentFor(value) : null;

  return (
    <div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11 sm:gap-2.5">
        {scores.map((score) => {
          const active = value === score;
          const bucket = sentimentFor(score);
          return (
            <button
              key={score}
              type="button"
              onClick={() => onSelect(score)}
              style={active ? { borderColor: bucket.color, background: `${bucket.color}14`, color: bucket.color } : undefined}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border-2 text-base font-semibold transition-all duration-150 sm:text-lg",
                active ? "scale-105 shadow-sm animate-pop" : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
        <span>0 = Não recomendaria</span>
        <span>10 = Recomendaria com certeza</span>
      </div>

      {sentiment && (
        <p className="mt-4 text-center text-sm font-medium" style={{ color: sentiment.color }}>
          {sentiment.label}
        </p>
      )}
    </div>
  );
}
