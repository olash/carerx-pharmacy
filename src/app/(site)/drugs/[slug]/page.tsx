import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ChevronRight, File06, MessageChatCircle, ShieldTick, Truck01, Wallet02 } from "@untitledui/icons";
import { getDrugBySlug, getRelatedDrugs } from "@/lib/data/catalogue";
import { DrugThumb } from "@/components/drug-thumb";
import { DrugCard } from "@/components/drug-card";
import { RxBadge, StockBadge } from "@/components/status";
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
        <DrugThumb name={drug.name} form={drug.dosage_form} imageUrl={drug.image_url} size="lg" className="aspect-square w-full rounded-2xl ring-1 ring-gray-200" />

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <StockBadge qty={drug.stock_qty} threshold={drug.low_stock_threshold} />
            {drug.requires_prescription && <RxBadge />}
          </div>
          <h1 className="mt-4 text-display-xs font-semibold text-gray-900 md:text-display-sm">{drug.name}</h1>
          {drug.generic_name && <p className="mt-1 text-lg text-gray-600">{drug.generic_name}</p>}
          <p className="mt-6 text-display-xs font-semibold text-gray-900">{formatNaira(drug.price)}</p>
          <p className="text-sm text-gray-500">Shelf price · final price confirmed by your pharmacist</p>

          {drug.requires_prescription && (
            <div className="mt-6 flex gap-3 rounded-xl bg-purple-50 p-4 text-sm ring-1 ring-inset ring-purple-200">
              <File06 className="mt-0.5 size-5 shrink-0 text-purple-700" />
              <div>
                <p className="font-semibold text-purple-700">Prescription required</p>
                <p className="mt-1 text-purple-700/90">Upload a valid prescription when you send your request. A pharmacist will verify it before dispensing.</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToListButton drug={drug} size="xl" className="sm:flex-1" openDrawer />
            <ButtonLink href="/consult" size="xl" variant="secondary" iconLeading={MessageChatCircle}>
              Ask a pharmacist
            </ButtonLink>
          </div>

          <ul className="mt-8 grid gap-4 border-y border-gray-200 py-6 text-sm text-gray-600 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Wallet02 className="size-5 text-gray-400" /> Pay on pickup/delivery</li>
            <li className="flex items-center gap-2"><Truck01 className="size-5 text-gray-400" /> Same-day in Lagos</li>
            <li className="flex items-center gap-2"><ShieldTick className="size-5 text-gray-400" /> Pharmacist-checked</li>
          </ul>

          {drug.description && (
            <section className="mt-6">
              <h2 className="text-base font-semibold text-gray-900">About this medicine</h2>
              <p className="mt-2 text-base text-gray-600">{drug.description}</p>
            </section>
          )}
          {drug.usage_notes && (
            <section className="mt-6">
              <h2 className="text-base font-semibold text-gray-900">How to use</h2>
              <p className="mt-2 text-base text-gray-600">{drug.usage_notes}</p>
              <p className="mt-2 text-sm text-gray-500">Always follow your doctor’s or pharmacist’s directions.</p>
            </section>
          )}
          {facts.length > 0 && (
            <dl className="mt-6 divide-y divide-gray-200 rounded-xl ring-1 ring-gray-200">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
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
          <h2 className="text-xl font-semibold text-gray-900">More in {drug.category?.name}</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:gap-6 lg:grid-cols-4">
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
