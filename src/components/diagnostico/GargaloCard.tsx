import { PILAR_ICONES } from "./pilarIcones";
import { nomePilar } from "@/lib/diagnostico/pilares";
import type { GargaloIdentificado } from "@/lib/diagnostico/types";

const RANKING_LABEL: Record<1 | 2 | 3, string> = {
  1: "Principal gargalo",
  2: "Segundo gargalo",
  3: "Terceiro gargalo",
};

export function GargaloCard({ posicao, gargalo }: { posicao: 1 | 2 | 3; gargalo: GargaloIdentificado }) {
  const Icon = PILAR_ICONES[gargalo.pilar];
  return (
    <div className="card flex gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{RANKING_LABEL[posicao]}</p>
        <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">{nomePilar(gargalo.pilar)}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{gargalo.explicacao}</p>
      </div>
    </div>
  );
}
