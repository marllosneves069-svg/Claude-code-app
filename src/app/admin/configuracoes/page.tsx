import { getAdTaxRate, getHealthThresholds } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { AdTaxForm } from "@/components/admin/AdTaxForm";

export default async function SettingsPage() {
  const [thresholds, taxRate] = await Promise.all([getHealthThresholds(), getAdTaxRate()]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Configurações</h1>
        <p className="text-sm text-[var(--muted)]">
          Ajuste os limites usados para classificar a saúde dos clientes e disparar alertas.
        </p>
      </div>
      <SettingsForm thresholds={thresholds} />
      <AdTaxForm taxRate={taxRate} />
    </div>
  );
}
