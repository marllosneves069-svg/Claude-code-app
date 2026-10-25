"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Excluir",
  className,
  iconOnly = false,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => {
          action();
        });
      }}
      disabled={isPending}
      title={iconOnly ? label : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50",
        iconOnly ? "p-1.5" : "px-2.5 py-1.5",
        className
      )}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {!iconOnly && (isPending ? "Excluindo..." : label)}
    </button>
  );
}
