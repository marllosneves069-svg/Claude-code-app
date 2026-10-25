"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDayShort } from "@/lib/date-range";
import { formatBRL, formatRoas } from "@/lib/performance-metrics";
import type { DailyPoint } from "@/lib/performance-queries";
import { EmptyState } from "@/components/admin/charts/EvolutionChart";

const compactBRL = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function PerformanceDailyChart({ data }: { data: DailyPoint[] }) {
  if (data.every((d) => d.spend === 0 && d.revenue === 0)) {
    return <EmptyState />;
  }

  const chartData = data.map((d) => ({
    label: formatDayShort(d.date),
    Investimento: Math.round(d.spend * 100) / 100,
    Faturamento: Math.round(d.revenue * 100) / 100,
    ROAS: d.roas == null ? null : Math.round(d.roas * 100) / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} minTickGap={16} />
        <YAxis
          yAxisId="money"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => compactBRL.format(v)}
        />
        <YAxis yAxisId="roas" orientation="right" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e8e8ec", fontSize: 13 }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          formatter={(value, name) => (name === "ROAS" ? formatRoas(value as number) : formatBRL(value as number))}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="money" dataKey="Investimento" fill="#c7d2fe" radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Bar yAxisId="money" dataKey="Faturamento" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Line yAxisId="roas" type="monotone" dataKey="ROAS" stroke="#16a34a" strokeWidth={2.5} dot={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
