"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyState } from "@/components/admin/charts/EvolutionChart";

const COLORS = { Promotores: "#16a34a", Passivos: "#d97706", Detratores: "#dc2626" };

export function DistributionChart({
  promoters,
  passives,
  detractors,
}: {
  promoters: number;
  passives: number;
  detractors: number;
}) {
  const data = [
    { name: "Promotores", value: promoters },
    { name: "Passivos", value: passives },
    { name: "Detratores", value: detractors },
  ];

  if (promoters + passives + detractors === 0) return <EmptyState />;

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e8e8ec", fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex shrink-0 flex-col gap-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[d.name as keyof typeof COLORS] }} />
            <span className="text-[var(--muted)]">{d.name}</span>
            <span className="font-medium text-[var(--foreground)]">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
