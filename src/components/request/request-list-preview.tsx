"use client";

import Link from "next/link";
import { ShoppingBag03, SearchLg } from "@untitledui/icons";
import { useRequestList } from "@/components/providers/request-list";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { DrugThumb } from "@/components/drug-thumb";
import { RxBadge } from "@/components/status";
import { formatNaira } from "@/lib/utils";

export function RequestListPreview() {
  const { items, hydrated } = useRequestList();
  if (!hydrated) return <div className="h-64 animate-pulse rounded-xl bg-gray-50" />;
  return (
    <Card>
      <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900">Your list</h2>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag03}
          title="Nothing here yet"
          description="Add medicines from the catalogue first."
          actions={<Link href="/drugs" className={buttonClasses("secondary")}><SearchLg className="size-5" /> Browse medicines</Link>}
        />
      ) : (
        <ul className="divide-y divide-gray-200">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-4 px-4 py-4 sm:px-6">
              <DrugThumb name={i.name} form={i.form} size="sm" className="size-12 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{i.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-gray-600">{i.requiresRx && <RxBadge />} Qty {i.qty}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{i.price === null ? "Quote" : formatNaira(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
