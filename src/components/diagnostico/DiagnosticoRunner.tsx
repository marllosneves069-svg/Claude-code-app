"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DiagnosticoProgressBar } from "./DiagnosticoProgressBar";
import { PerfilStep } from "./PerfilStep";
import { PilarStep } from "./PilarStep";
import { ProcessingScreen } from "./ProcessingScreen";
import { PILARES, PILARES_POR_ID } from "@/lib/diagnostico/pilares";
import { perguntasDoPilar } from "@/lib/diagnostico/perguntas";
import { validarPerfil, type ErrosPerfil } from "@/lib/diagnostico/validacao";
import type { DiagnosticoPilarId, PerfilEmpresa, RespostaEnviada } from "@/lib/diagnostico/types";

type Etapa = { tipo: "perfil" } | { tipo: "pilar"; pilar: DiagnosticoPilarId };

const ETAPAS: Etapa[] = [{ tipo: "perfil" }, ...PILARES.map((p) => ({ tipo: "pilar" as const, pilar: p.id }))];

const PERFIL_INICIAL: Partial<PerfilEmpresa> = {
  nome: "",
  empresa: "",
  whatsapp: "",
  email: "",
  cidade: "",
  estado: "",
  segmentoOutro: "",
  tempoEmpresa: "",
  faturamentoMensal: "",
  quantidadePessoas: "",
  quantidadeVendedores: "",
  leadsMensais: "",
  investimentoAnuncios: "",
  ticketMedio: "",
  modeloOperacional: "",
  funcaoPrincipal: "",
  maiorProblema: "",
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function DiagnosticoRunner() {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [perfil, setPerfil] = useState<Partial<PerfilEmpresa>>(PERFIL_INICIAL);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [erros, setErros] = useState<ErrosPerfil>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [fase, setFase] = useState<"wizard" | "processando" | "erro">("wizard");
  const [mensagemErro, setMensagemErro] = useState("");

  const etapaAtual = ETAPAS[stepIndex];
  const isPrimeiraEtapa = stepIndex === 0;
  const isUltimaEtapa = stepIndex === ETAPAS.length - 1;

  const rotuloEtapa =
    etapaAtual.tipo === "perfil"
      ? `Etapa ${stepIndex + 1} de ${ETAPAS.length} · Perfil da empresa`
      : `Etapa ${stepIndex + 1} de ${ETAPAS.length} · ${PILARES_POR_ID.get(etapaAtual.pilar)?.nome}`;

  function handlePerfilChange(campo: keyof PerfilEmpresa, valor: string) {
    setPerfil((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleSelecionarResposta(codigo: string, opcaoIndex: number) {
    setAviso(null);
    setRespostas((prev) => ({ ...prev, [codigo]: opcaoIndex }));
  }

  const enviarDiagnostico = useCallback(async () => {
    setFase("processando");
    const payload = {
      perfil: { ...PERFIL_INICIAL, ...perfil } as PerfilEmpresa,
      respostas: Object.entries(respostas).map(([codigo, opcaoIndex]): RespostaEnviada => ({ codigo, opcaoIndex })),
    };

    try {
      const [res] = await Promise.all([
        fetch("/api/diagnostico/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        delay(1600),
      ]);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMensagemErro(body.error ?? "Não foi possível concluir seu diagnóstico. Tente novamente.");
        setFase("erro");
        return;
      }

      const { id } = (await res.json()) as { id: string };
      router.push(`/diagnostico/resultado/${id}`);
    } catch {
      setMensagemErro("Verifique sua conexão e tente novamente.");
      setFase("erro");
    }
  }, [perfil, respostas, router]);

  function handleContinuar() {
    if (etapaAtual.tipo === "perfil") {
      const errosValidacao = validarPerfil(perfil);
      if (Object.keys(errosValidacao).length > 0) {
        setErros(errosValidacao);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErros({});
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const perguntas = perguntasDoPilar(etapaAtual.pilar);
    const faltando = perguntas.some((p) => respostas[p.codigo] === undefined);
    if (faltando) {
      setAviso("Responda todas as perguntas desta etapa para continuar.");
      return;
    }
    setAviso(null);

    if (isUltimaEtapa) {
      enviarDiagnostico();
      return;
    }

    setStepIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleVoltar() {
    if (isPrimeiraEtapa) return;
    setAviso(null);
    setStepIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (fase === "processando") return <ProcessingScreen />;

  if (fase === "erro") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
        <div className="flex max-w-sm flex-col items-center gap-4">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Não foi possível enviar</h1>
          <p className="text-sm text-[var(--muted)]">{mensagemErro}</p>
          <button onClick={() => setFase("wizard")} className="btn-secondary mt-2">
            Voltar ao diagnóstico
          </button>
          <button onClick={enviarDiagnostico} className="btn-primary w-full py-3">
            Tentar enviar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:py-12">
        <DiagnosticoProgressBar current={stepIndex + 1} total={ETAPAS.length} label={rotuloEtapa} />

        <div key={stepIndex} className="animate-fade-slide-in">
          {etapaAtual.tipo === "perfil" ? (
            <PerfilStep perfil={perfil} erros={erros} onChange={handlePerfilChange} />
          ) : (
            <PilarStep
              titulo={PILARES_POR_ID.get(etapaAtual.pilar)!.nome}
              descricao={PILARES_POR_ID.get(etapaAtual.pilar)!.descricaoEtapa}
              perguntas={perguntasDoPilar(etapaAtual.pilar)}
              respostas={respostas}
              onSelecionar={handleSelecionarResposta}
            />
          )}
        </div>

        {aviso && <p className="mt-4 text-sm font-medium text-[var(--danger)]">{aviso}</p>}

        <div className="mt-8 flex items-center gap-3">
          {!isPrimeiraEtapa && (
            <button onClick={handleVoltar} className="btn-ghost px-3" aria-label="Voltar">
              <ChevronLeft className="h-5 w-5" />
              Voltar
            </button>
          )}
          <button onClick={handleContinuar} className="btn-primary flex-1 py-3.5 text-base">
            {isUltimaEtapa ? "Finalizar diagnóstico" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
