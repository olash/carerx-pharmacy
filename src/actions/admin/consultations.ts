"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ConsultStatus } from "@/lib/types";

const allowed: Record<ConsultStatus, ConsultStatus[]> = {
  booked: ["in_progress", "cancelled", "no_show", "completed"],
  in_progress: ["completed", "booked"],
  completed: ["in_progress"],
  cancelled: [],
  no_show: ["booked"],
};

export async function setConsultStatus(id: string, next: ConsultStatus): Promise<ActionResult> {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: c } = await supabase.from("consultations").select("status, pharmacist_id").eq("id", id).single();
  if (!c) return { ok: false, error: "Consultation not found." };
  if (!allowed[c.status].includes(next)) return { ok: false, error: `Can’t change a ${c.status} consultation to ${next}.` };
  const { error } = await supabase
    .from("consultations")
    .update({ status: next, pharmacist_id: c.pharmacist_id ?? staff.id })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/consultations/${id}`);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Consultation updated." };
}

export async function saveConsultNotes(id: string, notes: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultation_notes")
    .upsert({ consultation_id: id, notes: notes.slice(0, 10000), updated_by: staff.id, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Notes saved." };
}

export async function markConsultRead(id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultation_staff_reads")
    .upsert({ consultation_id: id, last_read_at: new Date().toISOString(), read_by: staff.id });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
