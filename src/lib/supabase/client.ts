"use client";

import { createBrowserClient } from "@supabase/ssr";

// Not parameterized with the Database generic: our hand-written types don't
// carry the Relationships metadata supabase-js needs to resolve query
// builder types, which silently degrades every column type to `never`.
// Joined queries are cast explicitly at the call site instead (see
// src/lib/queries.ts) using the types in src/lib/database.types.ts.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
