import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ChevronRight } from "@untitledui/icons";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DrugForm } from "@/components/admin/drug-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Add medicine" };

export default function NewDrugPage() {
  return (
    <div>
      <PageHeader
        title="Add medicine"
        description="Create a new product in your inventory."
        breadcrumbs={
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Link href="/admin/inventory" className="hover:text-gray-900">Inventory</Link>
            <ChevronRight className="size-4 text-gray-300" />
            <span className="text-brand-700">New</span>
          </nav>
        }
      />
      <div className="mt-2">
        <Suspense fallback={<Skeleton className="mt-6 h-[600px] rounded-xl" />}>
          <Form />
        </Suspense>
      </div>
    </div>
  );
}

async function Form() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return <DrugForm categories={data ?? []} />;
}
