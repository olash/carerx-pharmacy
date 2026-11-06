import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowLeft, Mail01, Phone } from "@untitledui/icons";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStaffNames } from "@/lib/data/consultations";
import { ChatRoom } from "@/components/chat/chat-room";
import { ConsultStatusBadge, RequestStatusBadge } from "@/components/status";
import { ConsultNotes, ConsultStatusActions } from "@/components/admin/consult-controls";
import { LiveRefresh } from "@/components/live-refresh";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Consultation" };

export default function AdminConsultPage({ params }: PageProps<"/admin/consultations/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[calc(100dvh-64px)] rounded-xl" />}>
      <Consult params={params} />
    </Suspense>
  );
}

async function Consult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("consultations")
    .select("*, patient:profiles!consultations_patient_id_fkey(id, full_name, phone, email)")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const [{ data: messages }, { data: notes }, { data: requests }, staffNames] = await Promise.all([
    supabase.from("consultation_messages").select("*").eq("consultation_id", id).order("created_at").limit(500),
    supabase.from("consultation_notes").select("notes").eq("consultation_id", id).maybeSingle(),
    supabase.from("drug_requests").select("id, ref, status, created_at").eq("patient_id", c.patient_id).order("created_at", { ascending: false }).limit(5),
    getStaffNames(),
  ]);

  const canSend = c.status === "booked" || c.status === "in_progress";

  return (
    <div className="-mx-4 -my-8 grid h-[calc(100dvh-64px)] md:-mx-8 lg:h-dvh xl:grid-cols-[1fr_340px]">
      <LiveRefresh channel={`admin-consult:${id}`} table="consultations" filter={`id=eq.${id}`} events="UPDATE" />
      <section className="flex min-h-0 flex-col bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin/consultations" className="rounded-lg p-2 text-gray-500 hover:bg-gray-50" aria-label="Back">
              <ArrowLeft className="size-5" />
            </Link>
            <Avatar name={c.patient?.full_name} size="md" />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
                {c.patient?.full_name} <ConsultStatusBadge status={c.status} />
              </p>
              <p className="truncate text-sm text-gray-600">
                {formatDate(c.scheduled_at, { weekday: "short" })} · {formatTime(c.scheduled_at)} · {c.ref}
              </p>
            </div>
          </div>
          <ConsultStatusActions id={c.id} status={c.status} />
        </header>
        <div className="min-h-0 flex-1">
          <ChatRoom
            consultationId={c.id}
            currentUserId={staff.id}
            patientId={c.patient_id}
            patientName={c.patient?.full_name ?? "Patient"}
            staffNames={staffNames}
            initialMessages={messages ?? []}
            canSend={canSend}
            closedReason={c.status === "completed" ? "Consultation ended. Reopen it to send more messages." : "This consultation is closed."}
            viewer="staff"
          />
        </div>
      </section>

      <aside className="hidden min-h-0 flex-col gap-6 overflow-y-auto border-l border-gray-200 bg-gray-50 p-6 xl:flex">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900">Reason for visit</h2>
          <p className="mt-2 text-sm font-medium text-gray-700">{c.topic}</p>
          {c.details && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{c.details}</p>}
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900">Patient</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            {c.patient?.phone && <li className="flex items-center gap-2"><Phone className="size-4 text-gray-400" /><a href={`tel:${c.patient.phone}`} className="hover:underline">{c.patient.phone}</a></li>}
            {c.patient?.email && <li className="flex items-center gap-2"><Mail01 className="size-4 text-gray-400" /><span className="truncate">{c.patient.email}</span></li>}
          </ul>
          {requests && requests.length > 0 && (
            <>
              <h3 className="mt-4 text-xs font-semibold text-gray-500">Recent requests</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {requests.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                      <span className="font-medium text-gray-700">{r.ref}</span>
                      <RequestStatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card className="p-4">
          <ConsultNotes id={c.id} initial={notes?.notes ?? ""} />
        </Card>
      </aside>
    </div>
  );
}
