import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { processReminders } from "@/lib/reminders";

/**
 * Called every 5 minutes by Supabase pg_cron (via pg_net) with the shared
 * secret stored in Supabase Vault. Sends due consultation reminders.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret.length < 32) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await processReminders(createPublicClient(), secret);
  if (!result.ok) return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 500 });
  return NextResponse.json(result);
}
