"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export function PilaresRadarChart({ dados, cor }: { dados: { pilar: string; nota: number }[]; cor: string }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={dados} outerRadius="70%">
        <PolarGrid stroke="#e8e8ec" />
        <PolarAngleAxis dataKey="pilar" tick={{ fontSize: 12, fill: "#374151" }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} tickCount={5} />
        <Radar dataKey="nota" stroke={cor} fill={cor} fillOpacity={0.18} strokeWidth={2} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e8e8ec", fontSize: 13 }}
          formatter={(value) => [`${Number(value).toFixed(0)} / 100`, "Nota"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
