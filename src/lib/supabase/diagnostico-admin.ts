import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for the "Diagnóstico Empresarial 360" app.
 *
 * This app uses its OWN Supabase project — separate from the one used by
 * Pulse (NPS/MHS) elsewhere in this repo. Never import this from client
 * components (the `server-only` guard throws a build error if that happens).
 *
 * This is the only client allowed to touch the `diagnosticos` /
 * `diagnostico_respostas` tables on behalf of an unauthenticated visitor
 * (the public diagnostic flow). It bypasses Row Level Security entirely, so
 * every usage must scope its query tightly (submit one diagnostic, or read
 * one diagnostic by its exact id).
 */
export function createDiagnosticoAdminClient() {
  const url = process.env.DIAGNOSTICO_SUPABASE_URL;
  const serviceRoleKey = process.env.DIAGNOSTICO_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuração do Supabase do Diagnóstico Empresarial 360 ausente. Defina DIAGNOSTICO_SUPABASE_URL e DIAGNOSTICO_SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
