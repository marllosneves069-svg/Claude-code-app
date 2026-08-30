import Link from "next/link";
import { AlertTriangle, TrendingDown, MessageSquareWarning, ShieldAlert, HeartPulse } from "lucide-react";
import type { DashboardAlert } from "@/lib/queries";

const ICONS: Record<DashboardAlert["type"], typeof AlertTriangle> = {
  detractor: ShieldAlert,
  mhs_risk: HeartPulse,
  mhs_drop: TrendingDown,
  nps_drop: TrendingDown,
  critical_feedback: MessageSquareWarning,
  low_retention: AlertTriangle,
};

export function AlertsList({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="card p-6 text-sm text-[var(--muted)]">
        Nenhum alerta neste período. A carteira está estável. 🎉
      </div>
    );
  }

  return (
    <div className="card divide-y divide-[var(--border)]">
      {alerts.map((alert, i) => {
        const Icon = ICONS[alert.type];
        return (
          <Link
            key={i}
            href={`/admin/clientes/${alert.clientId}`}
            className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">{alert.companyName}</p>
              <p className="text-sm text-[var(--muted)]">{alert.message}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
