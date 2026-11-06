import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getStaffNames() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("staff_directory");
  return Object.fromEntries((data ?? []).map((s) => [s.id, s.full_name])) as Record<string, string>;
}

export function chatState(status: string, scheduledAt: string, durationMin: number) {
  const canSend = status === "booked" || status === "in_progress";
  const reason =
    status === "completed"
      ? "This consultation has ended. Book another if you need more help."
      : status === "cancelled"
        ? "This consultation was cancelled."
        : status === "no_show"
          ? "This consultation was missed."
          : undefined;
  return { canSend, reason, endsAt: new Date(new Date(scheduledAt).getTime() + durationMin * 60_000) };
}
