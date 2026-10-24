// Date-range helpers for the performance dashboard. Pure functions (no
// server/client-only imports) so the page, the range selector and the sync
// job all agree on what "today" and each preset mean.
//
// Every date is a "YYYY-MM-DD" string in the store's timezone (São Paulo),
// which is also how Meta (account timezone) and Tiny report their days.

export const STORE_TIMEZONE = "America/Sao_Paulo";

export type RangePreset = "today" | "7d" | "30d" | "this_month" | "last_month" | "custom";

export interface DateRange {
  from: string;
  to: string;
}

export const RANGE_PRESETS: { value: Exclude<RangePreset, "custom">; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayInStore(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE }).format(now);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

export function eachDay(range: DateRange): string[] {
  const days: string[] = [];
  for (let d = range.from; d <= range.to; d = addDays(d, 1)) days.push(d);
  return days;
}

export function presetRange(preset: Exclude<RangePreset, "custom">, today: string = todayInStore()): DateRange {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "this_month":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "last_month": {
      const firstOfThisMonth = `${today.slice(0, 8)}01`;
      const lastOfPrev = addDays(firstOfThisMonth, -1);
      return { from: `${lastOfPrev.slice(0, 8)}01`, to: lastOfPrev };
    }
  }
}

/** Resolves the page's searchParams into a concrete range (defaults to "Este mês"). */
export function resolveRange(params: { range?: string; from?: string; to?: string }): {
  preset: RangePreset;
  range: DateRange;
} {
  if (params.from && params.to && ISO_DATE.test(params.from) && ISO_DATE.test(params.to)) {
    const [from, to] = params.from <= params.to ? [params.from, params.to] : [params.to, params.from];
    return { preset: "custom", range: { from, to } };
  }
  const preset = RANGE_PRESETS.find((p) => p.value === params.range)?.value ?? "this_month";
  return { preset, range: presetRange(preset) };
}

/** Same-length window immediately before `range`, used for the deltas. */
export function previousRange(range: DateRange): DateRange {
  const length = daysBetween(range.from, range.to) + 1;
  return { from: addDays(range.from, -length), to: addDays(range.from, -1) };
}

export function formatDay(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDayShort(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

export function rangeLabel(range: DateRange): string {
  return range.from === range.to ? formatDay(range.from) : `${formatDay(range.from)} a ${formatDay(range.to)}`;
}
