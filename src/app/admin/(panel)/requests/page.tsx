import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { File06, SearchLg, Inbox01 } from "@untitledui/icons";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TabLinks } from "@/components/ui/tabs";
import { Table, THead, Th, Td, Tr } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { RequestStatusBadge } from "@/components/status";
import { LiveRefresh } from "@/components/live-refresh";
import { buttonClasses } from "@/components/ui/button";
import { escapeLike, formatDateTime } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Drug requests" };

const groups: Record<string, { label: string; statuses: RequestStatus[] }> = {
  review: { label: "Needs review", statuses: ["submitted", "reviewing"] },
  awaiting: { label: "Awaiting patient", statuses: ["quoted"] },
  fulfil: { label: "To fulfil", statuses: ["confirmed", "ready", "out_for_delivery"] },
  closed: { label: "Closed", statuses: ["completed", "cancelled", "rejected"] },
  all: { label: "All", statuses: [] },
};

export default function RequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Drug requests" description="Review prescriptions, send quotes and fulfil orders." />
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <RequestsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RequestsTable({ searchParams }: { searchParams: PageProps<"/admin/requests">["searchParams"] }) {
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" && sp.tab in groups ? sp.tab : "review";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const supabase = await createClient();

  let query = supabase
    .from("drug_requests")
    .select(
      "id, ref, status, delivery_address, created_at, updated_at, prescription_path, patient:profiles!drug_requests_patient_id_fkey!inner(full_name, phone, email), drug_request_items(count)",
    )
    .order("created_at", { ascending: tab === "review" })
    .limit(100);
  if (groups[tab]!.statuses.length) query = query.in("status", groups[tab]!.statuses);
  if (q) {
    const t = escapeLike(q);
    if (/^rq-?\d+$/i.test(q)) query = query.ilike("ref", `%${t.replace(/^rq-?/i, "")}%`);
    else query = query.or(`full_name.ilike.%${t}%,phone.ilike.%${t}%,email.ilike.%${t}%`, { referencedTable: "profiles" });
  }

  const [{ data }, { data: statusRows }] = await Promise.all([query, supabase.from("drug_requests").select("status")]);
  const countFor = (k: string) => (k === "all" ? statusRows?.length ?? 0 : (statusRows ?? []).filter((r) => groups[k]!.statuses.includes(r.status)).length);

  return (
    <Card className="overflow-hidden">
      <LiveRefresh channel="admin-requests" table="drug_requests" />
      <div className="flex flex-col gap-4 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <TabLinks
          active={tab}
          tabs={Object.entries(groups).map(([key, g]) => ({ key, label: g.label, count: countFor(key), href: `/admin/requests?tab=${key}` }))}
        />
        <form action="/admin/requests" className="flex gap-3">
          <input type="hidden" name="tab" value={tab} />
          <label className="relative flex-1">
            <SearchLg className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Patient, phone or RQ-number"
              aria-label="Search requests"
              className="h-10 w-full rounded-lg bg-white pl-10 pr-3 text-sm shadow-xs ring-1 ring-inset ring-gray-300 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-brand-600 lg:w-72"
            />
          </label>
          <button className={buttonClasses("secondary")} type="submit">Search</button>
        </form>
      </div>
      {data && data.length ? (
        <Table>
          <THead>
            <tr>
              <Th>Request</Th>
              <Th>Patient</Th>
              <Th>Deliver to</Th>
              <Th>Status</Th>
              <Th>Received</Th>
            </tr>
          </THead>
          <tbody>
            {data.map((r) => {
              const count = (r.drug_request_items as unknown as { count: number }[])[0]?.count ?? 0;
              return (
                <Tr key={r.id} className="relative hover:bg-gray-25">
                  <Td>
                    <Link href={`/admin/requests/${r.id}`} className="font-medium text-gray-900 after:absolute after:inset-0 hover:underline">
                      {r.ref}
                    </Link>
                    <p className="flex items-center gap-1.5 text-gray-500">
                      {count} {count === 1 ? "item" : "items"}
                      {r.prescription_path && <Badge color="purple">Rx</Badge>}
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
                  <Td className="max-w-[220px] truncate">{r.delivery_address ?? "—"}</Td>
                  <Td><RequestStatusBadge status={r.status} /></Td>
                  <Td className="whitespace-nowrap">{formatDateTime(r.created_at)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <EmptyState
          icon={q ? SearchLg : tab === "review" ? Inbox01 : File06}
          title={q ? "No matching requests" : tab === "review" ? "All caught up!" : "Nothing here"}
          description={q ? "Try a different name, phone number or reference." : tab === "review" ? "New requests appear here instantly." : "No requests in this view yet."}
        />
      )}
    </Card>
  );
}
