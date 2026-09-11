import { notFound } from "next/navigation";
import { ArrowRight, MessageCircleQuestion, Sparkles } from "lucide-react";
import { buscarDiagnosticoPorId } from "@/lib/diagnostico/queries";
import { PILARES } from "@/lib/diagnostico/pilares";
import { CLASSIFICACAO_COR_HEX } from "@/lib/diagnostico/classificacaoCores";
import { ClassificacaoBadge } from "@/components/diagnostico/ClassificacaoBadge";
import { PilaresRadarChart } from "@/components/diagnostico/PilaresRadarChart";
import { PilarScoreList } from "@/components/diagnostico/PilarScoreList";
import { GargaloCard } from "@/components/diagnostico/GargaloCard";
import type { GargaloIdentificado } from "@/lib/diagnostico/types";

export const dynamic = "force-dynamic";

export default async function ResultadoDiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const diagnostico = await buscarDiagnosticoPorId(id);
  if (!diagnostico) notFound();

  const dadosRadar = PILARES.map((p) => ({ pilar: p.nome, nota: diagnostico.notas[p.id] }));
  const corGeral = CLASSIFICACAO_COR_HEX[diagnostico.classificacao];

  const ctaBase = process.env.NEXT_PUBLIC_DIAGNOSTICO_CTA_URL || "#";
  const ctaHref = ctaBase === "#" ? "#" : `${ctaBase}${ctaBase.includes("?") ? "&" : "?"}ref=${diagnostico.id}`;

  const gargalosComPosicao: { posicao: 1 | 2 | 3; gargalo: GargaloIdentificado }[] = [];
  if (diagnostico.gargalos[0]) gargalosComPosicao.push({ posicao: 1, gargalo: diagnostico.gargalos[0] });
  if (diagnostico.gargalos[1]) gargalosComPosicao.push({ posicao: 2, gargalo: diagnostico.gargalos[1] });
  if (diagnostico.gargalos[2]) gargalosComPosicao.push({ posicao: 3, gargalo: diagnostico.gargalos[2] });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--muted)]">{diagnostico.perfil.empresa}</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">Seu Diagnóstico Empresarial</h1>
        </div>

        <div className="card mt-8 flex flex-col items-center gap-3 p-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Nota geral</span>
          <span className="text-5xl font-bold" style={{ color: corGeral }}>
            {diagnostico.notaGeral.toFixed(0)}
            <span className="text-xl font-medium text-[var(--muted)]">/100</span>
          </span>
          <ClassificacaoBadge classificacao={diagnostico.classificacao} />
        </div>

        <section className="card mt-6 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Os seis pilares da sua empresa</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-center sm:gap-8">
            <PilaresRadarChart dados={dadosRadar} cor={corGeral} />
            <PilarScoreList notas={diagnostico.notas} />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Gargalos identificados</h2>
          <div className="flex flex-col gap-3">
            {gargalosComPosicao.map(({ posicao, gargalo }) => (
              <GargaloCard key={gargalo.pilar} posicao={posicao} gargalo={gargalo} />
            ))}
          </div>
        </section>

        <section className="card mt-6 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">O que você acredita ser seu principal problema</h2>
          <p className="mt-3 rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-[var(--foreground)] italic">
            “{diagnostico.perfil.maiorProblema}”
          </p>
        </section>

        <section className="card mt-6 border-dashed p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">O que os dados indicam</h2>
          <div className="mt-3 flex items-start gap-3 text-sm leading-relaxed text-[var(--muted)]">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
            <p>
              Esta análise interpretativa — cruzando os seis pilares com inteligência artificial — será adicionada em
              uma próxima etapa da plataforma.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-[var(--foreground)] p-8 text-center text-white sm:p-10">
          <MessageCircleQuestion className="mx-auto h-8 w-8 text-white/70" />
          <h2 className="mt-4 text-xl font-bold sm:text-2xl">Quer entender como corrigir esses gargalos?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
            Seu diagnóstico mostrou onde estão alguns dos principais pontos que podem estar limitando o crescimento
            da sua empresa. O próximo passo é transformar esses dados em um plano de ação.
          </p>
          <a
            href={ctaHref}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all hover:brightness-95"
          >
            QUERO UMA ANÁLISE ESTRATÉGICA
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </div>
    </div>
  );
}
