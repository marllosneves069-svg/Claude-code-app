"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageSquareText,
  BarChart3,
  Settings,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/pesquisas", label: "Pesquisas", icon: ClipboardList },
  { href: "/admin/respostas", label: "Respostas", icon: MessageSquareText },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
          <Waves className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold text-[var(--foreground)]">Pulse</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl bg-gray-50 px-3 py-3 text-xs text-[var(--muted)]">
        NPS &amp; MHS tracker
        <br />
        Uso interno da assessoria
      </div>
    </aside>
  );
}
