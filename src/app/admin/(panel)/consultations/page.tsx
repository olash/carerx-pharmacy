import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { CalendarCheck01 } from "@untitledui/icons";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TabLinks } from "@/components/ui/tabs";
import { Table, THead, Th, Td, Tr } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { ConsultStatusBadge } from "@/components/status";
import { LiveRefresh } from "@/components/live-refresh";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Consultations" };

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60_000).toISOString();
}

export default function ConsultationsPage({ searchParams }: PageProps<"/admin/consultations">) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Consultations" description="Booked chats with patients. Open one to start the session." />
      <Suspense fallback={<Skeleton className="h-[500px] rounded-xl" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/consultations">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const tab = sp.tab === "past" ? "past" : "upcoming";
  const supabase = await createClient();
  const cutoff = hoursAgo(2);

  let q = supabase
    .from("consultations")
    .select("id, ref, topic, status, scheduled_at, duration_min, pharmacist_id, patient:profiles!consultations_patient_id_fkey(full_name, phone), consultation_messages(count)")
    .limit(100);
  q =
    tab === "upcoming"
      ? q.or(`status.eq.in_progress,and(status.eq.booked,scheduled_at.gte.${cutoff})`).order("scheduled_at")
      : q.or(`status.in.(completed,cancelled,no_show),and(status.eq.booked,scheduled_at.lt.${cutoff})`).order("scheduled_at", { ascending: false });
  const { data } = await q;

  return (
    <Card className="overflow-hidden">
      <LiveRefresh channel="admin-consults" table="consultations" />
      <div className="border-b border-gray-200 p-4">
        <TabLinks
          active={tab}
          tabs={[
            { key: "upcoming", label: "Upcoming & live", href: "/admin/consultations" },
            { key: "past", label: "Past", href: "/admin/consultations?tab=past" },
          ]}
        />
      </div>
      {data && data.length ? (
        <Table>
          <THead>
            <tr>
              <Th>When</Th>
              <Th>Patient</Th>
              <Th>Topic</Th>
              <Th>Messages</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <tbody>
            {data.map((c) => (
              <Tr key={c.id} className="relative hover:bg-gray-25">
                <Td className="whitespace-nowrap">
                  <Link href={`/admin/consultations/${c.id}`} className="font-medium text-gray-900 after:absolute after:inset-0">
                    {formatDate(c.scheduled_at, { weekday: "short", year: undefined })}
                  </Link>
                  <p className="text-gray-500">{formatTime(c.scheduled_at)} · {c.duration_min} min</p>
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.patient?.full_name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900">{c.patient?.full_name}</p>
                      <p className="text-gray-500">{c.patient?.phone}</p>
                    </div>
                  </div>
                </Td>
                <Td className="max-w-xs truncate">{c.topic}</Td>
                <Td>{(c.consultation_messages as unknown as { count: number }[])[0]?.count ?? 0}</Td>
                <Td><ConsultStatusBadge status={c.status} /></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState icon={CalendarCheck01} title={tab === "upcoming" ? "No upcoming consultations" : "No past consultations"} description="Patients book from the “Talk to a pharmacist” page." />
      )}
    </Card>
  );
}
