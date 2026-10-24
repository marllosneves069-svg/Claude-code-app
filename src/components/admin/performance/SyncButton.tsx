"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { syncNowAction } from "@/lib/actions/performance";
import { cn } from "@/lib/utils";

const SOURCE_LABEL = { meta: "Meta Ads", tiny: "Tiny" } as const;

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<{ text: string; tone: "ok" | "warn" | "error" }[]>([]);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        className="btn-secondary py-2"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setMessages([]);
            const state = await syncNowAction();
            if (state.error) {
              setMessages([{ text: state.error, tone: "error" }]);
              return;
            }
            setMessages(
              (state.results ?? []).map((r) => ({
                text: `${SOURCE_LABEL[r.source]}: ${
                  r.status === "success" ? "atualizado" : r.status === "skipped" ? "ignorado" : r.status === "partial" ? "parcial" : "erro"
                }${r.message ? ` — ${r.message}` : ""}`,
                tone: r.status === "success" ? "ok" : r.status === "error" ? "error" : "warn",
              }))
            );
          })
        }
      >
        <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
        {isPending ? "Atualizando..." : "Atualizar agora"}
      </button>
      {messages.map((m) => (
        <p
          key={m.text}
          className={cn(
            "max-w-xs text-right text-xs",
            m.tone === "ok" ? "text-[var(--success)]" : m.tone === "warn" ? "text-[var(--warning)]" : "text-[var(--danger)]"
          )}
        >
          {m.text}
        </p>
      ))}
    </div>
  );
}
