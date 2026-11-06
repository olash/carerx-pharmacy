import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, Th, Td, Tr } from "@/components/ui/table";
import { IntegrationsForm, type IntegrationConfig, type IntegrationStatus } from "@/components/admin/integrations-form";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader title="Integrations" description="Connect the pharmacy’s email and WhatsApp accounts to send consultation reminders. Admins only." />
      <Suspense fallback={<Skeleton className="h-[900px] rounded-xl" />}>
        <Integrations />
      </Suspense>
    </div>
  );
}

const offsetLabel = (m: number) => (m >= 1440 ? `${m / 1440}d` : m >= 60 ? `${m / 60}h` : `${m}m`);

async function Integrations() {
  await requireAdmin();
  const supabase = await createClient();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : "";

  const [{ data: cfg }, { data: status }, { data: log }] = await Promise.all([
    supabase.from("integration_settings").select("*").eq("id", 1).single(),
    supabase.rpc("admin_integration_status"),
    supabase
      .from("consultation_reminders")
      .select("id, channel, audience, recipient, status, error, offset_min, created_at, consultation:consultations(ref)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (!cfg) return <p className="text-sm text-gray-600">Integration settings could not be loaded.</p>;

  const config: IntegrationConfig = { ...cfg, site_url: cfg.site_url ?? (origin && !origin.includes("localhost") ? origin : cfg.site_url) };

  return (
    <>
      <IntegrationsForm config={config} status={status as unknown as IntegrationStatus} pageUrl={`${origin}/admin/integrations`} />
      <Card className="overflow-hidden">
        <CardHeader title="Recent reminders" description="The last 20 reminder messages and whether they were delivered to the provider." />
        {log && log.length ? (
          <Table>
            <THead>
              <tr>
                <Th>When</Th>
                <Th>Consultation</Th>
                <Th>To</Th>
                <Th>Channel</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <tbody>
              {log.map((r) => (
                <Tr key={r.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(r.created_at)}</Td>
                  <Td>{r.consultation?.ref ?? "—"} · {offsetLabel(r.offset_min)} before</Td>
                  <Td className="max-w-[220px] truncate">{r.audience === "patient" ? "Patient" : "Team"} · {r.recipient}</Td>
                  <Td className="capitalize">{r.channel}</Td>
                  <Td>
                    {r.status === "sent" ? <Badge color="success" dot>Sent</Badge> : <Badge color="error" dot>{r.error ? `Failed: ${r.error.slice(0, 40)}` : "Failed"}</Badge>}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-gray-500">No reminders sent yet.</p>
        )}
      </Card>
    </>
  );
}
