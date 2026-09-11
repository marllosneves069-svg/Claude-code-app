"use client";

import { useEffect, useState } from "react";
import { BarChart3, Lightbulb, Search } from "lucide-react";

const ETAPAS = [
  { texto: "Consolidando as respostas do diagnóstico...", icon: Search },
  { texto: "Calculando a maturidade dos seis pilares...", icon: BarChart3 },
  { texto: "Cruzando os resultados para identificar gargalos...", icon: Lightbulb },
];

export function ProcessingScreen() {
  const [etapa, setEtapa] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1));
    }, 700);
    return () => clearInterval(interval);
  }, []);

  const Icon = ETAPAS[etapa].icon;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <div className="animate-fade-slide-in flex max-w-sm flex-col items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
          <Icon className="h-8 w-8 animate-pulse" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Analisando o diagnóstico da sua empresa</h1>
        <p key={etapa} className="animate-fade-slide-in text-sm text-[var(--muted)]">
          {ETAPAS[etapa].texto}
        </p>
        <div className="mt-1 h-1.5 w-48 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-700 ease-out"
            style={{ width: `${((etapa + 1) / ETAPAS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
