import { createClient } from "@/lib/supabase/server";
import { SurveyForm } from "@/components/admin/SurveyForm";

export default async function NewSurveyPage() {
  const supabase = await createClient();
  const { data: activeClients } = await supabase
    .from("clients")
    .select("*")
    .eq("status", "active")
    .order("company_name");

  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Nova pesquisa mensal</h1>
        <p className="text-sm text-[var(--muted)]">
          Um link único e seguro será gerado automaticamente para cada cliente selecionado.
        </p>
      </div>
      <SurveyForm activeClients={activeClients ?? []} defaultMonth={next.getMonth() + 1} defaultYear={next.getFullYear()} />
    </div>
  );
}
