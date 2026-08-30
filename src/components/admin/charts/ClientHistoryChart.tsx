"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { monthShortLabel } from "@/lib/metrics";
import type { ClientHistoryPoint } from "@/lib/queries";
import { EmptyState } from "@/components/admin/charts/EvolutionChart";

export function ClientHistoryChart({ history, metric }: { history: ClientHistoryPoint[]; metric: "mhs" | "nps" }) {
  if (history.length === 0) return <EmptyState />;

  const data = history.map((h) => ({
    label: monthShortLabel(h.month, h.year),
    value: metric === "mhs" ? Math.round(h.mhsPercentage) : h.nps,
  }));

  const color = metric === "mhs" ? "#16a34a" : "#4f46e5";
  const domain = metric === "mhs" ? [0, 100] : [0, 10];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis domain={domain} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e8e8ec", fontSize: 13 }} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
