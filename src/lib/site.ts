export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function surveyLink(token: string): string {
  return `${getSiteUrl()}/pesquisa/${token}`;
}

export function surveyMessage(contactName: string, link: string): string {
  return `Olá, ${contactName}! Tudo bem?\n\nPreparamos nossa pesquisa mensal de satisfação. Seu feedback é muito importante para continuarmos evoluindo nosso trabalho.\n\nLeva menos de 2 minutos:\n\n${link}\n\nObrigado!`;
}
