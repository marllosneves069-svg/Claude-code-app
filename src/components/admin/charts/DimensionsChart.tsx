"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DimensionAverage } from "@/lib/queries";
import { EmptyState } from "@/components/admin/charts/EvolutionChart";

export function DimensionsChart({ data }: { data: DimensionAverage[] }) {
  if (data.length === 0) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" horizontal={false} />
        <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 12, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e8e8ec", fontSize: 13 }}
          formatter={(value) => [`${Number(value).toFixed(1)} / 5`, "Média"]}
        />
        <Bar dataKey="average" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
