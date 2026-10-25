"use client";

import { useActionState } from "react";
import type { ClientFormState } from "@/lib/actions/clients";
import type { ClientRow } from "@/lib/database.types";

const initialState: ClientFormState = {};

export function ClientForm({
  action,
  defaultValues,
  submitLabel = "Salvar cliente",
}: {
  action: (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  defaultValues?: Partial<ClientRow>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company_name">
            Nome da empresa
          </label>
          <input
            id="company_name"
            name="company_name"
            required
            className="input"
            defaultValue={defaultValues?.company_name}
            placeholder="Empresa ABC"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact_name">
            Nome do responsável
          </label>
          <input
            id="contact_name"
            name="contact_name"
            required
            className="input"
            defaultValue={defaultValues?.contact_name}
            placeholder="Maria Silva"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            defaultValue={defaultValues?.email ?? ""}
            placeholder="contato@empresa.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="whatsapp">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            className="input"
            defaultValue={defaultValues?.whatsapp ?? ""}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div>
          <label className="label" htmlFor="service">
            Serviço contratado
          </label>
          <input
            id="service"
            name="service"
            className="input"
            defaultValue={defaultValues?.service ?? ""}
            placeholder="Tráfego pago + Social Media"
          />
        </div>
        <div>
          <label className="label" htmlFor="start_date">
            Data de início
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            className="input"
            defaultValue={defaultValues?.start_date ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" className="input" defaultValue={defaultValues?.status ?? "active"}>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="ended">Encerrado</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">
          Observações internas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="input"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Notas visíveis apenas para a equipe..."
        />
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
