import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchLg, ChevronLeft, ChevronRight, FilterLines } from "@untitledui/icons";
import { getCategories, PAGE_SIZE, searchDrugs } from "@/lib/data/catalogue";
import { DrugCard, DrugCardSkeleton } from "@/components/drug-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { AddCustomItem } from "@/components/site/request-drawer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Medicines" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function DrugsPage({ searchParams }: PageProps<"/drugs">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-display-xs font-semibold text-gray-900 md:text-display-sm">Medicines</h1>
        <p className="text-base text-gray-600">Add items to your request list — a pharmacist confirms price and availability before you pay.</p>
      </div>
      <Suspense fallback={<CatalogueSkeleton />}>
        <Catalogue searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function buildHref(sp: SP, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, one(v)])), ...patch })) {
    if (v) params.set(k, v);
  }
  const s = params.toString();
  return s ? `/drugs?${s}` : "/drugs";
}

async function Catalogue({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const category = one(sp.category);
  const availability = one(sp.availability) === "in_stock" ? "in_stock" : undefined;
  const rx = (["otc", "rx"] as const).find((v) => v === one(sp.rx));
  const page = Math.max(1, Number.parseInt(one(sp.page) || "1", 10) || 1);

  const [categories, { drugs, total }] = await Promise.all([
    getCategories(),
    searchDrugs({ q, category, availability, rx, page }),
  ]);
  const activeCategory = categories.find((c) => c.slug === category);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-semibold ring-1 ring-inset transition",
      active ? "bg-brand-50 text-brand-700 ring-brand-300" : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-50",
    );

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
      {/* Filters */}
      <aside className="flex min-w-0 flex-col gap-6">
        <form action="/drugs" className="relative" role="search">
          {category && <input type="hidden" name="category" value={category} />}
          {availability && <input type="hidden" name="availability" value={availability} />}
          {rx && <input type="hidden" name="rx" value={rx} />}
          <SearchLg className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search medicines"
            aria-label="Search medicines"
            className="h-11 w-full rounded-lg bg-white pl-10 pr-3 text-base shadow-xs ring-1 ring-inset ring-gray-300 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-brand-600"
          />
        </form>

        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <FilterLines className="size-4 text-gray-500" /> Category
          </h2>
          <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0" aria-label="Categories">
            <Link href={buildHref(sp, { category: undefined, page: undefined })} className={cn(chip(!category), "lg:h-auto lg:justify-start lg:rounded-md lg:px-3 lg:py-2 lg:ring-0", !category ? "lg:bg-gray-50 lg:text-gray-900" : "lg:bg-transparent lg:font-medium lg:text-gray-600")}>
              All categories
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={buildHref(sp, { category: c.slug, page: undefined })}
                className={cn(chip(c.slug === category), "lg:h-auto lg:justify-start lg:rounded-md lg:px-3 lg:py-2 lg:ring-0", c.slug === category ? "lg:bg-gray-50 lg:text-gray-900" : "lg:bg-transparent lg:font-medium lg:text-gray-600")}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
          <Link href={buildHref(sp, { availability: availability ? undefined : "in_stock", page: undefined })} className={chip(!!availability)}>
            In stock only
          </Link>
          <div className="flex gap-2">
            <Link href={buildHref(sp, { rx: rx === "otc" ? undefined : "otc", page: undefined })} className={chip(rx === "otc")}>
              No prescription
            </Link>
            <Link href={buildHref(sp, { rx: rx === "rx" ? undefined : "rx", page: undefined })} className={chip(rx === "rx")}>
              Rx only
            </Link>
          </div>
        </div>

        <div className="hidden rounded-xl bg-gray-50 p-4 lg:block">
          <AddCustomItem />
        </div>
      </aside>

      {/* Results */}
      <section aria-live="polite" className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{total}</span> {total === 1 ? "medicine" : "medicines"}
            {q && (
              <>
                {" "}for “<span className="font-medium text-gray-900">{q}</span>”
              </>
            )}
            {activeCategory && <> in {activeCategory.name}</>}
          </p>
          {(q || category || availability || rx) && (
            <Link href="/drugs" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Clear filters
            </Link>
          )}
        </div>

        {drugs.length === 0 ? (
          <div className="rounded-xl ring-1 ring-gray-200">
            <EmptyState
              icon={SearchLg}
              title="No medicines found"
              description={q ? `We couldn’t find “${q}”. Add it to your request list and our pharmacists will try to source it.` : "Try a different category or filter."}
              actions={<div className="w-full max-w-sm text-left"><AddCustomItem compact /></div>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {drugs.map((d) => (
              <DrugCard key={d.id} drug={d} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-8 flex items-center justify-between border-t border-gray-200 pt-5" aria-label="Pagination">
            <Link
              aria-disabled={page <= 1}
              href={buildHref(sp, { page: String(page - 1) })}
              className={buttonClasses("secondary", "sm", page <= 1 ? "pointer-events-none opacity-50" : undefined)}
            >
              <ChevronLeft className="size-4" /> Previous
            </Link>
            <span className="text-sm font-medium text-gray-700">
              Page {page} of {pages}
            </span>
            <Link
              aria-disabled={page >= pages}
              href={buildHref(sp, { page: String(page + 1) })}
              className={buttonClasses("secondary", "sm", page >= pages ? "pointer-events-none opacity-50" : undefined)}
            >
              Next <ChevronRight className="size-4" />
            </Link>
          </nav>
        )}
      </section>
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
      <div className="flex flex-col gap-3">
        <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-md bg-gray-50" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <DrugCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
