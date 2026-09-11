import { OptionCard } from "./OptionCard";
import type { PerguntaDiagnostico } from "@/lib/diagnostico/types";

export function PilarStep({
  titulo,
  descricao,
  perguntas,
  respostas,
  onSelecionar,
}: {
  titulo: string;
  descricao: string;
  perguntas: PerguntaDiagnostico[];
  respostas: Record<string, number>;
  onSelecionar: (codigo: string, opcaoIndex: number) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">{titulo}</h2>
        <p className="mt-1.5 text-sm text-[var(--muted)]">{descricao}</p>
      </div>

      <div className="flex flex-col gap-4">
        {perguntas.map((pergunta, idx) => (
          <div key={pergunta.codigo} className="card p-5">
            <p className="mb-4 text-sm font-medium text-[var(--foreground)]">
              <span className="mr-1.5 text-[var(--muted)]">{idx + 1}.</span>
              {pergunta.enunciado}
            </p>
            <div className="flex flex-col gap-2">
              {pergunta.opcoes.map((opcao, opcaoIndex) => (
                <OptionCard
                  key={opcaoIndex}
                  label={opcao.label}
                  selected={respostas[pergunta.codigo] === opcaoIndex}
                  onSelect={() => onSelecionar(pergunta.codigo, opcaoIndex)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
