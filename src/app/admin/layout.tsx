import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The /admin/login page renders outside this shell (see route group check below).
  if (!user) {
    return <>{children}</>;
  }

  return (
    <AdminShell userEmail={user.email ?? null} logoutAction={signOut}>
      {children}
    </AdminShell>
  );
}
