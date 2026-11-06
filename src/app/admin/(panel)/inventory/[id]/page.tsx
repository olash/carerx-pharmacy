import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ChevronRight, LinkExternal01 } from "@untitledui/icons";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DrugForm } from "@/components/admin/drug-form";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button";
import { StockBadge } from "@/components/status";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit medicine" };

export default function EditDrugPage({ params }: PageProps<"/admin/inventory/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[700px] rounded-xl" />}>
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: drug }, { data: categories }] = await Promise.all([
    supabase.from("drugs").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
  ]);
  if (!drug) notFound();
  return (
    <div>
      <PageHeader
        title={drug.name}
        description={<span className="flex flex-wrap items-center gap-2">Last updated {formatDateTime(drug.updated_at)} <StockBadge qty={drug.stock_qty} threshold={drug.low_stock_threshold} showQty /></span>}
        breadcrumbs={
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Link href="/admin/inventory" className="hover:text-gray-900">Inventory</Link>
            <ChevronRight className="size-4 text-gray-300" />
            <span className="truncate text-brand-700">{drug.name}</span>
          </nav>
        }
        actions={drug.is_active && <ButtonLink href={`/drugs/${drug.slug}`} target="_blank" variant="secondary" iconTrailing={LinkExternal01}>View on site</ButtonLink>}
      />
      <div className="mt-2">
        <DrugForm drug={drug} categories={categories ?? []} />
      </div>
    </div>
  );
}
