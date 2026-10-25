"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { surveyLink, surveyMessage } from "@/lib/site";
import { formatDateTime, cn } from "@/lib/utils";
import type { InvitationWithClient } from "@/lib/queries";

export function InvitationLinksTable({ invitations }: { invitations: InvitationWithClient[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1600);
    } catch {
      // Clipboard permission denied — nothing else we can do silently.
    }
  }

  function copyAllLinks() {
    const text = invitations
      .map((inv) => `${inv.client.company_name}: ${surveyLink(inv.token)}`)
      .join("\n");
    copy(text, "all");
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-base font-semibold">Links individuais</h2>
        <button onClick={copyAllLinks} className="btn-secondary text-sm">
          {copiedId === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copiar todos
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Enviado em</th>
              <th className="px-5 py-3">NPS</th>
              <th className="px-5 py-3">MHS</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => {
              const link = surveyLink(inv.token);
              const message = surveyMessage(inv.client.contact_name, link);
              return (
                <tr key={inv.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--foreground)]">{inv.client.company_name}</p>
                    <p className="text-xs text-[var(--muted)]">{inv.client.contact_name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "badge",
                        inv.status === "answered" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {inv.status === "answered" ? "Respondido" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{formatDateTime(inv.created_at)}</td>
                  <td className="px-5 py-3.5">{inv.response?.nps_score ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    {inv.response?.mhs_percentage != null ? `${Math.round(inv.response.mhs_percentage)}/100` : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => copy(link, inv.id)}
                        className="btn-ghost px-2.5 py-1.5 text-xs"
                        title="Copiar link"
                      >
                        {copiedId === inv.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        Link
                      </button>
                      <button
                        onClick={() => copy(message, `${inv.id}-msg`)}
                        className="btn-ghost px-2.5 py-1.5 text-xs"
                        title="Copiar mensagem"
                      >
                        {copiedId === `${inv.id}-msg` ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5" />
                        )}
                        Mensagem
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
