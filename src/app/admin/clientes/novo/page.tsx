import { ClientForm } from "@/components/admin/ClientForm";
import { createClientAction } from "@/lib/actions/clients";

export default function NewClientPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Novo cliente</h1>
        <p className="text-sm text-[var(--muted)]">Cadastre um cliente para incluí-lo nas próximas pesquisas.</p>
      </div>
      <ClientForm action={createClientAction} submitLabel="Cadastrar cliente" />
    </div>
  );
}
