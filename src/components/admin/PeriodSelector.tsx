"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { monthLabel } from "@/lib/metrics";
import type { PeriodOption } from "@/lib/queries";

export function PeriodSelector({ periods, basePath = "/admin" }: { periods: PeriodOption[]; basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = Number(searchParams.get("month")) || periods[0]?.month;
  const currentYear = Number(searchParams.get("year")) || periods[0]?.year;

  if (periods.length === 0) return null;

  return (
    <select
      className="input w-auto py-2 pr-9 font-medium"
      value={`${currentMonth}-${currentYear}`}
      onChange={(e) => {
        const [month, year] = e.target.value.split("-");
        router.push(`${basePath}?month=${month}&year=${year}`);
      }}
    >
      {periods.map((p) => (
        <option key={`${p.month}-${p.year}`} value={`${p.month}-${p.year}`}>
          {monthLabel(p.month, p.year)}
        </option>
      ))}
    </select>
  );
}
