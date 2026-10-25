"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RETENTION_LABELS } from "@/lib/questions";
import type { calculateRetentionIndex } from "@/lib/metrics";
import { EmptyState } from "@/components/admin/charts/EvolutionChart";

export function RetentionChart({ retention }: { retention: ReturnType<typeof calculateRetentionIndex> }) {
  if (retention.total === 0) return <EmptyState />;

  const data = retention.distribution.map((d) => ({
    label: RETENTION_LABELS.find((l) => l.value === d.value)?.label ?? String(d.value),
    pct: Math.round(d.pct),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={36} unit="%" />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e8e8ec", fontSize: 13 }} formatter={(v) => [`${v}%`, "Respostas"]} />
        <Bar dataKey="pct" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
