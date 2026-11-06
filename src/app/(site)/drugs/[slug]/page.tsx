import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ChevronRight, File06, MessageChatCircle, ShieldTick, Truck01, Wallet02 } from "@untitledui/icons";
import { getDrugBySlug, getRelatedDrugs } from "@/lib/data/catalogue";
import { DrugThumb } from "@/components/drug-thumb";
import { DrugCard } from "@/components/drug-card";
import { StockText } from "@/components/drug-card";
import { AddToListButton } from "@/components/add-to-list-button";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/drugs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const drug = await getDrugBySlug(slug);
  return { title: drug?.name ?? "Medicine" };
}

export default function DrugPage({ params }: PageProps<"/drugs/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <Suspense fallback={<DrugSkeleton />}>
        <DrugDetail params={params} />
      </Suspense>
    </div>
  );
}

async function DrugDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drug = await getDrugBySlug(slug);
  if (!drug) notFound();
  const related = await getRelatedDrugs(drug);

  const facts = [
    ["Generic name", drug.generic_name],
    ["Brand / manufacturer", drug.brand],
    ["Form", drug.dosage_form],
    ["Strength", drug.strength],
    ["Pack size", drug.pack_size],
    ["NAFDAC No.", drug.nafdac_no],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-600">
        <Link href="/drugs" className="hover:text-gray-900">Medicines</Link>
        {drug.category && (
          <>
            <ChevronRight className="size-4 text-gray-300" />
            <Link href={`/drugs?category=${drug.category.slug}`} className="hover:text-gray-900">{drug.category.name}</Link>
          </>
        )}
        <ChevronRight className="size-4 text-gray-300" />
        <span className="text-brand-700">{drug.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-16">
        <DrugThumb name={drug.name} brand={drug.brand} strength={drug.strength} form={drug.dosage_form} imageUrl={drug.image_url} size="lg" className="aspect-square w-full rounded-[28px] lg:sticky lg:top-32" />

        <div className="flex flex-col">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-700">
            {drug.category?.name ?? "Medicine"}
            {drug.requires_prescription && <span className="text-gray-500"> · Prescription only</span>}
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium leading-[1.05] text-ink md:text-5xl">{drug.name}</h1>
          {drug.generic_name && <p className="mt-2 text-lg text-gray-600">{drug.generic_name}{drug.brand ? ` · ${drug.brand}` : ""}</p>}
          <div className="mt-8 flex items-end justify-between gap-4 border-t border-gray-200 pt-6">
            <div>
              <p className="font-display text-4xl font-medium text-ink">{formatNaira(drug.price)}</p>
              <p className="mt-1 text-sm text-gray-500">Shelf price — your pharmacist confirms the final quote</p>
            </div>
            <StockText qty={drug.stock_qty} threshold={drug.low_stock_threshold} className="text-sm" />
          </div>

          {drug.requires_prescription && (
            <div className="mt-6 flex gap-3 rounded-2xl bg-marigold-50 p-4 text-sm">
              <File06 className="mt-0.5 size-5 shrink-0 text-marigold-700" />
              <div>
                <p className="font-semibold text-ink">You’ll need a prescription for this</p>
                <p className="mt-1 text-gray-700">Attach a photo of it when you send your request. A pharmacist checks it before anything is dispensed.</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToListButton drug={drug} size="xl" className="rounded-full sm:flex-1" openDrawer />
            <ButtonLink href="/consult" size="xl" variant="secondary" iconLeading={MessageChatCircle} className="rounded-full">
              Ask a pharmacist
            </ButtonLink>
          </div>

          <ul className="mt-8 grid gap-4 rounded-2xl bg-paper p-5 text-sm text-gray-700 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Wallet02 className="size-5 text-gray-400" /> Pay on delivery</li>
            <li className="flex items-center gap-2"><Truck01 className="size-5 text-gray-400" /> Same-day in Lagos</li>
            <li className="flex items-center gap-2"><ShieldTick className="size-5 text-gray-400" /> Pharmacist-checked</li>
          </ul>

          {drug.description && (
            <section className="mt-6">
              <h2 className="font-display text-2xl font-medium text-ink">About this medicine</h2>
              <p className="mt-2 text-base text-gray-600">{drug.description}</p>
            </section>
          )}
          {drug.usage_notes && (
            <section className="mt-6">
              <h2 className="font-display text-2xl font-medium text-ink">How to use</h2>
              <p className="mt-2 text-base text-gray-600">{drug.usage_notes}</p>
              <p className="mt-2 text-sm text-gray-500">Always follow your doctor’s or pharmacist’s directions.</p>
            </section>
          )}
          {facts.length > 0 && (
            <dl className="mt-8 divide-y divide-gray-200 border-y border-gray-200">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-gray-600">{k}</dt>
                  <dd className="text-right font-medium text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="font-display text-3xl font-medium text-ink">More in {drug.category?.name}</h2>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {related.map((d) => (
              <DrugCard key={d.id} drug={d} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function DrugSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
