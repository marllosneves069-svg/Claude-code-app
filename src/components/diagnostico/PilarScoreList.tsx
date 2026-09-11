import { PILARES } from "@/lib/diagnostico/pilares";
import { PILAR_ICONES } from "./pilarIcones";
import { classificar } from "@/lib/diagnostico/pontuacao";
import { CLASSIFICACAO_COR_HEX } from "@/lib/diagnostico/classificacaoCores";
import type { NotasPilares } from "@/lib/diagnostico/types";

export function PilarScoreList({ notas }: { notas: NotasPilares }) {
  return (
    <div className="flex flex-col gap-4">
      {PILARES.map((pilar) => {
        const nota = notas[pilar.id];
        const cor = CLASSIFICACAO_COR_HEX[classificar(nota)];
        const Icon = PILAR_ICONES[pilar.id];
        return (
          <div key={pilar.id} className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--foreground)]">{pilar.nome}</span>
                <span className="font-semibold text-[var(--foreground)]">{nota.toFixed(0)}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${nota}%`, backgroundColor: cor }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
