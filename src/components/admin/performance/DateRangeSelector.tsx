"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RANGE_PRESETS, type DateRange, type RangePreset } from "@/lib/date-range";

export function DateRangeSelector({
  preset,
  range,
  basePath = "/admin/performance",
}: {
  preset: RangePreset;
  range: DateRange;
  basePath?: string;
}) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(preset === "custom");
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="input w-auto py-2 pr-9 font-medium"
        value={showCustom ? "custom" : preset}
        onChange={(e) => {
          if (e.target.value === "custom") {
            setShowCustom(true);
            return;
          }
          setShowCustom(false);
          router.push(`${basePath}?range=${e.target.value}`);
        }}
      >
        {RANGE_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
        <option value="custom">Personalizado</option>
      </select>

      {showCustom && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (from && to) router.push(`${basePath}?from=${from}&to=${to}`);
          }}
        >
          <input type="date" className="input w-auto py-2" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-sm text-[var(--muted)]">a</span>
          <input type="date" className="input w-auto py-2" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          <button type="submit" className="btn-secondary py-2">
            Aplicar
          </button>
        </form>
      )}
    </div>
  );
}
