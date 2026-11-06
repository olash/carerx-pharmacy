import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { CalendarCheck01, ChevronRight, File06, MessageChatCircle, Plus } from "@untitledui/icons";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TabLinks } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultStatusBadge, RequestStatusBadge } from "@/components/status";
import { LiveRefresh } from "@/components/live-refresh";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <Suspense fallback={<AccountSkeleton />}>
        <Account searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Account({ searchParams }: { searchParams: PageProps<"/account">["searchParams"] }) {
  const profile = await requireProfile("/account");
  const sp = await searchParams;
  const tab = sp.tab === "consultations" ? "consultations" : "requests";
  const supabase = await createClient();

  const [{ data: requests }, { data: consults }] = await Promise.all([
    supabase
      .from("drug_requests")
      .select("id, ref, status, fulfilment, created_at, updated_at, drug_request_items(count)")
      .eq("patient_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("consultations")
      .select("id, ref, status, scheduled_at, topic, duration_min")
      .eq("patient_id", profile.id)
      .order("scheduled_at", { ascending: false })
      .limit(50),
  ]);

  const firstName = profile.full_name?.split(" ")[0];

  return (
    <>
      <LiveRefresh channel={`acct-req:${profile.id}`} table="drug_requests" filter={`patient_id=eq.${profile.id}`} events="UPDATE" />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-medium leading-tight text-ink md:text-5xl">
            {firstName ? `Welcome back, ${firstName}` : "My account"}
          </h1>
          <p className="mt-1 text-base text-gray-600">Track your requests and chat with your pharmacist.</p>
        </div>
        <div className="flex gap-3">
          <ButtonLink href="/consult" variant="secondary" iconLeading={CalendarCheck01}>
            Book consultation
          </ButtonLink>
          <ButtonLink href="/drugs" iconLeading={Plus}>
            New request
          </ButtonLink>
        </div>
      </div>

      <TabLinks
        className="mt-8"
        active={tab}
        tabs={[
          { key: "requests", label: "Drug requests", href: "/account", count: requests?.length ?? 0 },
          { key: "consultations", label: "Consultations", href: "/account?tab=consultations", count: consults?.length ?? 0 },
        ]}
      />

      <Card className="mt-6 overflow-hidden">
        {tab === "requests" ? (
          requests && requests.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {requests.map((r) => {
                const count = (r.drug_request_items as unknown as { count: number }[])[0]?.count ?? 0;
                return (
                  <li key={r.id}>
                    <Link href={`/account/requests/${r.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-25 sm:px-6">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <File06 className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                          {r.ref} <RequestStatusBadge status={r.status} />
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600">
                          {count} {count === 1 ? "item" : "items"} · {r.fulfilment === "delivery" ? "Delivery" : "Pickup"} · {formatDate(r.created_at)}
                        </p>
                      </div>
                      <ChevronRight className="size-5 text-gray-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={File06}
              title="No requests yet"
              description="Add medicines to your list and send a request — we’ll confirm availability and price."
              actions={<ButtonLink href="/drugs" iconLeading={Plus}>Browse medicines</ButtonLink>}
            />
          )
        ) : consults && consults.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {consults.map((c) => (
              <li key={c.id}>
                <Link href={`/account/consultations/${c.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-25 sm:px-6">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <MessageChatCircle className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                      {c.topic} <ConsultStatusBadge status={c.status} />
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {c.ref} · {formatDateTime(c.scheduled_at)} · {c.duration_min} min
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={MessageChatCircle}
            title="No consultations yet"
            description="Book a free, private chat with a licensed pharmacist."
            actions={<ButtonLink href="/consult" iconLeading={CalendarCheck01}>Book consultation</ButtonLink>}
          />
        )}
      </Card>
    </>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-9 w-80" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
