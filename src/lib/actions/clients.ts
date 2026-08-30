"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const clientSchema = z.object({
  company_name: z.string().min(1, "Informe o nome da empresa."),
  contact_name: z.string().min(1, "Informe o nome do responsável."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  service: z.string().optional(),
  start_date: z.string().optional(),
  status: z.enum(["active", "paused", "ended"]),
  notes: z.string().optional(),
});

export interface ClientFormState {
  error?: string;
}

export async function createClientAction(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("clients")
    .insert({
      ...parsed.data,
      email: parsed.data.email || null,
      start_date: parsed.data.start_date || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/admin/clientes");
  redirect(`/admin/clientes/${data.id}`);
}

export async function updateClientAction(
  clientId: string,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      ...parsed.data,
      email: parsed.data.email || null,
      start_date: parsed.data.start_date || null,
    })
    .eq("id", clientId);

  if (error) {
    return { error: "Não foi possível atualizar o cliente." };
  }

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${clientId}`);
  redirect(`/admin/clientes/${clientId}`);
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();
  // Cascades survey_invitations, responses, and response_answers for this client (see migration).
  await supabase.from("clients").delete().eq("id", clientId);
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");
  redirect("/admin/clientes");
}
