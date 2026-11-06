import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader title="Settings & hours" description="Control consultation availability and delivery pricing." />
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  const supabase = await createClient();
  const [{ data: settings }, { data: hours }] = await Promise.all([
    supabase.from("pharmacy_settings").select("*").eq("id", 1).single(),
    supabase.from("consultation_hours").select("*").order("weekday"),
  ]);
  if (!settings || !hours) return <p className="text-sm text-gray-600">Settings could not be loaded.</p>;
  return <SettingsForm settings={settings} hours={hours} />;
}
