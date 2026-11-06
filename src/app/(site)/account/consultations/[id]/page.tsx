import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowLeft, CalendarCheck01, Clock } from "@untitledui/icons";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chatState, getStaffNames } from "@/lib/data/consultations";
import { ChatRoom } from "@/components/chat/chat-room";
import { ConsultStatusBadge } from "@/components/status";
import { CancelConsultButton } from "@/components/consult/cancel-consult-button";
import { LiveRefresh } from "@/components/live-refresh";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Consultation" };

export default function ConsultationPage({ params }: PageProps<"/account/consultations/[id]">) {
  return (
    <div className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-5xl flex-col px-0 md:h-[calc(100dvh-108px)] md:px-8 md:py-6">
      <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
        <Consultation params={params} />
      </Suspense>
    </div>
  );
}

async function Consultation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const profile = await requireProfile(`/account/consultations/${id}`);
  const supabase = await createClient();

  const [{ data: consult }, { data: messages }, staffNames] = await Promise.all([
    supabase.from("consultations").select("*").eq("id", id).eq("patient_id", profile.id).maybeSingle(),
    supabase.from("consultation_messages").select("*").eq("consultation_id", id).order("created_at").limit(500),
    getStaffNames(),
  ]);
  if (!consult) notFound();
  const { canSend, reason } = chatState(consult.status, consult.scheduled_at, consult.duration_min);
  const pharmacist = consult.pharmacist_id ? staffNames[consult.pharmacist_id] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:rounded-xl md:shadow-xs md:ring-1 md:ring-gray-200">
      <LiveRefresh channel={`consult:${id}`} table="consultations" filter={`id=eq.${id}`} events="UPDATE" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/account?tab=consultations" className="rounded-lg p-2 text-gray-500 hover:bg-gray-50" aria-label="Back to consultations">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-gray-900">
              {consult.topic} <ConsultStatusBadge status={consult.status} />
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-gray-600">
              <span className="flex items-center gap-1"><CalendarCheck01 className="size-4" /> {formatDate(consult.scheduled_at, { weekday: "short" })}</span>
              <span className="flex items-center gap-1"><Clock className="size-4" /> {formatTime(consult.scheduled_at)} · {consult.duration_min} min</span>
              {pharmacist && <span>with {pharmacist}</span>}
            </p>
          </div>
        </div>
        {consult.status === "booked" && <CancelConsultButton id={consult.id} />}
      </div>
      <div className="min-h-0 flex-1">
        <ChatRoom
          consultationId={consult.id}
          currentUserId={profile.id}
          patientId={consult.patient_id}
          patientName={profile.full_name ?? "You"}
          staffNames={staffNames}
          initialMessages={messages ?? []}
          canSend={canSend}
          closedReason={reason}
          viewer="patient"
        />
      </div>
    </div>
  );
}
