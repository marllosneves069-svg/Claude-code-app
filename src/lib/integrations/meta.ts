// Meta Marketing API (Graph API) client — read-only insights for one ad
// account, configured via env vars. Server-side only: it reads the access
// token from the environment. Kept free of `server-only`/Next imports so the
// `npm run sync` script can use it too.

export interface MetaConfig {
  accessToken: string;
  adAccountId: string;
  apiVersion: string;
}

export function getMetaConfig(): MetaConfig | null {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const rawAccount = process.env.META_AD_ACCOUNT_ID;
  if (!accessToken || !rawAccount) return null;
  return {
    accessToken,
    adAccountId: rawAccount.startsWith("act_") ? rawAccount : `act_${rawAccount}`,
    apiVersion: process.env.META_API_VERSION || "v23.0",
  };
}

/**
 * Which Meta `actions` count toward each dashboard metric. "Contato" =
 * conversations started by message (WhatsApp/Direct/Messenger) + instant-form
 * leads. We deliberately use `onsite_conversion.lead_grouped` instead of the
 * generic `lead`, which also includes pixel (website) leads.
 */
export const META_ACTION_TYPES = {
  messagingConversations: "onsite_conversion.messaging_conversation_started_7d",
  leads: "onsite_conversion.lead_grouped",
  purchases: "omni_purchase",
} as const;

interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaInsightRow {
  date_start: string;
  date_stop: string;
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  inline_link_clicks?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
}

export interface MetaCampaignDay {
  date: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  reach: number;
  link_clicks: number;
  messaging_conversations: number;
  leads: number;
  meta_purchases: number;
  meta_purchase_value: number;
}

export function actionValue(actions: MetaAction[] | undefined, type: string): number {
  const found = actions?.find((a) => a.action_type === type);
  return found ? Number(found.value) || 0 : 0;
}

export function parseInsightRow(row: MetaInsightRow): MetaCampaignDay {
  return {
    date: row.date_start,
    campaign_id: row.campaign_id ?? "unknown",
    campaign_name: row.campaign_name ?? "(sem nome)",
    spend: Number(row.spend) || 0,
    impressions: Number(row.impressions) || 0,
    reach: Number(row.reach) || 0,
    link_clicks: Number(row.inline_link_clicks) || 0,
    messaging_conversations: actionValue(row.actions, META_ACTION_TYPES.messagingConversations),
    leads: actionValue(row.actions, META_ACTION_TYPES.leads),
    meta_purchases: actionValue(row.actions, META_ACTION_TYPES.purchases),
    meta_purchase_value: actionValue(row.action_values, META_ACTION_TYPES.purchases),
  };
}

interface GraphPage<T> {
  data: T[];
  paging?: { next?: string };
  error?: { message: string; code: number };
}

async function graphGet<T>(url: string, init?: RequestInit): Promise<GraphPage<T>> {
  const res = await fetch(url, init);
  const body = (await res.json()) as GraphPage<T>;
  if (!res.ok || body.error) {
    throw new Error(`Meta API: ${body.error?.message ?? res.statusText}`);
  }
  return body;
}

function insightsUrl(config: MetaConfig, params: Record<string, string>): string {
  const url = new URL(`https://graph.facebook.com/${config.apiVersion}/${config.adAccountId}/insights`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", config.accessToken);
  return url.toString();
}

/** Daily insights per campaign for [since, until] (inclusive, account timezone). */
export async function fetchCampaignDaily(config: MetaConfig, since: string, until: string): Promise<MetaCampaignDay[]> {
  let url: string | undefined = insightsUrl(config, {
    level: "campaign",
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    fields: "campaign_id,campaign_name,spend,impressions,reach,inline_link_clicks,actions,action_values",
    limit: "500",
  });
  const rows: MetaCampaignDay[] = [];
  while (url) {
    const page: GraphPage<MetaInsightRow> = await graphGet<MetaInsightRow>(url);
    rows.push(...page.data.map(parseInsightRow));
    url = page.paging?.next;
  }
  return rows;
}

/**
 * Unique reach for the whole period at account level. Reach can't be summed
 * day by day (the same person counts once per day), so the dashboard asks
 * Meta directly. Cached for an hour by Next's fetch cache.
 */
export async function getPeriodReach(config: MetaConfig, since: string, until: string): Promise<number> {
  const url = insightsUrl(config, {
    level: "account",
    time_range: JSON.stringify({ since, until }),
    fields: "reach",
  });
  const page = await graphGet<MetaInsightRow>(url, { next: { revalidate: 3600 } } as RequestInit);
  return Number(page.data[0]?.reach) || 0;
}
