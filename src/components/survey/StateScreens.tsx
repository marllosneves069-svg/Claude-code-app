import { CheckCircle2, Waves } from "lucide-react";

export function AlreadyAnsweredScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="max-w-sm text-xl font-semibold text-[var(--foreground)]">
        Esta pesquisa já foi respondida.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">Obrigado pela sua participação.</p>
    </div>
  );
}

export function ThankYouScreen({ companyName }: { companyName?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <div className="animate-fade-slide-in mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5L9.5 17L19 7"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-check-draw"
          />
        </svg>
      </div>
      <h1 className="animate-fade-slide-in max-w-sm text-xl font-semibold text-[var(--foreground)]">
        Obrigado pelo seu feedback!
      </h1>
      <p className="animate-fade-slide-in mt-2 max-w-sm text-sm text-[var(--muted)]">
        Sua resposta foi registrada e será utilizada para continuarmos melhorando nosso trabalho
        {companyName ? ` para ${companyName}` : ""}.
      </p>
    </div>
  );
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <Waves className="h-7 w-7" />
      </div>
      <h1 className="max-w-sm text-xl font-semibold text-[var(--foreground)]">Não foi possível enviar</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}
