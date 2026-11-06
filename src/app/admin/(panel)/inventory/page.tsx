import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Download01, Plus, SearchLg, Package } from "@untitledui/icons";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TabLinks } from "@/components/ui/tabs";
import { Table, THead, Th, Td, Tr } from "@/components/ui/table";
import { DrugThumb } from "@/components/drug-thumb";
import { RxBadge } from "@/components/status";
import { InventoryRowActions, StockCell } from "@/components/admin/inventory-row-actions";
import { ImportInventoryButton } from "@/components/admin/import-inventory";
import { escapeLike, formatNaira, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventory" };

const PAGE = 50;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Everything on your shelves. Changes show on the website instantly."
        actions={
          <>
            <a href="/admin/inventory-export" className={buttonClasses("secondary")}>
              <Download01 className="size-5" /> Export
            </a>
            <ImportInventoryButton />
            <ButtonLink href="/admin/inventory/new" iconLeading={Plus}>Add medicine</ButtonLink>
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <InventoryTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function href(sp: SP, patch: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  const merged = { ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, one(v)])), ...patch };
  for (const [k, v] of Object.entries(merged)) if (v && k !== "saved") p.set(k, v);
  const s = p.toString();
  return s ? `/admin/inventory?${s}` : "/admin/inventory";
}

async function InventoryTable({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const stock = one(sp.stock) || "all";
  const category = one(sp.category);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const supabase = await createClient();

  let query = supabase.from("inventory_view").select("*", { count: "exact" });
  if (q) {
    const t = escapeLike(q);
    query = query.or(`name.ilike.%${t}%,generic_name.ilike.%${t}%,brand.ilike.%${t}%,nafdac_no.ilike.%${t}%`);
  }
  if (category) query = query.eq("category_id", category);
  if (stock === "attention") query = query.neq("stock_status", "in_stock").eq("is_active", true);
  else if (stock === "hidden") query = query.eq("is_active", false);
  else if (stock !== "all") query = query.eq("stock_status", stock);

  const [{ data: drugs, count }, { data: categories }, { data: allCounts }] = await Promise.all([
    query.order("name").range((page - 1) * PAGE, page * PAGE - 1),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("inventory_view").select("stock_status, is_active"),
  ]);

  const c = (fn: (r: { stock_status: string | null; is_active: boolean | null }) => boolean) => (allCounts ?? []).filter(fn).length;
  const tabs = [
    { key: "all", label: "All", count: allCounts?.length ?? 0 },
    { key: "attention", label: "Needs restock", count: c((r) => !!r.is_active && r.stock_status !== "in_stock") },
    { key: "low_stock", label: "Low", count: c((r) => r.stock_status === "low_stock") },
    { key: "out_of_stock", label: "Out of stock", count: c((r) => r.stock_status === "out_of_stock") },
    { key: "hidden", label: "Hidden", count: c((r) => !r.is_active) },
  ].map((t) => ({ ...t, href: href(sp, { stock: t.key === "all" ? undefined : t.key, page: undefined }) }));

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <>
      {one(sp.saved) && <Alert tone="success" title={`“${one(sp.saved)}” saved`}>It’s live on the website now.</Alert>}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <TabLinks tabs={tabs} active={stock} />
          <form className="flex flex-col gap-3 sm:flex-row" action="/admin/inventory">
            {stock !== "all" && <input type="hidden" name="stock" value={stock} />}
            <select
              name="category"
              defaultValue={category}
              aria-label="Filter by category"
              className="h-10 rounded-lg bg-white px-3 text-sm text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">All categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <label className="relative">
              <SearchLg className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search name, brand, NAFDAC…"
                aria-label="Search inventory"
                className="h-10 w-full rounded-lg bg-white pl-10 pr-3 text-sm shadow-xs ring-1 ring-inset ring-gray-300 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-brand-600 sm:w-72"
              />
            </label>
            <button type="submit" className={buttonClasses("secondary")}>Filter</button>
          </form>
        </div>

        {drugs && drugs.length ? (
          <Table>
            <THead>
              <tr>
                <Th>Medicine</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
                <Th className="w-12"><span className="sr-only">Actions</span></Th>
              </tr>
            </THead>
            <tbody>
              {drugs.map((d) => (
                <Tr key={d.id} className="hover:bg-gray-25">
                  <Td>
                    <div className="flex items-center gap-3">
                      <DrugThumb name={d.name!} form={d.dosage_form} imageUrl={d.image_url} size="sm" className="size-10 shrink-0 rounded-lg ring-1 ring-gray-200" />
                      <div className="min-w-0">
                        <Link href={`/admin/inventory/${d.id}`} className="flex items-center gap-1.5 font-medium text-gray-900 hover:underline">
                          {d.name} {d.requires_prescription && <RxBadge />}
                        </Link>
                        <p className="truncate text-gray-500">{[d.strength, d.pack_size, d.brand].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">{d.category_name ?? <span className="text-gray-400">—</span>}</Td>
                  <Td className="whitespace-nowrap text-right font-medium text-gray-900">{formatNaira(d.price)}</Td>
                  <Td><StockCell id={d.id!} qty={d.stock_qty ?? 0} threshold={d.low_stock_threshold ?? 0} /></Td>
                  <Td>
                    {!d.is_active ? (
                      <Badge color="gray">Hidden</Badge>
                    ) : d.stock_status === "out_of_stock" ? (
                      <Badge color="error" dot>Out of stock</Badge>
                    ) : d.stock_status === "low_stock" ? (
                      <Badge color="warning" dot>Low stock</Badge>
                    ) : (
                      <Badge color="success" dot>Active</Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(d.updated_at!)}</Td>
                  <Td><InventoryRowActions id={d.id!} name={d.name!} active={!!d.is_active} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={q ? SearchLg : Package}
            title={q ? "No medicines found" : "Nothing here"}
            description={q ? `No results for “${q}”. Try another search or add it.` : "No medicines match this filter."}
            actions={<ButtonLink href="/admin/inventory/new" iconLeading={Plus}>Add medicine</ButtonLink>}
          />
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <Link aria-disabled={page <= 1} href={href(sp, { page: String(page - 1) })} className={buttonClasses("secondary", "sm", page <= 1 ? "pointer-events-none opacity-50" : undefined)}>Previous</Link>
            <span className="text-sm text-gray-700">Page {page} of {pages}</span>
            <Link aria-disabled={page >= pages} href={href(sp, { page: String(page + 1) })} className={buttonClasses("secondary", "sm", page >= pages ? "pointer-events-none opacity-50" : undefined)}>Next</Link>
          </div>
        )}
      </Card>
    </>
  );
}
