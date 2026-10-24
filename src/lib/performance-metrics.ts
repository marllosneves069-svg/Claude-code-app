// Pure calculation helpers for the performance dashboard (Meta Ads + Tiny).
// No I/O here — queries.ts-style loaders aggregate the rows and pass them in.

import type { TinySituacaoGroup } from "@/lib/database.types";

export const DEFAULT_AD_TAX_RATE = 0.1215;

export interface MetaTotals {
  /** null when the period reach couldn't be fetched from Meta. */
  reach: number | null;
  /** true when `reach` is the sum of daily reach (overcounts repeat viewers). */
  reachIsApproximate: boolean;
  impressions: number;
  linkClicks: number;
  messagingConversations: number;
  leads: number;
  spend: number;
}

export interface TinyTotals {
  openOrders: number;
  openValue: number;
  purchases: number;
  revenue: number;
}

export interface Funnel {
  reach: number | null;
  reachIsApproximate: boolean;
  impressions: number;
  linkClicks: number;
  contacts: number;
  costPerContact: number | null;
  spend: number;
  taxRate: number;
  tax: number;
  openOrders: number;
  openValue: number;
  costPerOpenOrder: number | null;
  purchases: number;
  costPerPurchase: number | null;
  contactToPurchaseRate: number | null;
  revenue: number;
  roas: number | null;
  averageTicket: number | null;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

/**
 * Every cost metric and the ROAS use the Meta spend WITHOUT the ad tax —
 * the tax is shown only as an informative line.
 */
export function buildFunnel(meta: MetaTotals, tiny: TinyTotals, taxRate: number): Funnel {
  const contacts = meta.messagingConversations + meta.leads;
  return {
    reach: meta.reach,
    reachIsApproximate: meta.reachIsApproximate,
    impressions: meta.impressions,
    linkClicks: meta.linkClicks,
    contacts,
    costPerContact: ratio(meta.spend, contacts),
    spend: meta.spend,
    taxRate,
    tax: meta.spend * taxRate,
    openOrders: tiny.openOrders,
    openValue: tiny.openValue,
    costPerOpenOrder: ratio(meta.spend, tiny.openOrders),
    purchases: tiny.purchases,
    costPerPurchase: ratio(meta.spend, tiny.purchases),
    contactToPurchaseRate: ratio(tiny.purchases, contacts),
    revenue: tiny.revenue,
    roas: ratio(tiny.revenue, meta.spend),
    averageTicket: ratio(tiny.revenue, tiny.purchases),
  };
}

export function sumTinyOrders(orders: { situacao_group: TinySituacaoGroup; valor: number }[]): TinyTotals {
  const totals: TinyTotals = { openOrders: 0, openValue: 0, purchases: 0, revenue: 0 };
  for (const o of orders) {
    if (o.situacao_group === "open") {
      totals.openOrders += 1;
      totals.openValue += Number(o.valor);
    } else if (o.situacao_group === "purchase") {
      totals.purchases += 1;
      totals.revenue += Number(o.valor);
    }
  }
  return totals;
}

// ----------------------------------------------------------------------------
// Formatting (pt-BR)
// ----------------------------------------------------------------------------
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatBRL(value: number | null): string {
  return value == null ? "—" : brl.format(value);
}

export function formatInt(value: number | null): string {
  return value == null ? "—" : integer.format(value);
}

export function formatPct(value: number | null, digits = 1): string {
  if (value == null) return "—";
  return `${(value * 100).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function formatRoas(value: number | null): string {
  return value == null ? "—" : decimal2.format(value);
}

/** % change between periods, or null when there's nothing to compare against. */
export function pctChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** The exact text of the agency's WhatsApp report, ready to paste. */
export function formatReportText(funnel: Funnel, periodLabel: string): string {
  const reach = funnel.reach == null ? "—" : `${funnel.reachIsApproximate ? "≈ " : ""}${formatInt(funnel.reach)}`;
  const taxPct = (funnel.taxRate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return [
    `📊 Relatório ${periodLabel}`,
    `👥 Pessoas alcançadas: ${reach}`,
    `🖼️ Impressões (Exibições dos anúncios): ${formatInt(funnel.impressions)}`,
    `🖱️ Clicaram no link: ${formatInt(funnel.linkClicks)}`,
    `☎️ Entraram em contato/form nativo: ${formatInt(funnel.contacts)}`,
    `💸 Custo por contato: ${formatBRL(funnel.costPerContact)}`,
    `💵 Investimento em anúncios: ${formatBRL(funnel.spend)}`,
    `Imposto: ${taxPct}% (${formatBRL(funnel.tax)})`,
    `📄Orçamentos em aberto: ${formatInt(funnel.openOrders)}`,
    `Valor parado em orçamento aberto: ${formatBRL(funnel.openValue)}`,
    `💸 Custo por orçamento: ${formatBRL(funnel.costPerOpenOrder)}`,
    `🤑 Compraram: ${formatInt(funnel.purchases)}`,
    `💸 Custo por venda: ${formatBRL(funnel.costPerPurchase)}`,
    `📈 Taxa de conversão de contato para venda: ${formatPct(funnel.contactToPurchaseRate)}`,
    `💰 Faturamento: ${formatBRL(funnel.revenue)}`,
    `💸 ROAS: ${formatRoas(funnel.roas)}`,
    `💸 Ticket médio: ${formatBRL(funnel.averageTicket)}`,
  ].join("\n\n");
}
