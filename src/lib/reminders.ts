import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { reminderContent, sendEmail, sendWhatsApp, type SendResult } from "./notify";

type Item = {
  consultation_id: string;
  ref: string;
  topic: string;
  scheduled_at: string;
  duration_min: number;
  offset_min: number;
  patient_name: string | null;
  pharmacist_name: string | null;
  channel: "email" | "whatsapp";
  audience: "patient" | "staff";
  recipient: string;
};

type Due = {
  enabled: boolean;
  timezone?: string;
  site_url?: string | null;
  email?: { api_key: string | null; from_address: string | null; from_name: string | null };
  whatsapp?: { token: string | null; phone_number_id: string | null; template_name: string | null; template_lang: string | null };
  items?: Item[];
};

/** Fetch due reminders (authenticated by the cron secret), send them, record results. */
export async function processReminders(supabase: SupabaseClient<Database>, secret: string) {
  const { data, error } = await supabase.rpc("reminders_due", { p_secret: secret });
  if (error) return { ok: false as const, error: error.message.includes("FORBIDDEN") ? "Unauthorized" : error.message };
  const due = data as unknown as Due;
  if (!due.enabled) return { ok: true as const, sent: 0, failed: 0, skipped: "Reminders are turned off" };
  if (!due.site_url) return { ok: false as const, error: "Site URL is not set" };

  const results: (Item & { status: "sent" | "failed"; error: string | null })[] = [];
  for (const item of due.items ?? []) {
    const c = reminderContent(item, due.site_url, due.timezone ?? "Africa/Lagos");
    let r: SendResult;
    if (item.channel === "email") {
      r =
        due.email?.api_key && due.email.from_address
          ? await sendEmail({
              apiKey: due.email.api_key,
              from: due.email.from_name ? `${due.email.from_name} <${due.email.from_address}>` : due.email.from_address,
              to: item.recipient,
              subject: c.subject,
              html: c.html,
              text: c.text,
            })
          : { ok: false, error: "Email is not connected" };
    } else {
      r =
        due.whatsapp?.token && due.whatsapp.phone_number_id && due.whatsapp.template_name
          ? await sendWhatsApp({
              token: due.whatsapp.token,
              phoneNumberId: due.whatsapp.phone_number_id,
              to: item.recipient,
              template: due.whatsapp.template_name,
              lang: due.whatsapp.template_lang ?? "en",
              params: c.whatsappParams,
            })
          : { ok: false, error: "WhatsApp is not connected" };
    }
    results.push({ ...item, status: r.ok ? "sent" : "failed", error: r.ok ? null : r.error });
  }

  if (results.length) {
    await supabase.rpc("reminders_record", {
      p_secret: secret,
      p_results: results.map(({ consultation_id, offset_min, channel, audience, recipient, status, error }) => ({
        consultation_id, offset_min, channel, audience, recipient, status, error,
      })),
    });
  }
  return {
    ok: true as const,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
  };
}
