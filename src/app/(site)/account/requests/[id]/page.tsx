import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowLeft, Building07, File06, MessageChatCircle, Phone, Truck01 } from "@untitledui/icons";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requestTotals } from "@/lib/requests";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestStatusBadge, requestStatusMeta } from "@/components/status";
import { RequestProgress } from "@/components/requests/request-progress";
import { RequestTimeline } from "@/components/requests/request-timeline";
import { PatientRequestActions } from "@/components/requests/patient-request-actions";
import { LiveRefresh } from "@/components/live-refresh";
import { formatDateTime, formatNaira } from "@/lib/utils";
import { site } from "@/lib/config";

export const metadata: Metadata = { title: "Request" };

export default function RequestDetailPage({ params, searchParams }: PageProps<"/account/requests/[id]">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
        <ArrowLeft className="size-4" /> All requests
      </Link>
      <Suspense fallback={<Skeleton className="mt-6 h-[600px] w-full rounded-xl" />}>
        <RequestDetail params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RequestDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: PageProps<"/account/requests/[id]">["searchParams"];
}) {
  const { id } = await params;
  const sp = await searchParams;
  const profile = await requireProfile(`/account/requests/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("drug_requests")
    .select("*, items:drug_request_items(*), events:request_events(*)")
    .eq("id", id)
    .eq("patient_id", profile.id)
    .order("created_at", { referencedTable: "drug_request_items" })
    .order("created_at", { referencedTable: "request_events" })
    .maybeSingle();
  if (!request) notFound();

  const totals = requestTotals(request, request.items);
  const showPrices = ["quoted", "confirmed", "ready", "out_for_delivery", "completed"].includes(request.status);
  const meta = requestStatusMeta[request.status];

  let prescriptionUrl: string | null = null;
  if (request.prescription_path) {
    const { data } = await supabase.storage.from("prescriptions").createSignedUrl(request.prescription_path, 600);
    prescriptionUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <LiveRefresh channel={`req:${id}`} table="drug_requests" filter={`id=eq.${id}`} events="UPDATE" />
      {sp.new === "1" && (
        <Alert tone="success" title="Request sent!" className="mt-6">
          A pharmacist will review it shortly — this page updates automatically. We may call you on {request.contact_phone}.
        </Alert>
      )}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-xs font-semibold text-gray-900">{request.ref}</h1>
            <RequestStatusBadge status={request.status} />
          </div>
          <p className="mt-1 text-base text-gray-600">Sent {formatDateTime(request.created_at)}</p>
        </div>
        <ButtonLink href="/consult" variant="secondary" iconLeading={MessageChatCircle}>
          Ask a pharmacist
        </ButtonLink>
      </div>

      <Card className="mt-6 p-4 sm:p-6">
        <RequestProgress status={request.status} fulfilment={request.fulfilment} />
        <p className="mt-6 text-base text-gray-700">{meta.patientHint}</p>
        {request.pharmacist_note && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-gray-700">Note from your pharmacist</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{request.pharmacist_note}</p>
          </div>
        )}
        {(request.status === "quoted" || request.status === "submitted" || request.status === "reviewing") && (
          <div className="mt-6">
            <PatientRequestActions id={request.id} status={request.status} total={totals.total} />
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {request.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    Qty {item.quantity}
                    {showPrices && item.unit_price !== null && ` · ${formatNaira(item.unit_price)} each`}
                  </p>
                  {item.pharmacist_note && <p className="mt-1 text-sm text-gray-600">↳ {item.pharmacist_note}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.is_available === false ? (
                    <Badge color="error">Unavailable</Badge>
                  ) : showPrices && item.unit_price !== null ? (
                    <p className="text-sm font-semibold text-gray-900">{formatNaira(Number(item.unit_price) * item.quantity)}</p>
                  ) : (
                    <Badge color="gray">Awaiting quote</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {showPrices && (
            <dl className="flex flex-col gap-2 border-t border-gray-200 px-4 py-4 text-sm sm:px-6">
              <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd className="font-medium text-gray-900">{formatNaira(totals.subtotal)}</dd></div>
              {request.fulfilment === "delivery" && (
                <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd className="font-medium text-gray-900">{formatNaira(totals.delivery)}</dd></div>
              )}
              <div className="flex justify-between pt-2 text-base"><dt className="font-semibold text-gray-900">Total · pay on {request.fulfilment}</dt><dd className="font-semibold text-gray-900">{formatNaira(totals.total)}</dd></div>
            </dl>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900">{request.fulfilment === "delivery" ? "Delivery" : "Pickup"}</h2>
            <div className="mt-3 flex gap-3 text-sm text-gray-600">
              {request.fulfilment === "delivery" ? <Truck01 className="size-5 shrink-0 text-gray-400" /> : <Building07 className="size-5 shrink-0 text-gray-400" />}
              <p className="whitespace-pre-wrap">{request.fulfilment === "delivery" ? request.delivery_address : site.address}</p>
            </div>
            <div className="mt-3 flex gap-3 text-sm text-gray-600">
              <Phone className="size-5 shrink-0 text-gray-400" /> {request.contact_phone}
            </div>
            {request.patient_note && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">“{request.patient_note}”</p>}
            {prescriptionUrl && (
              <a href={prescriptionUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
                <File06 className="size-5" /> View uploaded prescription
              </a>
            )}
          </Card>
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Activity</h2>
            <RequestTimeline events={request.events} />
          </Card>
        </div>
      </div>
    </>
  );
}
