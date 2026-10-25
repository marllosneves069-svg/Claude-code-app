"use client";

import { useActionState, useState } from "react";
import { createSurveyAction, type SurveyFormState } from "@/lib/actions/surveys";
import type { ClientRow } from "@/lib/database.types";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const initialState: SurveyFormState = {};

export function SurveyForm({
  activeClients,
  defaultMonth,
  defaultYear,
}: {
  activeClients: ClientRow[];
  defaultMonth: number;
  defaultYear: number;
}) {
  const [state, formAction, pending] = useActionState(createSurveyAction, initialState);
  const [audience, setAudience] = useState<"all_active" | "specific">("all_active");
  const [selected, setSelected] = useState<Set<string>>(new Set(activeClients.map((c) => c.id)));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="card flex flex-col gap-5 p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="month">
            Mês
          </label>
          <select id="month" name="month" defaultValue={defaultMonth} className="input">
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="year">
            Ano
          </label>
          <input id="year" name="year" type="number" defaultValue={defaultYear} className="input" min={2020} max={2100} />
        </div>
      </div>

      <div>
        <label className="label">Público da pesquisa</label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/5">
            <input
              type="radio"
              name="audience"
              value="all_active"
              checked={audience === "all_active"}
              onChange={() => setAudience("all_active")}
            />
            Todos os clientes ativos ({activeClients.length})
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/5">
            <input
              type="radio"
              name="audience"
              value="specific"
              checked={audience === "specific"}
              onChange={() => setAudience("specific")}
            />
            Clientes específicos
          </label>
        </div>
      </div>

      {audience === "specific" && (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border)]">
          {activeClients.map((c) => (
            <label key={c.id} className="flex items-center gap-3 border-b border-[var(--border)] px-3.5 py-2.5 text-sm last:border-0 hover:bg-gray-50">
              <input
                type="checkbox"
                name="client_ids"
                value={c.id}
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
              />
              <div>
                <p className="font-medium text-[var(--foreground)]">{c.company_name}</p>
                <p className="text-xs text-[var(--muted)]">{c.contact_name}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Gerando..." : "Gerar pesquisa"}
        </button>
      </div>
    </form>
  );
}
