"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { ProgressBar } from "@/components/survey/ProgressBar";
import { ScaleFivePicker } from "@/components/survey/ScaleFivePicker";
import { NpsPicker } from "@/components/survey/NpsPicker";
import { RetentionPicker } from "@/components/survey/RetentionPicker";
import { TextQuestion } from "@/components/survey/TextQuestion";
import { ThankYouScreen, ErrorScreen, AlreadyAnsweredScreen } from "@/components/survey/StateScreens";
import type { QuestionType } from "@/lib/database.types";

export interface RunnerQuestion {
  id: string;
  code: string;
  question: string;
  question_type: QuestionType;
  order: number;
  placeholder?: string | null;
}

type Answer = { numeric_value?: number; text_value?: string };

const AUTO_ADVANCE_DELAY = 420;

export function SurveyRunner({
  token,
  contactName,
  questions,
}: {
  token: string;
  contactName: string;
  questions: RunnerQuestion[];
}) {
  const [phase, setPhase] = useState<"welcome" | "questions" | "submitting" | "done" | "already" | "error">("welcome");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  async function submit(finalAnswers: Record<string, Answer>) {
    setPhase("submitting");
    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers: Object.entries(finalAnswers).map(([code, a]) => ({ code, ...a })),
        }),
      });

      if (res.status === 409) {
        setPhase("already");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error ?? "Tente novamente em instantes.");
        setPhase("error");
        return;
      }
      setPhase("done");
    } catch {
      setErrorMessage("Verifique sua conexão e tente novamente.");
      setPhase("error");
    }
  }

  function goNext(updatedAnswers: Record<string, Answer>) {
    if (isLast) {
      submit(updatedAnswers);
      return;
    }
    setCurrentIndex((i) => i + 1);
  }

  function handleNumeric(code: string, value: number) {
    const updated = { ...answers, [code]: { numeric_value: value } };
    setAnswers(updated);
    setTimeout(() => goNext(updated), AUTO_ADVANCE_DELAY);
  }

  function handleTextChange(code: string, value: string) {
    setAnswers((prev) => ({ ...prev, [code]: { text_value: value } }));
  }

  function handleContinue() {
    goNext(answers);
  }

  if (phase === "done") return <ThankYouScreen />;
  if (phase === "already") return <AlreadyAnsweredScreen />;
  if (phase === "error") return <ErrorScreen message={errorMessage} />;

  if (phase === "welcome") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
        <div className="animate-fade-slide-in flex max-w-sm flex-col items-center gap-4">
          <p className="text-lg text-[var(--muted)]">Olá, {contactName} 👋</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Queremos ouvir você</h1>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Sua opinião nos ajuda a entender o que está funcionando e onde podemos evoluir. Leva menos de 2
            minutos.
          </p>
          <button onClick={() => setPhase("questions")} className="btn-primary mt-3 w-full py-3.5 text-base">
            Começar
          </button>
        </div>
      </div>
    );
  }

  const currentAnswer = answers[current.code];
  const textValue = currentAnswer?.text_value ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8 sm:py-12">
        <ProgressBar current={currentIndex + 1} total={questions.length} />

        <div key={current.id} className="animate-fade-slide-in flex flex-1 flex-col">
          <h2 className="mb-6 text-lg font-semibold leading-snug text-[var(--foreground)] sm:text-xl">
            {current.question}
          </h2>

          <div className="flex-1">
            {current.question_type === "nps" && (
              <NpsPicker value={currentAnswer?.numeric_value ?? null} onSelect={(v) => handleNumeric(current.code, v)} />
            )}
            {current.question_type === "scale_5" && (
              <ScaleFivePicker value={currentAnswer?.numeric_value ?? null} onSelect={(v) => handleNumeric(current.code, v)} />
            )}
            {current.question_type === "scale_5_inverted" && (
              <RetentionPicker value={currentAnswer?.numeric_value ?? null} onSelect={(v) => handleNumeric(current.code, v)} />
            )}
            {current.question_type === "text" && (
              <TextQuestion
                value={textValue}
                onChange={(v) => handleTextChange(current.code, v)}
                placeholder={current.placeholder ?? undefined}
              />
            )}
          </div>

          <div className="mt-8 flex items-center gap-3">
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="btn-ghost px-3"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {current.question_type === "text" && (
              <button onClick={handleContinue} className="btn-primary flex-1 py-3.5 text-base">
                {isLast ? "Enviar resposta" : "Continuar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
