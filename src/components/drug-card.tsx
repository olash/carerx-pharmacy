import Link from "next/link";
import type { DrugWithCategory } from "@/lib/data/catalogue";
import { formatNaira } from "@/lib/utils";
import { DrugThumb } from "./drug-thumb";
import { RxBadge, StockBadge } from "./status";
import { AddToListButton } from "./add-to-list-button";

export function DrugCard({ drug }: { drug: DrugWithCategory }) {
  const detail = [drug.strength, drug.pack_size].filter(Boolean).join(" · ");
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-gray-200 transition hover:shadow-md">
      <Link href={`/drugs/${drug.slug}`} className="outline-none focus-visible:ring-focus" aria-label={drug.name}>
        <DrugThumb name={drug.name} form={drug.dosage_form} imageUrl={drug.image_url} className="aspect-[4/3] w-full" />
      </Link>
      <div className="absolute left-3 top-3 flex gap-1.5">
        {drug.requires_prescription && <RxBadge />}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          {drug.category && <p className="text-xs font-semibold text-brand-700">{drug.category.name}</p>}
          <h3 className="text-base font-semibold text-gray-900">
            <Link href={`/drugs/${drug.slug}`} className="hover:underline">
              {drug.name}
            </Link>
          </h3>
          {detail && <p className="text-sm text-gray-600">{detail}</p>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-lg font-semibold text-gray-900">{formatNaira(drug.price)}</p>
          <StockBadge qty={drug.stock_qty} threshold={drug.low_stock_threshold} />
        </div>
        <AddToListButton drug={drug} size="md" className="w-full" />
      </div>
    </article>
  );
}

export function DrugCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
      <div className="aspect-[4/3] animate-pulse bg-gray-100" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}
