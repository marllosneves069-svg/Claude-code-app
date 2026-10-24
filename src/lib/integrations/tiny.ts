// Tiny ERP (Olist) API v2 client — token auth, read-only. Docs:
// https://tiny.com.br/api-docs (endpoints are POST https://api.tiny.com.br/api2/<name>.php
// with `token` + `formato=json` as form fields).
//
// Tiny enforces a per-minute request quota that depends on the plan, so every
// call goes through a simple serial rate limiter, and "API bloqueada" answers
// back off and retry. Kept free of `server-only`/Next imports so the
// `npm run sync` script can use it too.

import type { TinySituacaoGroup } from "@/lib/database.types";

const BASE_URL = "https://api.tiny.com.br/api2";

/** Tiny error code for "A consulta não retornou registros" — an empty page, not a failure. */
const NO_RECORDS_CODE = "20";
/** Tiny error code for "API bloqueada" / too many requests. */
const BLOCKED_CODE = "6";

export interface TinyConfig {
  token: string;
  /** Minimum gap between requests. Default ≈ 28 req/min, safe for every plan. */
  intervalMs: number;
}

export function getTinyConfig(): TinyConfig | null {
  const token = process.env.TINY_API_TOKEN;
  if (!token) return null;
  return { token, intervalMs: Number(process.env.TINY_REQUEST_INTERVAL_MS) || 2100 };
}

// ----------------------------------------------------------------------------
// Situação → dashboard bucket
// ----------------------------------------------------------------------------
const OPEN_SITUACOES = new Set(["em aberto", "aberto"]);
const PURCHASE_SITUACOES = new Set([
  "aprovado",
  "preparando envio",
  "faturado",
  "pronto para envio",
  "enviado",
  "entregue",
]);

export function normalizeSituacao(situacao: string | null | undefined): TinySituacaoGroup {
  const key = (situacao ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  if (OPEN_SITUACOES.has(key)) return "open";
  if (PURCHASE_SITUACOES.has(key)) return "purchase";
  return "excluded";
}

// ----------------------------------------------------------------------------
// Low-level request
// ----------------------------------------------------------------------------
interface TinyRetorno {
  status: "OK" | "Erro";
  codigo_erro?: string | number;
  erros?: { erro: string }[];
  pagina?: number | string;
  numero_paginas?: number | string;
  [key: string]: unknown;
}

let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tinyRequest(config: TinyConfig, endpoint: string, params: Record<string, string>): Promise<TinyRetorno | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = lastRequestAt + config.intervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();

    const res = await fetch(`${BASE_URL}/${endpoint}.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: config.token, formato: "json", ...params }),
    });
    if (res.status === 429) {
      await sleep(30_000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Tiny ${endpoint}: HTTP ${res.status}`);

    const { retorno } = (await res.json()) as { retorno: TinyRetorno };
    if (retorno.status === "OK") return retorno;

    const code = String(retorno.codigo_erro ?? "");
    if (code === NO_RECORDS_CODE) return null;
    if (code === BLOCKED_CODE) {
      await sleep(30_000 * (attempt + 1));
      continue;
    }
    const message = retorno.erros?.map((e) => e.erro).join("; ") || `código ${code}`;
    throw new Error(`Tiny ${endpoint}: ${message}`);
  }
  throw new Error(`Tiny ${endpoint}: limite de requisições excedido após várias tentativas.`);
}

async function* paginate<T>(
  config: TinyConfig,
  endpoint: string,
  listKey: string,
  params: Record<string, string>
): AsyncGenerator<T[]> {
  for (let page = 1; ; page++) {
    const retorno = await tinyRequest(config, endpoint, { ...params, pagina: String(page) });
    if (!retorno) return;
    const list = (retorno[listKey] as T[] | undefined) ?? [];
    yield list;
    if (page >= Number(retorno.numero_paginas ?? 1)) return;
  }
}

/** "YYYY-MM-DD" → "DD/MM/YYYY". */
export function toTinyDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** "DD/MM/YYYY" → "YYYY-MM-DD". */
export function fromTinyDate(date: string): string {
  const [d, m, y] = date.split("/");
  return `${y}-${m}-${d}`;
}

/** Date → "DD/MM/YYYY HH:mm:ss" in the store timezone (Tiny's dataAtualizacao format). */
export function toTinyDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return parts.replace(",", "");
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function nullableNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ----------------------------------------------------------------------------
// Orders
// ----------------------------------------------------------------------------
interface TinyPedidoResumo {
  id: string | number;
  numero?: string | number;
  numero_ecommerce?: string | null;
  data_pedido: string;
  nome?: string;
  valor?: string | number;
  nome_vendedor?: string;
  situacao: string;
}

export interface TinyOrderSummary {
  tiny_id: string;
  numero: string | null;
  numero_ecommerce: string | null;
  data_pedido: string;
  situacao: string;
  situacao_group: TinySituacaoGroup;
  valor: number;
  cliente_nome: string | null;
  vendedor_nome: string | null;
}

export function parsePedidoResumo(p: TinyPedidoResumo): TinyOrderSummary {
  return {
    tiny_id: String(p.id),
    numero: p.numero != null ? String(p.numero) : null,
    numero_ecommerce: p.numero_ecommerce || null,
    data_pedido: fromTinyDate(p.data_pedido),
    situacao: p.situacao,
    situacao_group: normalizeSituacao(p.situacao),
    valor: num(p.valor),
    cliente_nome: p.nome || null,
    vendedor_nome: p.nome_vendedor || null,
  };
}

/**
 * Orders by order date (backfill) or changed since a moment (incremental).
 * Yields one page at a time so callers can persist as they go.
 */
export async function* searchOrders(
  config: TinyConfig,
  filter: { from: string; to: string } | { updatedSince: Date }
): AsyncGenerator<TinyOrderSummary[]> {
  const params: Record<string, string> =
    "updatedSince" in filter
      ? { dataAtualizacao: toTinyDateTime(filter.updatedSince) }
      : { dataInicial: toTinyDate(filter.from), dataFinal: toTinyDate(filter.to) };
  for await (const page of paginate<{ pedido: TinyPedidoResumo }>(config, "pedidos.pesquisa", "pedidos", params)) {
    yield page.map((p) => parsePedidoResumo(p.pedido));
  }
}

export interface TinyOrderDetail {
  ecommerce: string | null;
  items: { product_id: string | null; sku: string | null; descricao: string; quantidade: number; valor_unitario: number }[];
}

interface TinyPedidoCompleto {
  ecommerce?: { nomeEcommerce?: string } | null;
  itens?: {
    item: { id_produto?: string | number; codigo?: string; descricao: string; quantidade: string; valor_unitario: string };
  }[];
}

export async function getOrderDetail(config: TinyConfig, tinyId: string): Promise<TinyOrderDetail | null> {
  const retorno = await tinyRequest(config, "pedido.obter", { id: tinyId });
  const pedido = retorno?.pedido as TinyPedidoCompleto | undefined;
  if (!pedido) return null;
  return {
    ecommerce: pedido.ecommerce?.nomeEcommerce || null,
    items: (pedido.itens ?? []).map(({ item }) => ({
      product_id: item.id_produto != null && item.id_produto !== "" ? String(item.id_produto) : null,
      sku: item.codigo || null,
      descricao: item.descricao,
      quantidade: num(item.quantidade),
      valor_unitario: num(item.valor_unitario),
    })),
  };
}

// ----------------------------------------------------------------------------
// Products & stock
// ----------------------------------------------------------------------------
interface TinyProdutoResumo {
  id: string | number;
  codigo?: string;
  nome: string;
  preco?: string | number;
  preco_custo?: string | number;
  situacao?: string;
}

export interface TinyProductSummary {
  tiny_id: string;
  sku: string | null;
  nome: string;
  preco: number | null;
  preco_custo: number | null;
  situacao: string | null;
}

export async function* searchProducts(config: TinyConfig): AsyncGenerator<TinyProductSummary[]> {
  for await (const page of paginate<{ produto: TinyProdutoResumo }>(config, "produtos.pesquisa", "produtos", {
    pesquisa: "",
  })) {
    yield page.map(({ produto: p }) => ({
      tiny_id: String(p.id),
      sku: p.codigo || null,
      nome: p.nome,
      preco: nullableNum(p.preco),
      preco_custo: nullableNum(p.preco_custo),
      situacao: p.situacao || null,
    }));
  }
}

/** Products whose stock changed since `since` (Tiny keeps ~30 days of history). */
export async function* listStockUpdates(
  config: TinyConfig,
  since: Date
): AsyncGenerator<{ tiny_id: string; estoque: number }[]> {
  for await (const page of paginate<{ produto: { id: string | number; saldo?: string | number } }>(
    config,
    "lista.atualizacoes.estoque",
    "produtos",
    { dataAlteracao: toTinyDateTime(since) }
  )) {
    yield page.map(({ produto }) => ({ tiny_id: String(produto.id), estoque: num(produto.saldo) }));
  }
}

export async function getProductStock(config: TinyConfig, tinyId: string): Promise<number | null> {
  const retorno = await tinyRequest(config, "produto.obter.estoque", { id: tinyId });
  const produto = retorno?.produto as { saldo?: string | number } | undefined;
  return produto ? num(produto.saldo) : null;
}
