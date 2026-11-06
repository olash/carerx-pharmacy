import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamManager } from "@/components/admin/team-manager";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader title="Team" description="Who can sign in to the pharmacy admin." />
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <Team />
      </Suspense>
    </div>
  );
}

async function Team() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").in("role", ["admin", "pharmacist"]).order("role").order("full_name");
  return <TeamManager staff={data ?? []} currentId={admin.id} />;
}
