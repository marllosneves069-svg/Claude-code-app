"use client";

import { useActionState } from "react";
import { signIn, type AuthActionState } from "@/lib/actions/auth";
import { useSearchParams } from "next/navigation";
import { Waves } from "lucide-react";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
            <Waves className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">Pulse</h1>
            <p className="text-sm text-[var(--muted)]">Área administrativa</p>
          </div>
        </div>

        <form action={formAction} className="card p-6">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="mb-4">
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input id="email" name="email" type="email" required className="input" placeholder="voce@agencia.com" autoComplete="email" />
          </div>
          <div className="mb-5">
            <label className="label" htmlFor="password">
              Senha
            </label>
            <input id="password" name="password" type="password" required className="input" placeholder="••••••••" autoComplete="current-password" />
          </div>

          {state.error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Acesso restrito à equipe. Fale com um administrador se precisar de uma conta.
        </p>
      </div>
    </div>
  );
}
