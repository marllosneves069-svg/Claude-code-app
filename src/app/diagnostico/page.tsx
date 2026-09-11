import Link from "next/link";
import { ArrowRight, ClipboardList, Compass, Sparkles } from "lucide-react";
import { PILARES } from "@/lib/diagnostico/pilares";
import { PILAR_ICONES } from "@/components/diagnostico/pilarIcones";

const COMO_FUNCIONA = [
  {
    icon: ClipboardList,
    titulo: "1. Perfil da empresa",
    texto: "Conte um pouco sobre você e o seu negócio.",
  },
  {
    icon: Compass,
    titulo: "2. Diagnóstico guiado",
    texto: "Responda perguntas objetivas sobre os 6 pilares da empresa.",
  },
  {
    icon: Sparkles,
    titulo: "3. Resultado imediato",
    texto: "Veja sua nota, sua classificação e os principais gargalos.",
  },
];

export default function DiagnosticoLandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <section className="bg-[var(--foreground)] px-5 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            Diagnóstico Empresarial 360
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl">
            Descubra o que realmente está impedindo sua empresa de crescer
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Em poucos minutos, analise os principais pilares da sua empresa e descubra onde estão os gargalos que
            podem estar limitando seus resultados.
          </p>
          <Link
            href="/diagnostico/aplicacao"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-sm font-semibold tracking-wide text-white transition-all hover:brightness-110 sm:text-base"
          >
            INICIAR MEU DIAGNÓSTICO
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-4xl px-5">
        <div className="card grid grid-cols-2 gap-5 p-6 sm:grid-cols-6 sm:p-8">
          {PILARES.map((pilar) => {
            const Icon = PILAR_ICONES[pilar.id];
            return (
              <div key={pilar.id} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-[var(--foreground)]">{pilar.nome}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          6 pilares analisados
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-3xl px-5 pb-20 sm:mt-24">
        <h2 className="text-center text-xl font-semibold text-[var(--foreground)] sm:text-2xl">Como funciona</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {COMO_FUNCIONA.map((etapa) => (
            <div key={etapa.titulo} className="card p-6 text-center">
              <etapa.icon className="mx-auto h-6 w-6 text-[var(--accent)]" />
              <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">{etapa.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{etapa.texto}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/diagnostico/aplicacao"
            className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold tracking-wide sm:text-base"
          >
            INICIAR MEU DIAGNÓSTICO
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
