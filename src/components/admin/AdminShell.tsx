"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Waves } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/performance", label: "Performance" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/pesquisas", label: "Pesquisas" },
  { href: "/admin/respostas", label: "Respostas" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function AdminShell({
  children,
  userEmail,
  logoutAction,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  logoutAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-[var(--surface)] p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                  <Waves className="h-4 w-4" />
                </div>
                <span className="text-base font-semibold">Pulse</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-medium",
                      active ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:px-8">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-gray-100 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--muted)] sm:inline">{userEmail}</span>
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost text-sm">
                Sair
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
