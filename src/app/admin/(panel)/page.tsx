import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AlertTriangle, CalendarCheck01, CheckCircle, File06, Package, Plus, Clock } from "@untitledui/icons";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/data/admin";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, Th, Td, Tr } from "@/components/ui/table";
import { ConsultStatusBadge, RequestStatusBadge, StockBadge } from "@/components/status";
import { Avatar } from "@/components/ui/avatar";
import { LiveRefresh } from "@/components/live-refresh";
import { formatDateTime, formatTime } from "@/lib/utils";
import { site } from "@/lib/config";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<Skeleton className="h-16 w-80" />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>}>
        <Metrics />
      </Suspense>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
          <RecentRequests />
        </Suspense>
        <div className="flex flex-col gap-6">
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <TodayConsultations />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <LowStock />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function Greeting() {
  await connection();
  const profile = await requireStaff();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: site.timezone }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <PageHeader
      title={`${greeting}, ${profile.full_name?.split(" ")[0] ?? "there"}`}
      description="Here’s what needs your attention at the pharmacy today."
      actions={
        <>
          <ButtonLink href="/admin/requests" variant="secondary" iconLeading={File06}>Review requests</ButtonLink>
          <ButtonLink href="/admin/inventory/new" iconLeading={Plus}>Add medicine</ButtonLink>
        </>
      }
    />
  );
}

async function Metrics() {
  const s = await getDashboardStats();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <LiveRefresh channel="admin-dash-req" table="drug_requests" />
      <MetricCard label="Requests to review" value={s.needs_review} icon={File06} tone={s.needs_review ? "brand" : "gray"} href="/admin/requests" hint={`${s.awaiting_patient} awaiting patient confirmation`} />
      <MetricCard label="Orders to fulfil" value={s.to_fulfil} icon={Package} href="/admin/requests?tab=fulfil" hint={`${s.completed_7d} completed in the last 7 days`} />
      <MetricCard label="Consultations today" value={s.consults_today} icon={CalendarCheck01} href="/admin/consultations" hint={`${s.consults_upcoming} upcoming in total`} />
      <MetricCard
        label="Stock alerts"
        value={s.low_stock + s.out_of_stock}
        icon={AlertTriangle}
        tone={s.out_of_stock ? "error" : s.low_stock ? "warning" : "gray"}
        href="/admin/inventory?stock=attention"
        hint={`${s.out_of_stock} out of stock · ${s.low_stock} running low`}
      />
    </div>
  );
}

async function RecentRequests() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("drug_requests")
    .select("id, ref, status, fulfilment, created_at, prescription_path, patient:profiles!drug_requests_patient_id_fkey(full_name, phone), drug_request_items(count)")
    .order("created_at", { ascending: false })
    .limit(8);
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Latest requests" description="Newest drug requests from patients." actions={<ButtonLink href="/admin/requests" variant="secondary" size="sm">View all</ButtonLink>} />
      {data && data.length ? (
        <Table>
          <THead>
            <tr>
              <Th>Request</Th>
              <Th>Patient</Th>
              <Th>Status</Th>
              <Th>Received</Th>
            </tr>
          </THead>
          <tbody>
            {data.map((r) => {
              const count = (r.drug_request_items as unknown as { count: number }[])[0]?.count ?? 0;
              return (
                <Tr key={r.id} className="hover:bg-gray-25">
                  <Td>
                    <Link href={`/admin/requests/${r.id}`} className="font-medium text-gray-900 hover:underline">{r.ref}</Link>
                    <p className="text-gray-500">
                      {count} items · {r.fulfilment}
                      {r.prescription_path ? " · Rx attached" : ""}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.patient?.full_name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{r.patient?.full_name ?? "—"}</p>
                        <p className="text-gray-500">{r.patient?.phone}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><RequestStatusBadge status={r.status} /></Td>
                  <Td className="whitespace-nowrap">{formatDateTime(r.created_at)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <EmptyState icon={CheckCircle} title="No requests yet" description="New drug requests will show up here in real time." />
      )}
    </Card>
  );
}

async function TodayConsultations() {
  await connection();
  const supabase = await createClient();
  const now = new Date();
  const { data } = await supabase
    .from("consultations")
    .select("id, ref, topic, status, scheduled_at, patient:profiles!consultations_patient_id_fkey(full_name)")
    .in("status", ["booked", "in_progress"])
    .gte("scheduled_at", new Date(now.getTime() - 60 * 60_000).toISOString())
    .order("scheduled_at")
    .limit(5);
  return (
    <Card>
      <CardHeader title="Next consultations" actions={<ButtonLink href="/admin/consultations" variant="link-color" size="sm">View all</ButtonLink>} />
      {data && data.length ? (
        <ul className="divide-y divide-gray-200">
          {data.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/consultations/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-25 sm:px-6">
                <Avatar name={c.patient?.full_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{c.patient?.full_name}</p>
                  <p className="truncate text-sm text-gray-500">{c.topic}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700"><Clock className="size-4 text-gray-400" />{formatTime(c.scheduled_at)}</span>
                  <ConsultStatusBadge status={c.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-6 py-8 text-center text-sm text-gray-500">No upcoming consultations.</p>
      )}
    </Card>
  );
}

async function LowStock() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_view")
    .select("id, name, strength, stock_qty, low_stock_threshold, stock_status")
    .eq("is_active", true)
    .neq("stock_status", "in_stock")
    .order("stock_qty")
    .limit(6);
  return (
    <Card>
      <CardHeader title="Stock alerts" actions={<ButtonLink href="/admin/inventory?stock=attention" variant="link-color" size="sm">Restock</ButtonLink>} />
      {data && data.length ? (
        <ul className="divide-y divide-gray-200">
          {data.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/inventory/${d.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-25 sm:px-6">
                <p className="truncate text-sm font-medium text-gray-900">{d.name}</p>
                <StockBadge qty={d.stock_qty ?? 0} threshold={d.low_stock_threshold ?? 0} showQty />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-6 py-8 text-center text-sm text-gray-500">All products are well stocked. 🎉</p>
      )}
    </Card>
  );
}
