import { Suspense } from "react";
import type { Metadata } from "next";
import { LogIn01, File06 } from "@untitledui/icons";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RequestForm } from "@/components/request/request-form";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeaturedIcon } from "@/components/ui/featured-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestListPreview } from "@/components/request/request-list-preview";

export const metadata: Metadata = { title: "Send a request" };

export default function RequestPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-16">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-700">No payment now</p>
      <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-ink md:text-5xl">Send your request</h1>
      <p className="mt-3 max-w-2xl text-lg text-gray-600">Review your list, add a prescription if needed, and tell us how you’d like to receive it.</p>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-[480px] w-full rounded-xl" />}>
          <RequestGate />
        </Suspense>
      </div>
    </div>
  );
}

async function RequestGate() {
  const profile = await getProfile();
  if (!profile) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <RequestListPreview />
        <Card className="flex flex-col items-start gap-4 p-6 lg:sticky lg:top-28 lg:self-start">
          <FeaturedIcon icon={File06} size="lg" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Log in to send your request</h2>
            <p className="mt-1 text-sm text-gray-600">
              We need your name and phone number so a pharmacist can reach you. Your list is saved on this device.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <ButtonLink href="/signup?next=/request" size="lg" className="w-full">Create an account</ButtonLink>
            <ButtonLink href="/login?next=/request" size="lg" variant="secondary" iconLeading={LogIn01} className="w-full">Log in</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }
  const supabase = await createClient();
  const { data: settings } = await supabase.from("pharmacy_settings").select("delivery_fee").eq("id", 1).single();
  return <RequestForm userId={profile.id} defaultPhone={profile.phone ?? ""} deliveryFee={Number(settings?.delivery_fee ?? 0)} />;
}
