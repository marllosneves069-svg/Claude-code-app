import { HEALTH_STATUS_LABEL, NPS_CLASS_LABEL, type HealthStatus, type NpsClass } from "@/lib/metrics";
import { cn } from "@/lib/utils";

const HEALTH_STYLES: Record<HealthStatus, string> = {
  healthy: "bg-green-50 text-green-700",
  attention: "bg-amber-50 text-amber-700",
  risk: "bg-red-50 text-red-700",
};

export function HealthBadge({ status }: { status: HealthStatus | null }) {
  if (!status) {
    return <span className="badge bg-gray-100 text-gray-500">Sem dados</span>;
  }
  return (
    <span className={cn("badge", HEALTH_STYLES[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {HEALTH_STATUS_LABEL[status]}
    </span>
  );
}

const NPS_STYLES: Record<NpsClass, string> = {
  promoter: "bg-green-50 text-green-700",
  passive: "bg-amber-50 text-amber-700",
  detractor: "bg-red-50 text-red-700",
};

export function NpsBadge({ nps }: { nps: number }) {
  const cls: NpsClass = nps >= 9 ? "promoter" : nps >= 7 ? "passive" : "detractor";
  return (
    <span className={cn("badge", NPS_STYLES[cls])}>
      {nps} · {NPS_CLASS_LABEL[cls]}
    </span>
  );
}
