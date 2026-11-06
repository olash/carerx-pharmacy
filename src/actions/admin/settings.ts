"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, AppRole } from "@/lib/types";

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
const settingsSchema = z.object({
  slot_minutes: z.coerce.number().int().min(10).max(120),
  booking_window_days: z.coerce.number().int().min(1).max(60),
  delivery_fee: z.coerce.number().min(0).max(1_000_000),
  presence_enabled: z.boolean(),
  unread_badges_enabled: z.boolean(),
  alert_sound_enabled: z.boolean(),
  hours: z
    .array(z.object({ weekday: z.number().int().min(0).max(6), is_open: z.boolean(), start_time: time, end_time: time }))
    .length(7),
});

export async function saveSettings(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  await requireStaff();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  const bad = parsed.data.hours.find((h) => h.is_open && h.end_time <= h.start_time);
  if (bad) return { ok: false, error: "Closing time must be after opening time." };

  const supabase = await createClient();
  const { hours, ...settings } = parsed.data;
  const { error } = await supabase.from("pharmacy_settings").update(settings).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  for (const h of hours) {
    const { error: e } = await supabase
      .from("consultation_hours")
      .update({ is_open: h.is_open, start_time: h.start_time, end_time: h.end_time })
      .eq("weekday", h.weekday);
    if (e) return { ok: false, error: e.message };
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/consult");
  revalidatePath("/account", "layout");
  return { ok: true, message: "Settings saved." };
}

export async function setRole(email: string, role: AppRole): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("id, role").ilike("email", email.trim()).maybeSingle();
  if (!target) return { ok: false, error: "No account with that email. Ask them to sign up on the website first." };
  if (target.id === admin.id) return { ok: false, error: "You can’t change your own role." };
  const { error } = await supabase.from("profiles").update({ role }).eq("id", target.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/team");
  return { ok: true, message: role === "patient" ? "Staff access removed." : `Access granted as ${role}.` };
}
