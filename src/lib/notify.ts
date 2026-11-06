import "server-only";
import { site } from "./config";

export type SendResult = { ok: true } | { ok: false; error: string };

/** Email via Resend (https://resend.com). */
export async function sendEmail(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: opts.from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: body.message ?? `Resend error ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

/** Nigerian-friendly E.164 (digits only, as WhatsApp Cloud API expects). */
export function toWhatsAppNumber(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 11) d = `234${d.slice(1)}`;
  return d;
}

/** WhatsApp template message via Meta WhatsApp Cloud API. */
export async function sendWhatsApp(opts: {
  token: string;
  phoneNumberId: string;
  to: string;
  template: string;
  lang: string;
  params: string[];
}): Promise<SendResult> {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(opts.phoneNumberId)}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toWhatsAppNumber(opts.to),
        type: "template",
        template: {
          name: opts.template,
          language: { code: opts.lang || "en" },
          components: [{ type: "body", parameters: opts.params.map((text) => ({ type: "text", text })) }],
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    return { ok: false, error: body.error?.message ?? `WhatsApp error ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function formatWhen(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-NG", { timeZone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
}

export function humanOffset(min: number) {
  if (min % 1440 === 0) return min === 1440 ? "tomorrow" : `in ${min / 1440} days`;
  if (min % 60 === 0) return min === 60 ? "in 1 hour" : `in ${min / 60} hours`;
  return `in ${min} minutes`;
}

/** Builds the email + WhatsApp template parameters for a reminder. */
export function reminderContent(item: {
  audience: "patient" | "staff";
  patient_name: string | null;
  pharmacist_name: string | null;
  topic: string;
  scheduled_at: string;
  offset_min: number;
  consultation_id: string;
}, siteUrl: string, timeZone: string) {
  const when = formatWhen(item.scheduled_at, timeZone);
  const base = siteUrl.replace(/\/$/, "");
  const link = item.audience === "patient" ? `${base}/account/consultations/${item.consultation_id}` : `${base}/admin/consultations/${item.consultation_id}`;
  const name = item.audience === "patient" ? item.patient_name?.split(" ")[0] || "there" : "team";
  const withWhom = item.audience === "patient" ? item.pharmacist_name ?? `a ${site.shortName} pharmacist` : item.patient_name ?? "a patient";
  const subject =
    item.audience === "patient"
      ? `Reminder: your pharmacist consultation is ${humanOffset(item.offset_min)}`
      : `Upcoming consultation with ${withWhom} — ${when}`;
  const lead =
    item.audience === "patient"
      ? `This is a reminder that your private chat with ${esc(withWhom)} is on <b>${esc(when)}</b>.`
      : `${esc(withWhom)} has a consultation on <b>${esc(when)}</b> about “${esc(item.topic)}”.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f9fafb;font-family:Inter,Arial,sans-serif;color:#101828">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #eaecf0;border-radius:12px;padding:32px">
    <tr><td style="font-size:18px;font-weight:600;color:#0e9384">${esc(site.name)}</td></tr>
    <tr><td style="padding-top:24px;font-size:16px">Hi ${esc(name)},</td></tr>
    <tr><td style="padding-top:12px;font-size:16px;line-height:24px;color:#475467">${lead}</td></tr>
    <tr><td style="padding-top:24px"><a href="${link}" style="display:inline-block;background:#0e9384;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${item.audience === "patient" ? "Open your chat" : "Open consultation"}</a></td></tr>
    <tr><td style="padding-top:24px;font-size:13px;color:#667085">${esc(site.address)} · ${esc(site.phone)}</td></tr>
  </table></td></tr></table></body></html>`;
  const text = `Hi ${name},\n\n${lead.replace(/<[^>]+>/g, "")}\n\nOpen: ${link}\n\n${site.name}`;
  // Template body: "Hi {{1}}, reminder of your consultation with {{2}} on {{3}}. Join here: {{4}}"
  const whatsappParams = [name, withWhom, when, link];
  return { subject, html, text, whatsappParams, link };
}
