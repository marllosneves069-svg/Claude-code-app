import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. NEVER import this from client components —
 * the `server-only` guard above throws a build error if that happens.
 *
 * This is the only client allowed to touch survey_invitations/responses on
 * behalf of an unauthenticated visitor (the public survey flow). Every
 * usage must scope its query tightly (e.g. by exact token) since it
 * bypasses Row Level Security entirely.
 *
 * Not parameterized with the Database generic — see src/lib/supabase/server.ts
 * for why; joined queries are cast explicitly at the call site.
 */
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
