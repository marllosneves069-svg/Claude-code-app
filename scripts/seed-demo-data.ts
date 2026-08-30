/**
 * Demo data seed script.
 *
 * Creates 15 fictitious clients and 6 months of survey history (invitations
 * + responses + answers) so the dashboard, client history charts, and
 * alerts have something to show right after setup. Everything created here
 * is flagged `is_demo = true` on clients/surveys, so it can be identified
 * and removed later with `npm run seed:clear`.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-demo-data.ts
 */
import { createClient } from "@supabase/supabase-js";
import { QUESTION_TEMPLATES } from "../src/lib/questions";
import { calculateMhs } from "../src/lib/metrics";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: npx tsx --env-file=.env.local scripts/seed-demo-data.ts"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Archetype = "healthy" | "attention" | "risk" | "nps_drop" | "mhs_drop";

interface DemoClient {
  company_name: string;
  contact_name: string;
  email: string;
  whatsapp: string;
  service: string;
  archetype: Archetype;
  status?: "active" | "paused" | "ended";
}

const DEMO_CLIENTS: DemoClient[] = [
  { company_name: "Aurora Digital", contact_name: "Camila Rocha", email: "camila@auroradigital.com", whatsapp: "(11) 98888-1001", service: "Tráfego pago + Social Media", archetype: "healthy" },
  { company_name: "Bravo Consultoria", contact_name: "Rafael Souza", email: "rafael@bravoconsult.com", whatsapp: "(11) 98888-1002", service: "Gestão de tráfego", archetype: "healthy" },
  { company_name: "Cedro Móveis", contact_name: "Patrícia Lima", email: "patricia@cedromoveis.com", whatsapp: "(11) 98888-1003", service: "Performance + CRM", archetype: "healthy" },
  { company_name: "Dallas Odontologia", contact_name: "Fernando Alves", email: "fernando@dallasodonto.com", whatsapp: "(11) 98888-1004", service: "Tráfego pago", archetype: "healthy" },
  { company_name: "Elo Contabilidade", contact_name: "Juliana Prado", email: "juliana@elocontabil.com", whatsapp: "(11) 98888-1005", service: "Marketing de conteúdo", archetype: "healthy" },
  { company_name: "Fenix Academia", contact_name: "Bruno Cardoso", email: "bruno@fenixacademia.com", whatsapp: "(11) 98888-1006", service: "Tráfego pago + Social Media", archetype: "healthy" },
  { company_name: "Girassol Estética", contact_name: "Renata Dias", email: "renata@girassolestetica.com", whatsapp: "(11) 98888-1007", service: "Gestão de redes sociais", archetype: "attention" },
  { company_name: "Horizonte Imóveis", contact_name: "Marcelo Teixeira", email: "marcelo@horizonteimoveis.com", whatsapp: "(11) 98888-1008", service: "Performance + Landing pages", archetype: "attention" },
  { company_name: "Íris Jurídico", contact_name: "Aline Barbosa", email: "aline@irisjuridico.com", whatsapp: "(11) 98888-1009", service: "Marketing de conteúdo", archetype: "attention" },
  { company_name: "Jato Logística", contact_name: "Diego Martins", email: "diego@jatologistica.com", whatsapp: "(11) 98888-1010", service: "Tráfego pago", archetype: "attention" },
  { company_name: "Kaza Decor", contact_name: "Beatriz Nunes", email: "beatriz@kazadecor.com", whatsapp: "(11) 98888-1011", service: "Gestão de tráfego + CRM", archetype: "risk" },
  { company_name: "Litoral Turismo", contact_name: "Gustavo Pires", email: "gustavo@litoralturismo.com", whatsapp: "(11) 98888-1012", service: "Tráfego pago", archetype: "risk" },
  { company_name: "Meridiano Educação", contact_name: "Larissa Fonseca", email: "larissa@meridianoeduc.com", whatsapp: "(11) 98888-1013", service: "Performance", archetype: "risk", status: "paused" },
  { company_name: "Nortel Tecnologia", contact_name: "Eduardo Ramos", email: "eduardo@norteltec.com", whatsapp: "(11) 98888-1014", service: "Tráfego pago + Social Media", archetype: "nps_drop" },
  { company_name: "Conectar Soluções", contact_name: "Vanessa Melo", email: "vanessa@conectarsolucoes.com", whatsapp: "(11) 98888-1015", service: "Gestão de tráfego", archetype: "mhs_drop" },
];

const FEEDBACK_POOL: Record<Archetype | "generic", string[]> = {
  healthy: [
    "Muito satisfeito com os resultados. A equipe é ágil e sempre transparente sobre os números.",
    "Só elogios, a comunicação melhorou muito nos últimos meses.",
    "Continuem assim, os resultados falam por si.",
  ],
  attention: [
    "Gostaria de entender melhor a estratégia dos próximos meses.",
    "Os resultados estão bons, mas senti falta de mais proatividade em sugerir novidades.",
    "Poderiam agilizar um pouco mais os prazos combinados.",
  ],
  risk: [
    "Não estou vendo os resultados esperados nos últimos meses.",
    "Faltou clareza sobre o que está sendo feito no projeto.",
    "Esperava mais retorno considerando o investimento.",
  ],
  nps_drop: [
    "Tivemos um mês mais fraco, esperamos que os próximos resultados melhorem.",
    "Fiquei receoso com a queda nos resultados deste mês.",
  ],
  mhs_drop: [
    "A comunicação piorou bastante neste último mês, precisamos conversar.",
    "Sentimos uma queda na proatividade da equipe recentemente.",
  ],
  generic: ["Sem comentários adicionais neste mês."],
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/** Score band per archetype: [nps, scaleMin, scaleMax, retentionBand]. */
function scoresFor(archetype: Archetype, monthIndex: number, totalMonths: number) {
  const isLastMonth = monthIndex === totalMonths - 1;

  switch (archetype) {
    case "healthy":
      return { nps: randomInt(9, 10), scaleMin: 4, scaleMax: 5, retention: randomInt(1, 2) };
    case "attention":
      return { nps: randomInt(7, 8), scaleMin: 3, scaleMax: 4, retention: randomInt(2, 3) };
    case "risk":
      return { nps: randomInt(2, 5), scaleMin: 1, scaleMax: 3, retention: randomInt(4, 5) };
    case "nps_drop":
      if (isLastMonth) return { nps: randomInt(3, 5), scaleMin: 3, scaleMax: 4, retention: randomInt(3, 4) };
      return { nps: randomInt(9, 10), scaleMin: 4, scaleMax: 5, retention: randomInt(1, 2) };
    case "mhs_drop":
      if (isLastMonth) return { nps: randomInt(6, 7), scaleMin: 1, scaleMax: 2, retention: randomInt(4, 5) };
      return { nps: randomInt(8, 9), scaleMin: 4, scaleMax: 5, retention: randomInt(1, 2) };
  }
}

function feedbackFor(archetype: Archetype, monthIndex: number, totalMonths: number) {
  const isLastMonth = monthIndex === totalMonths - 1;
  if ((archetype === "nps_drop" || archetype === "mhs_drop") && isLastMonth) {
    return pick(FEEDBACK_POOL[archetype]);
  }
  if (archetype === "healthy") return pick(FEEDBACK_POOL.healthy);
  if (archetype === "attention") return pick(FEEDBACK_POOL.attention);
  if (archetype === "risk") return pick(FEEDBACK_POOL.risk);
  return pick(FEEDBACK_POOL.generic);
}

function lastNMonths(n: number): { month: number; year: number }[] {
  const result: { month: number; year: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return result;
}

async function clearDemoData() {
  console.log("Clearing previous demo data...");
  const { data: demoClients } = await supabase.from("clients").select("id").eq("is_demo", true);
  const { data: demoSurveys } = await supabase.from("surveys").select("id").eq("is_demo", true);

  const clientIds = (demoClients ?? []).map((c) => c.id);
  const surveyIds = (demoSurveys ?? []).map((s) => s.id);

  if (surveyIds.length > 0) {
    await supabase.from("surveys").delete().in("id", surveyIds); // cascades invitations/questions/responses
  }
  if (clientIds.length > 0) {
    await supabase.from("clients").delete().in("id", clientIds);
  }
}

async function main() {
  await clearDemoData();

  console.log(`Creating ${DEMO_CLIENTS.length} demo clients...`);
  const { data: insertedClients, error: clientsError } = await supabase
    .from("clients")
    .insert(
      DEMO_CLIENTS.map((c) => ({
        company_name: c.company_name,
        contact_name: c.contact_name,
        email: c.email,
        whatsapp: c.whatsapp,
        service: c.service,
        status: c.status ?? "active",
        start_date: "2025-06-01",
        notes: "Cliente de demonstração — dados fictícios, pode ser removido a qualquer momento.",
        is_demo: true,
      }))
    )
    .select("id, company_name");

  if (clientsError || !insertedClients) {
    throw new Error(`Failed to insert demo clients: ${clientsError?.message}`);
  }

  const clientsWithArchetype = insertedClients.map((row) => {
    const source = DEMO_CLIENTS.find((c) => c.company_name === row.company_name)!;
    return { ...row, archetype: source.archetype };
  });

  const months = lastNMonths(6);
  console.log(`Creating ${months.length} monthly surveys with responses...`);

  for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
    const { month, year } = months[monthIndex];
    const isLastMonth = monthIndex === months.length - 1;
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];

    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        name: `${monthNames[month - 1]} de ${year}`,
        month,
        year,
        status: isLastMonth ? "in_progress" : "closed",
        is_demo: true,
        closed_at: isLastMonth ? null : new Date(year, month, 1).toISOString(),
      })
      .select("id")
      .single();

    if (surveyError || !survey) throw new Error(`Failed to create survey ${month}/${year}: ${surveyError?.message}`);

    const { data: questions, error: questionsError } = await supabase
      .from("survey_questions")
      .insert(
        QUESTION_TEMPLATES.map((q) => ({
          survey_id: survey.id,
          code: q.code,
          question: q.question,
          question_type: q.question_type,
          order: q.order,
          is_mhs: q.is_mhs,
          is_retention: q.is_retention,
          weight: q.weight,
        }))
      )
      .select("id, code, is_mhs, is_retention, weight");

    if (questionsError || !questions) throw new Error(`Failed to create questions: ${questionsError?.message}`);

    for (const client of clientsWithArchetype) {
      // On the current (in-progress) month, leave ~20% of clients pending to show a realistic response rate.
      const willAnswer = !isLastMonth || Math.random() > 0.2;

      const { data: invitation, error: invitationError } = await supabase
        .from("survey_invitations")
        .insert({
          survey_id: survey.id,
          client_id: client.id,
          status: willAnswer ? "answered" : "pending",
          created_at: new Date(year, month - 1, 3).toISOString(),
          answered_at: willAnswer ? new Date(year, month - 1, randomInt(5, 25)).toISOString() : null,
        })
        .select("id")
        .single();

      if (invitationError || !invitation) throw new Error(`Failed to create invitation: ${invitationError?.message}`);
      if (!willAnswer) continue;

      const bands = scoresFor(client.archetype, monthIndex, months.length);
      const answerValues = new Map<string, { numeric?: number; text?: string }>();

      for (const q of questions) {
        if (q.code === "nps") {
          answerValues.set(q.code, { numeric: bands.nps });
        } else if (q.is_mhs) {
          answerValues.set(q.code, { numeric: randomInt(bands.scaleMin, bands.scaleMax) });
        } else if (q.is_retention) {
          answerValues.set(q.code, { numeric: bands.retention });
        } else if (q.code === "feedback") {
          answerValues.set(q.code, { text: feedbackFor(client.archetype, monthIndex, months.length) });
        }
      }

      const mhsInputs = questions
        .filter((q) => q.is_mhs)
        .map((q) => ({ value: answerValues.get(q.code)!.numeric!, weight: q.weight }));
      const mhs = calculateMhs(mhsInputs);

      const { data: response, error: responseError } = await supabase
        .from("responses")
        .insert({
          invitation_id: invitation.id,
          survey_id: survey.id,
          client_id: client.id,
          nps_score: bands.nps,
          mhs_average: mhs.average,
          mhs_percentage: mhs.percentage,
          retention_answer: bands.retention,
          feedback: answerValues.get("feedback")?.text ?? null,
          submitted_at: new Date(year, month - 1, randomInt(5, 25)).toISOString(),
        })
        .select("id")
        .single();

      if (responseError || !response) throw new Error(`Failed to create response: ${responseError?.message}`);

      const answerRows = questions.map((q) => {
        const value = answerValues.get(q.code);
        return {
          response_id: response.id,
          question_id: q.id,
          numeric_value: value?.numeric ?? null,
          text_value: value?.text ?? null,
        };
      });
      await supabase.from("response_answers").insert(answerRows);
    }

    console.log(`  ✓ ${monthNames[month - 1]}/${year}`);
  }

  console.log("\nDone! Demo data created:");
  console.log(`  - ${clientsWithArchetype.length} clients (is_demo = true)`);
  console.log(`  - ${months.length} monthly surveys with invitations & responses`);
  console.log("\nRun `npm run seed:clear` later to remove all demo data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
