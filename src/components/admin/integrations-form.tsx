"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Copy01, Mail01, MessageChatCircle, Bell01, Send01, Play, ShieldTick, Users01, Check } from "@untitledui/icons";
import {
  disconnectSecret,
  runRemindersNow,
  saveIntegrations,
  sendTestEmail,
  sendTestWhatsApp,
  setRemindersEnabled,
} from "@/actions/admin/integrations";
import { useToast } from "@/components/providers/toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Checkbox, Toggle } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { FeaturedIcon } from "@/components/ui/featured-icon";
import { formatDateTime } from "@/lib/utils";

export type IntegrationConfig = {
  site_url: string | null;
  email_from_address: string | null;
  email_from_name: string | null;
  whatsapp_phone_number_id: string | null;
  whatsapp_template_name: string | null;
  whatsapp_template_lang: string | null;
  reminders_enabled: boolean;
  reminder_offsets_min: number[];
  notify_patient_email: boolean;
  notify_patient_whatsapp: boolean;
  notify_staff_email: boolean;
  notify_staff_whatsapp: boolean;
  staff_notify_email: string | null;
  staff_notify_whatsapp: string | null;
  last_run_at: string | null;
};
export type IntegrationStatus = { resend_api_key: boolean; whatsapp_token: boolean; cron_secret: boolean; schedule_active: boolean };

const offsets = [
  { v: 1440, label: "24 hours before" },
  { v: 120, label: "2 hours before" },
  { v: 60, label: "1 hour before" },
  { v: 15, label: "15 minutes before" },
];

function Section({ icon, title, description, status, children }: { icon: React.FC<{ className?: string }>; title: string; description: string; status?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <FeaturedIcon icon={icon} theme="modern" size="lg" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 max-w-xl text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {status}
      </div>
      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">{children}</div>
    </Card>
  );
}

function Connected({ on }: { on: boolean }) {
  return on ? <Badge color="success" dot size="md">Connected</Badge> : <Badge color="gray" dot size="md">Not connected</Badge>;
}

function Guide({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg bg-gray-50 px-4 py-3 ring-1 ring-inset ring-gray-200">
      <summary className="cursor-pointer list-none text-sm font-semibold text-gray-700 [&::-webkit-details-marker]:hidden">
        <span className="mr-1 inline-block transition group-open:rotate-90">›</span> {title}
      </summary>
      <div className="mt-3 text-sm text-gray-600">{children}</div>
    </details>
  );
}

export function IntegrationsForm({ config, status, pageUrl }: { config: IntegrationConfig; status: IntegrationStatus; pageUrl: string }) {
  const router = useRouter();
  const toast = useToast();
  const [c, setC] = useState(config);
  const [resendKey, setResendKey] = useState("");
  const [waToken, setWaToken] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof IntegrationConfig>(k: K, v: IntegrationConfig[K]) => setC((x) => ({ ...x, [k]: v }));

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      toast(res.ok ? { tone: "success", title: res.message ?? "Done" } : { tone: "error", title: res.error ?? "Failed" });
      if (res.ok) after?.();
      router.refresh();
    });

  const save = () =>
    start(async () => {
      setError(null);
      setFieldErrors({});
      const res = await saveIntegrations({
        site_url: c.site_url ?? "",
        email_from_address: c.email_from_address ?? "",
        email_from_name: c.email_from_name ?? "",
        whatsapp_phone_number_id: c.whatsapp_phone_number_id ?? "",
        whatsapp_template_name: c.whatsapp_template_name ?? "",
        whatsapp_template_lang: c.whatsapp_template_lang ?? "",
        reminder_offsets_min: c.reminder_offsets_min,
        notify_patient_email: c.notify_patient_email,
        notify_patient_whatsapp: c.notify_patient_whatsapp,
        notify_staff_email: c.notify_staff_email,
        notify_staff_whatsapp: c.notify_staff_whatsapp,
        staff_notify_email: c.staff_notify_email ?? "",
        staff_notify_whatsapp: c.staff_notify_whatsapp ?? "",
        resend_api_key: resendKey,
        whatsapp_token: waToken,
      });
      if (!res.ok) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      setResendKey("");
      setWaToken("");
      toast({ tone: "success", title: "Integrations saved" });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Owner hand-off */}
      <div className="flex flex-col gap-4 rounded-xl bg-brand-25 p-5 ring-1 ring-inset ring-brand-200 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <FeaturedIcon icon={ShieldTick} size="md" />
          <div className="text-sm">
            <p className="font-semibold text-brand-800">Setting this up for the pharmacy owner?</p>
            <p className="mt-1 max-w-2xl text-brand-800/80">
              The owner connects their <b>own</b> email and WhatsApp accounts here, so messages come from the pharmacy and bills go to them.
              Keys are encrypted in Supabase Vault and are never shown again, to anyone.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-4 text-brand-800/80">
              <li>Ask the owner to create an account on the website.</li>
              <li>Give them <b>Admin</b> access from Team.</li>
              <li>Send them this page’s link. They sign in and fill in the sections below.</li>
            </ol>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/admin/team" className={buttonClasses("secondary", "sm")}>
            <Users01 className="size-4" /> Team
          </Link>
          <Button
            size="sm"
            variant="secondary-color"
            iconLeading={copied ? Check : Copy01}
            onClick={() => {
              void navigator.clipboard?.writeText(pageUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy page link"}
          </Button>
        </div>
      </div>

      {/* Email */}
      <Section icon={Mail01} title="Email (Resend)" description="Sends reminder emails from the pharmacy’s own domain, e.g. reminders@yourpharmacy.ng." status={<Connected on={status.resend_api_key && !!config.email_from_address} />}>
        <Guide title="How to get these (about 10 minutes)">
          <ol className="list-decimal space-y-1 pl-4">
            <li>Create a free account at <a className="font-semibold text-brand-700" href="https://resend.com" target="_blank" rel="noreferrer">resend.com</a>.</li>
            <li>Go to <b>Domains → Add domain</b> and add the pharmacy’s domain. Add the DNS records it shows, then wait for “Verified”.</li>
            <li>Go to <b>API Keys → Create API key</b> with “Sending access” and paste it below.</li>
            <li>Use a sender on that domain, e.g. <code>reminders@yourpharmacy.ng</code>.</li>
          </ol>
        </Guide>
        <Input
          label="Resend API key"
          name="resend_api_key"
          type="password"
          autoComplete="off"
          value={resendKey}
          onChange={(e) => setResendKey(e.target.value)}
          placeholder={status.resend_api_key ? "•••••••••••• saved — type to replace" : "re_…"}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Sender email" name="email_from_address" type="email" value={c.email_from_address ?? ""} onChange={(e) => set("email_from_address", e.target.value)} placeholder="reminders@yourpharmacy.ng" error={fieldErrors.email_from_address} />
          <Input label="Sender name" name="email_from_name" value={c.email_from_name ?? ""} onChange={(e) => set("email_from_name", e.target.value)} placeholder="CareRx Pharmacy" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" iconLeading={Send01} disabled={pending} onClick={() => run(sendTestEmail)}>Send test email to me</Button>
          {status.resend_api_key && <Button variant="destructive-secondary" disabled={pending} onClick={() => run(() => disconnectSecret("resend_api_key"))}>Disconnect</Button>}
        </div>
      </Section>

      {/* WhatsApp */}
      <Section icon={MessageChatCircle} title="WhatsApp (Meta Cloud API)" description="Sends reminder messages from the pharmacy’s WhatsApp Business number using an approved template." status={<Connected on={status.whatsapp_token && !!config.whatsapp_phone_number_id} />}>
        <Guide title="How to get these (needs a Meta Business account)">
          <ol className="list-decimal space-y-1 pl-4">
            <li>At <a className="font-semibold text-brand-700" href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">developers.facebook.com</a>, create a <b>Business</b> app and add the <b>WhatsApp</b> product.</li>
            <li>Add and verify the pharmacy’s phone number. Copy its <b>Phone number ID</b>.</li>
            <li>In Business Settings → System users, create a user and generate a <b>permanent token</b> with <code>whatsapp_business_messaging</code> permission.</li>
            <li>
              In WhatsApp Manager → Message templates, create a <b>Utility</b> template named <code>consultation_reminder</code> with this body, then wait for approval:
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-white p-3 text-xs ring-1 ring-gray-200">Hi {"{{1}}"}, this is a reminder of your consultation with {"{{2}}"} on {"{{3}}"}. Join here: {"{{4}}"}</pre>
            </li>
          </ol>
        </Guide>
        <Input
          label="Permanent access token"
          name="whatsapp_token"
          type="password"
          autoComplete="off"
          value={waToken}
          onChange={(e) => setWaToken(e.target.value)}
          placeholder={status.whatsapp_token ? "•••••••••••• saved — type to replace" : "EAAG…"}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <Input label="Phone number ID" name="whatsapp_phone_number_id" inputMode="numeric" value={c.whatsapp_phone_number_id ?? ""} onChange={(e) => set("whatsapp_phone_number_id", e.target.value)} placeholder="123456789012345" error={fieldErrors.whatsapp_phone_number_id} />
          <Input label="Template name" name="whatsapp_template_name" value={c.whatsapp_template_name ?? ""} onChange={(e) => set("whatsapp_template_name", e.target.value)} />
          <Input label="Template language" name="whatsapp_template_lang" value={c.whatsapp_template_lang ?? ""} onChange={(e) => set("whatsapp_template_lang", e.target.value)} placeholder="en" />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Send a test to" name="test_phone" type="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="0803 123 4567" wrapperClassName="w-56" />
          <Button variant="secondary" iconLeading={Send01} disabled={pending} onClick={() => run(() => sendTestWhatsApp(testPhone))}>Send test</Button>
          {status.whatsapp_token && <Button variant="destructive-secondary" disabled={pending} onClick={() => run(() => disconnectSecret("whatsapp_token"))}>Disconnect</Button>}
        </div>
      </Section>

      {/* Reminders */}
      <Section
        icon={Bell01}
        title="Consultation reminders"
        description="Automatically remind patients and the pharmacy team before each booked consultation."
        status={
          <div className="flex flex-col items-end gap-2">
            <Toggle
              name="reminders_enabled"
              checked={config.reminders_enabled && status.schedule_active}
              disabled={pending}
              onChange={(e) => run(() => setRemindersEnabled(e.target.checked))}
              label={config.reminders_enabled && status.schedule_active ? "On" : "Off"}
            />
            <span className="text-xs text-gray-500">{config.last_run_at ? `Last check ${formatDateTime(config.last_run_at)}` : "Not run yet"}</span>
          </div>
        }
      >
        <Input
          label="Website address"
          name="site_url"
          value={c.site_url ?? ""}
          onChange={(e) => set("site_url", e.target.value)}
          placeholder="https://carerx.ng"
          hint="Used for links in messages and by the scheduler. This must be the live public address."
          error={fieldErrors.site_url}
        />
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">When to send</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {offsets.map((o) => (
              <Checkbox
                key={o.v}
                name={`offset-${o.v}`}
                label={o.label}
                checked={c.reminder_offsets_min.includes(o.v)}
                onChange={(e) => set("reminder_offsets_min", e.target.checked ? [...c.reminder_offsets_min, o.v] : c.reminder_offsets_min.filter((x) => x !== o.v))}
              />
            ))}
          </div>
        </fieldset>
        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium text-gray-700">Patients</legend>
            <Checkbox name="notify_patient_email" label="Email" hint="Sent to the email on their account" checked={c.notify_patient_email} onChange={(e) => set("notify_patient_email", e.target.checked)} />
            <Checkbox name="notify_patient_whatsapp" label="WhatsApp" hint="Sent to the phone on their account" checked={c.notify_patient_whatsapp} onChange={(e) => set("notify_patient_whatsapp", e.target.checked)} />
          </fieldset>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium text-gray-700">Pharmacy team</legend>
            <Checkbox name="notify_staff_email" label="Email" checked={c.notify_staff_email} onChange={(e) => set("notify_staff_email", e.target.checked)} />
            <Checkbox name="notify_staff_whatsapp" label="WhatsApp" checked={c.notify_staff_whatsapp} onChange={(e) => set("notify_staff_whatsapp", e.target.checked)} />
          </fieldset>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Team email" name="staff_notify_email" type="email" value={c.staff_notify_email ?? ""} onChange={(e) => set("staff_notify_email", e.target.value)} placeholder="pharmacists@yourpharmacy.ng" error={fieldErrors.staff_notify_email} />
          <Input label="Team WhatsApp number" name="staff_notify_whatsapp" type="tel" value={c.staff_notify_whatsapp ?? ""} onChange={(e) => set("staff_notify_whatsapp", e.target.value)} placeholder="0803 000 0000" />
        </div>
        <div>
          <Button variant="secondary" iconLeading={Play} disabled={pending || !config.reminders_enabled} onClick={() => run(runRemindersNow)}>
            Run now
          </Button>
          <p className="mt-2 text-xs text-gray-500">Reminders are checked automatically every 5 minutes while switched on. Each reminder is only sent once.</p>
        </div>
      </Section>

      {error && <Alert tone="error" title={error} />}
      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-gray-200 bg-gray-50/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
        <Button size="lg" loading={pending} onClick={save}>Save integrations</Button>
      </div>
    </div>
  );
}
