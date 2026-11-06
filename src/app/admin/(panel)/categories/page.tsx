import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Categories" description="Group medicines so patients can browse by need." />
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*, drugs(count)").order("sort_order").order("name");
  const rows = (data ?? []).map(({ drugs, ...c }) => ({ ...c, count: (drugs as unknown as { count: number }[])[0]?.count ?? 0 }));
  return <CategoryManager categories={rows} />;
}
