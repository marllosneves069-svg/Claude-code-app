import { notFound } from "next/navigation";
import { ClientForm } from "@/components/admin/ClientForm";
import { updateClientAction } from "@/lib/actions/clients";
import { getClientById } from "@/lib/queries";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const boundAction = updateClientAction.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Editar cliente</h1>
        <p className="text-sm text-[var(--muted)]">{client.company_name}</p>
      </div>
      <ClientForm action={boundAction} defaultValues={client} submitLabel="Salvar alterações" />
    </div>
  );
}
