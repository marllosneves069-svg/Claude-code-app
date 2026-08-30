"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { monthShortLabel } from "@/lib/metrics";
import type { EvolutionPoint } from "@/lib/queries";

export function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  const chartData = data.map((d) => ({
    label: monthShortLabel(d.month, d.year),
    NPS: d.nps,
    MHS: Math.round(d.mhsPercentage),
  }));

  if (chartData.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e8e8ec", fontSize: 13 }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
        />
        <Line type="monotone" dataKey="NPS" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="MHS" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EmptyState() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-[var(--muted)]">
      Sem dados suficientes ainda.
    </div>
  );
}
