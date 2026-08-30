"use client";

import { useTransition } from "react";
import { Lock, LockOpen } from "lucide-react";

export function ToggleSurveyStatusButton({
  action,
  status,
}: {
  action: () => Promise<void>;
  status: "in_progress" | "closed";
}) {
  const [isPending, startTransition] = useTransition();
  const isClosed = status === "closed";

  return (
    <button
      type="button"
      onClick={() => startTransition(() => action())}
      disabled={isPending}
      className="btn-secondary text-sm"
    >
      {isClosed ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      {isPending ? "Salvando..." : isClosed ? "Reabrir pesquisa" : "Encerrar pesquisa"}
    </button>
  );
}
