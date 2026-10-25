import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the current user's auth session
 * (via cookies). Used by every admin page/action — RLS's `authenticated`
 * policies apply here because the request carries the user's JWT.
 *
 * Not parameterized with the Database generic: our hand-written types
 * don't carry the Relationships metadata supabase-js needs, which
 * silently degrades every column type to `never`. Joined queries are
 * cast explicitly at the call site (see src/lib/queries.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — middleware refreshes
            // the session cookie instead, so this can be safely ignored.
          }
        },
      },
    }
  );
}
