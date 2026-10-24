import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runSync } from "@/lib/sync";

// Daily Meta Ads + Tiny sync. Scheduled in vercel.json — Vercel Cron sends
// `Authorization: Bearer $CRON_SECRET` automatically. Any other scheduler
// (GitHub Actions, cron-job.org…) just needs to send the same header.
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Leave a margin before maxDuration so the run can be closed as "partial".
  const results = await runSync(createAdminClient(), {
    trigger: "cron",
    deadline: Date.now() + (maxDuration - 40) * 1000,
  });
  const failed = results.some((r) => r.status === "error");
  return NextResponse.json({ results }, { status: failed ? 500 : 200 });
}
