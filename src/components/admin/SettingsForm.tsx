"use client";

import { useActionState } from "react";
import { updateHealthThresholdsAction, type SettingsFormState } from "@/lib/actions/settings";
import type { HealthThresholds } from "@/lib/metrics";

const initialState: SettingsFormState = {};

export function SettingsForm({ thresholds }: { thresholds: HealthThresholds }) {
  const [state, formAction, pending] = useActionState(updateHealthThresholdsAction, initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-5 p-6">
      <div>
        <label className="label" htmlFor="healthyMin">
          MHS mínimo para &ldquo;Saudável&rdquo;
        </label>
        <input
          id="healthyMin"
          name="healthyMin"
          type="number"
          min={0}
          max={100}
          defaultValue={thresholds.healthyMin}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="attentionMin">
          MHS mínimo para &ldquo;Atenção&rdquo; (abaixo disso é &ldquo;Risco&rdquo;)
        </label>
        <input
          id="attentionMin"
          name="attentionMin"
          type="number"
          min={0}
          max={100}
          defaultValue={thresholds.attentionMin}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="detractorNpsMax">
          NPS máximo para alerta de &ldquo;cliente detrator&rdquo;
        </label>
        <input
          id="detractorNpsMax"
          name="detractorNpsMax"
          type="number"
          min={0}
          max={10}
          defaultValue={thresholds.detractorNpsMax}
          className="input"
        />
      </div>
      <div>
        <label className="label">Respostas de retenção que geram alerta</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="lowRetentionCodes"
              value={4}
              defaultChecked={thresholds.lowRetentionCodes.includes(4)}
            />
            Pouco desapontado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="lowRetentionCodes"
              value={5}
              defaultChecked={thresholds.lowRetentionCodes.includes(5)}
            />
            Nada desapontado
          </label>
        </div>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Configurações salvas.</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </form>
  );
}
