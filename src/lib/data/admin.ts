import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  needs_review: number;
  awaiting_patient: number;
  to_fulfil: number;
  completed_7d: number;
  consults_today: number;
  consults_upcoming: number;
  low_stock: number;
  out_of_stock: number;
  active_products: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  return data as unknown as DashboardStats;
}

export async function getFeatureSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pharmacy_settings")
    .select("presence_enabled, unread_badges_enabled, alert_sound_enabled")
    .eq("id", 1)
    .single();
  return {
    presence: data?.presence_enabled ?? true,
    unreadBadges: data?.unread_badges_enabled ?? true,
    alertSound: data?.alert_sound_enabled ?? true,
  };
}

/** consultation_id → unread patient messages (staff view). */
export async function getUnreadCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_unread_counts");
  return Object.fromEntries((data ?? []).map((r) => [r.consultation_id, r.unread]));
}
