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
