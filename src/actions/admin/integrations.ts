"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reminderContent, sendEmail, sendWhatsApp } from "@/lib/notify";
import { processReminders } from "@/lib/reminders";
import { site } from "@/lib/config";
import type { ActionResult } from "@/lib/types";

const opt = (max: number) => z.string().trim().max(max).transform((v) => (v === "" ? null : v));

const schema = z.object({
  site_url: opt(300).refine((v) => v === null || /^https?:\/\/[^\s/]+/.test(v), "Enter a full URL, e.g. https://carerx.ng"),
  email_from_address: opt(200).refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid sender email"),
  email_from_name: opt(100),
  whatsapp_phone_number_id: opt(40).refine((v) => v === null || /^\d{6,30}$/.test(v), "Phone number ID is digits only"),
  whatsapp_template_name: opt(100),
  whatsapp_template_lang: opt(10),
  reminder_offsets_min: z.array(z.number().int().min(5).max(10080)).max(5),
  notify_patient_email: z.boolean(),
  notify_patient_whatsapp: z.boolean(),
  notify_staff_email: z.boolean(),
  notify_staff_whatsapp: z.boolean(),
  staff_notify_email: opt(200).refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid team email"),
  staff_notify_whatsapp: opt(30),
  resend_api_key: z.string().trim().max(200).optional().default(""),
  whatsapp_token: z.string().trim().max(1000).optional().default(""),
});

export async function saveIntegrations(input: z.input<typeof schema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const { resend_api_key, whatsapp_token, ...config } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_settings")
    .update({ ...config, reminder_offsets_min: [...new Set(config.reminder_offsets_min)].sort((a, b) => b - a), updated_by: admin.id })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };

  // Only overwrite secrets when a new value was typed.
  for (const [key, value] of [["resend_api_key", resend_api_key], ["whatsapp_token", whatsapp_token]] as const) {
    if (value) {
      const { error: e } = await supabase.rpc("admin_set_integration_secret", { p_key: key, p_value: value });
      if (e) return { ok: false, error: e.message };
    }
  }
  revalidatePath("/admin/integrations");
  return { ok: true, message: "Integrations saved." };
}

export async function disconnectSecret(key: "resend_api_key" | "whatsapp_token"): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_integration_secret", { p_key: key, p_value: "" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/integrations");
  return { ok: true, message: key === "resend_api_key" ? "Email disconnected." : "WhatsApp disconnected." };
}

async function loadConfig() {
  const supabase = await createClient();
  const [{ data: cfg }, { data: secrets }, { data: settings }] = await Promise.all([
    supabase.from("integration_settings").select("*").eq("id", 1).single(),
    supabase.rpc("admin_get_integration_secrets"),
    supabase.from("pharmacy_settings").select("timezone").eq("id", 1).single(),
  ]);
  return {
    supabase,
    cfg,
    secrets: (secrets ?? {}) as { resend_api_key?: string | null; whatsapp_token?: string | null; cron_secret?: string | null },
    tz: settings?.timezone ?? site.timezone,
  };
}

const sample = (audience: "patient" | "staff") => ({
  audience,
  patient_name: "Test Patient",
  pharmacist_name: null,
  topic: "Test reminder",
  scheduled_at: new Date(Date.now() + 60 * 60_000).toISOString(),
  offset_min: 60,
  consultation_id: "00000000-0000-0000-0000-000000000000",
});

export async function sendTestEmail(): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { cfg, secrets, tz } = await loadConfig();
  if (!secrets.resend_api_key || !cfg?.email_from_address) return { ok: false, error: "Add your Resend API key and sender email, then save first." };
  if (!admin.email) return { ok: false, error: "Your account has no email address." };
  const c = reminderContent(sample("patient"), cfg.site_url ?? "https://example.com", tz);
  const res = await sendEmail({
    apiKey: secrets.resend_api_key,
    from: cfg.email_from_name ? `${cfg.email_from_name} <${cfg.email_from_address}>` : cfg.email_from_address,
    to: admin.email,
    subject: `[Test] ${c.subject}`,
    html: c.html,
    text: c.text,
  });
  return res.ok ? { ok: true, message: `Test email sent to ${admin.email}.` } : { ok: false, error: res.error };
}

export async function sendTestWhatsApp(phone: string): Promise<ActionResult> {
  await requireAdmin();
  if (phone.replace(/\D/g, "").length < 10) return { ok: false, error: "Enter the phone number to send the test to." };
  const { cfg, secrets, tz } = await loadConfig();
  if (!secrets.whatsapp_token || !cfg?.whatsapp_phone_number_id || !cfg.whatsapp_template_name) {
    return { ok: false, error: "Add your WhatsApp access token, phone number ID and template name, then save first." };
  }
  const c = reminderContent(sample("patient"), cfg.site_url ?? "https://example.com", tz);
  const res = await sendWhatsApp({
    token: secrets.whatsapp_token,
    phoneNumberId: cfg.whatsapp_phone_number_id,
    to: phone,
    template: cfg.whatsapp_template_name,
    lang: cfg.whatsapp_template_lang ?? "en",
    params: c.whatsappParams,
  });
  return res.ok ? { ok: true, message: `Test WhatsApp sent to ${phone}.` } : { ok: false, error: res.error };
}

export async function setRemindersEnabled(enabled: boolean): Promise<ActionResult> {
  await requireAdmin();
  const { supabase, cfg, secrets } = await loadConfig();
  if (enabled) {
    if (!cfg?.site_url) return { ok: false, error: "Set the website address first so the scheduler knows where to send." };
    const emailReady = !!secrets.resend_api_key && !!cfg.email_from_address;
    const waReady = !!secrets.whatsapp_token && !!cfg.whatsapp_phone_number_id;
    if (!emailReady && !waReady) return { ok: false, error: "Connect email or WhatsApp before turning reminders on." };
  }
  const { error } = await supabase.rpc("admin_set_reminder_schedule", { p_enabled: enabled });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/integrations");
  return { ok: true, message: enabled ? "Reminders are on. We check every 5 minutes." : "Reminders are off." };
}

export async function runRemindersNow(): Promise<ActionResult> {
  await requireAdmin();
  const { supabase, secrets } = await loadConfig();
  if (!secrets.cron_secret) return { ok: false, error: "Turn reminders on first." };
  const res = await processReminders(supabase, secrets.cron_secret);
  revalidatePath("/admin/integrations");
  if (!res.ok) return { ok: false, error: res.error };
  if ("skipped" in res && res.skipped) return { ok: true, message: res.skipped };
  return { ok: true, message: res.sent || res.failed ? `Sent ${res.sent}, failed ${res.failed}.` : "Nothing due right now." };
}
