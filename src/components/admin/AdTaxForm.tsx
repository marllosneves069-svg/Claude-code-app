"use client";

import { useActionState } from "react";
import { updateAdTaxRateAction, type AdTaxFormState } from "@/lib/actions/performance";

const initialState: AdTaxFormState = {};

export function AdTaxForm({ taxRate }: { taxRate: number }) {
  const [state, formAction, pending] = useActionState(updateAdTaxRateAction, initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-5 p-6">
      <div>
        <label className="label" htmlFor="taxPercent">
          Imposto sobre anúncios (%)
        </label>
        <input
          id="taxPercent"
          name="taxPercent"
          type="number"
          step="0.01"
          min={0}
          max={100}
          defaultValue={Math.round(taxRate * 10000) / 100}
          className="input"
        />
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          Aparece como linha informativa no dashboard de Performance. Custos e ROAS usam o investimento sem imposto.
        </p>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Imposto salvo.</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Salvando..." : "Salvar imposto"}
        </button>
      </div>
    </form>
  );
}
