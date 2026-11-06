/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ChevronRight, File06, Mail01, Phone, Truck01, LinkExternal01 } from "@untitledui/icons";
import { createClient } from "@/lib/supabase/server";
import { getStaffNames } from "@/lib/data/consultations";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestStatusBadge } from "@/components/status";
import { RequestTimeline } from "@/components/requests/request-timeline";
import { RequestReview } from "@/components/admin/request-review";
import { LiveRefresh } from "@/components/live-refresh";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Review request" };

export default function AdminRequestPage({ params }: PageProps<"/admin/requests/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[700px] rounded-xl" />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("drug_requests")
    .select("*, patient:profiles!drug_requests_patient_id_fkey(id, full_name, phone, email, created_at), items:drug_request_items(*), events:request_events(*)")
    .eq("id", id)
    .order("created_at", { referencedTable: "drug_request_items" })
    .order("created_at", { referencedTable: "request_events" })
    .maybeSingle();
  if (!r) notFound();

  const drugIds = r.items.map((i) => i.drug_id).filter((x): x is string => !!x);
  const [{ data: stockRows }, staffNames, { count: pastCount }, rx] = await Promise.all([
    drugIds.length
      ? supabase.from("drugs").select("id, stock_qty, low_stock_threshold, price").in("id", drugIds)
      : Promise.resolve({ data: [] as { id: string; stock_qty: number; low_stock_threshold: number; price: number }[] }),
    getStaffNames(),
    supabase.from("drug_requests").select("id", { count: "exact", head: true }).eq("patient_id", r.patient_id).neq("id", r.id),
    r.prescription_path ? supabase.storage.from("prescriptions").createSignedUrl(r.prescription_path, 60 * 30) : Promise.resolve(null),
  ]);
  const stock = Object.fromEntries((stockRows ?? []).map((s) => [s.id, { stock_qty: s.stock_qty, low_stock_threshold: s.low_stock_threshold, price: Number(s.price) }]));
  const rxUrl = rx && "data" in rx ? rx.data?.signedUrl : null;
  const isPdf = r.prescription_path?.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex flex-col gap-6">
      <LiveRefresh channel={`admin-req:${id}`} table="drug_requests" filter={`id=eq.${id}`} events="UPDATE" />
      <PageHeader
        breadcrumbs={
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Link href="/admin/requests" className="hover:text-gray-900">Drug requests</Link>
            <ChevronRight className="size-4 text-gray-300" />
            <span className="text-brand-700">{r.ref}</span>
          </nav>
        }
        title={<span className="flex flex-wrap items-center gap-3">{r.ref} <RequestStatusBadge status={r.status} /></span>}
        description={`Received ${formatDateTime(r.created_at)}${r.reviewed_by && staffNames[r.reviewed_by] ? ` · handled by ${staffNames[r.reviewed_by]}` : ""}`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <RequestReview key={r.updated_at} request={r} items={r.items} stock={stock} />

          {r.prescription_path && (
            <Card>
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-5 sm:px-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><File06 className="size-5 text-purple-700" /> Prescription</h2>
                {rxUrl && (
                  <a href={rxUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                    Open full size <LinkExternal01 className="size-4" />
                  </a>
                )}
              </div>
              <div className="p-4 sm:p-6">
                {rxUrl ? (
                  isPdf ? (
                    <iframe src={rxUrl} title="Prescription PDF" className="h-[560px] w-full rounded-lg ring-1 ring-gray-200" />
                  ) : (
                    <img src={rxUrl} alt="Uploaded prescription" className="max-h-[640px] w-full rounded-lg bg-gray-50 object-contain ring-1 ring-gray-200" />
                  )
                ) : (
                  <p className="text-sm text-gray-500">Couldn’t load the prescription file.</p>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900">Patient</h2>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={r.patient?.full_name} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{r.patient?.full_name ?? "Unknown"}</p>
                <p className="text-sm text-gray-600">{pastCount ? `${pastCount} previous requests` : "First request"}</p>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-2 text-gray-600"><Phone className="size-4 text-gray-400" /><a className="font-medium text-brand-700 hover:underline" href={`tel:${r.contact_phone}`}>{r.contact_phone}</a></li>
              {r.patient?.email && <li className="flex items-center gap-2 text-gray-600"><Mail01 className="size-4 text-gray-400" /><a className="truncate hover:underline" href={`mailto:${r.patient.email}`}>{r.patient.email}</a></li>}
            </ul>
            <a
              href={`https://wa.me/${r.contact_phone.replace(/\D/g, "").replace(/^0/, "234")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-success-700 hover:underline"
            >
              Message on WhatsApp →
            </a>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900">Deliver to</h2>
            <div className="mt-3 flex gap-2 text-sm text-gray-600">
              <Truck01 className="size-5 shrink-0 text-gray-400" />
              <p className="whitespace-pre-wrap">{r.delivery_address ?? "No address — call the patient."}</p>
            </div>
            {r.patient_note && (
              <div className="mt-4 rounded-lg bg-warning-25 p-3 text-sm ring-1 ring-inset ring-warning-200">
                <p className="font-semibold text-warning-700">Patient note</p>
                <p className="mt-1 whitespace-pre-wrap text-gray-700">{r.patient_note}</p>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Activity</h2>
            <RequestTimeline events={r.events} names={{ ...staffNames, ...(r.patient ? { [r.patient.id]: r.patient.full_name ?? "Patient" } : {}) }} />
          </Card>
        </div>
      </div>
    </div>
  );
}
