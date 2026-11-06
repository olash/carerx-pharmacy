import Link from "next/link";
import type { DrugWithCategory } from "@/lib/data/catalogue";
import { cn, formatNaira, stockLevel } from "@/lib/utils";
import { DrugThumb } from "./drug-thumb";
import { AddToListButton } from "./add-to-list-button";

export function StockText({ qty, threshold, className }: { qty: number; threshold: number; className?: string }) {
  const level = stockLevel(qty, threshold);
  const [dot, text] =
    level === "out_of_stock"
      ? ["bg-error-500", "Out of stock"]
      : level === "low_stock"
        ? ["bg-marigold-400", `Only ${qty} left`]
        : ["bg-success-500", "In stock"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] text-gray-600", className)}>
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
      {text}
    </span>
  );
}

export function DrugCard({ drug }: { drug: DrugWithCategory }) {
  const detail = [drug.strength, drug.pack_size].filter(Boolean).join(" · ");
  return (
    <article className="group flex flex-col">
      <Link href={`/drugs/${drug.slug}`} className="relative block overflow-hidden rounded-2xl outline-none focus-visible:ring-focus" aria-label={drug.name}>
        <DrugThumb
          name={drug.name}
          brand={drug.brand}
          strength={drug.strength}
          form={drug.dosage_form}
          imageUrl={drug.image_url}
          className="aspect-[4/3] w-full transition duration-300 group-hover:scale-[1.02]"
        />
        {drug.requires_prescription && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-800 shadow-xs backdrop-blur">
            Prescription
          </span>
        )}
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        {drug.category && <p className="text-[13px] text-gray-500">{drug.category.name}</p>}
        <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-ink">
          <Link href={`/drugs/${drug.slug}`} className="hover:underline hover:underline-offset-4">
            {drug.name}
          </Link>
        </h3>
        {detail && <p className="mt-0.5 text-sm text-gray-600">{detail}</p>}
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-base font-semibold text-ink">{formatNaira(drug.price)}</p>
          <StockText qty={drug.stock_qty} threshold={drug.low_stock_threshold} />
        </div>
        <AddToListButton drug={drug} size="md" variant="quiet" className="mt-4 w-full" />
      </div>
    </article>
  );
}

export function DrugCardSkeleton() {
  return (
    <div>
      <div className="aspect-[4/3] animate-pulse rounded-2xl bg-paper" />
      <div className="mt-4 flex flex-col gap-2">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
