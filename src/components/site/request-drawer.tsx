"use client";

import Link from "next/link";
import { IlloEmptyBag } from "@/components/illustrations";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash01, XClose, File06, SearchLg } from "@untitledui/icons";
import { useRequestList } from "@/components/providers/request-list";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RxBadge } from "@/components/status";
import { DrugThumb } from "@/components/drug-thumb";
import { formatNaira } from "@/lib/utils";

export function QtyStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-lg ring-1 ring-inset ring-gray-300 shadow-xs">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="rounded-l-lg p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
        aria-label={`Decrease ${label} quantity`}
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums text-gray-700" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= 99}
        className="rounded-r-lg p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
        aria-label={`Increase ${label} quantity`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function AddCustomItem({ compact }: { compact?: boolean }) {
  const { addCustom } = useRequestList();
  const [name, setName] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addCustom(name);
        setName("");
      }}
      className="flex flex-col gap-2"
    >
      {!compact && <p className="text-sm font-medium text-gray-700">Can’t find a medicine?</p>}
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type the drug name & strength"
          aria-label="Medicine not in catalogue"
          className="h-10 min-w-[180px] flex-1 rounded-lg bg-white px-3 text-sm shadow-xs ring-1 ring-inset ring-gray-300 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-brand-600"
          maxLength={120}
        />
        <Button type="submit" variant="secondary" iconLeading={Plus} disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
}

export function RequestDrawer() {
  const { items, open, setOpen, setQty, remove, needsPrescription, estimatedTotal, count } = useRequestList();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;
  const hasUnpriced = items.some((i) => i.price === null);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="request-drawer-title">
      <div className="absolute inset-0 animate-fade-in bg-gray-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-5 sm:px-6">
          <div>
            <h2 id="request-drawer-title" className="font-display text-2xl font-medium text-ink">
              Your request list
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              A pharmacist confirms availability and price before you pay.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="-m-2 rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-500" aria-label="Close">
            <XClose className="size-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {items.length === 0 ? (
            <EmptyState
              illustration={<IlloEmptyBag />}
              title="Your list is empty"
              description="Browse our medicines or type in anything you need — we’ll check if we can get it."
              actions={
                <Link href="/drugs" onClick={() => setOpen(false)} className={buttonClasses("secondary", "md")}>
                  <SearchLg className="size-5" /> Browse medicines
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-4">
                  <DrugThumb name={item.name} form={item.form} className="size-16 shrink-0 rounded-lg" size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
                          {item.requiresRx && <RxBadge />}
                          {item.detail}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-gray-900">
                        {item.price === null ? <span className="font-medium text-gray-500">To be quoted</span> : formatNaira(item.price * item.qty)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <QtyStepper value={item.qty} onChange={(n) => setQty(item.key, n)} label={item.name} />
                      <button
                        type="button"
                        onClick={() => remove(item.key)}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-error-700"
                      >
                        <Trash01 className="size-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <AddCustomItem />
          </div>
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {needsPrescription && (
              <p className="mb-4 flex items-start gap-2 rounded-lg bg-purple-50 p-3 text-sm text-purple-700">
                <File06 className="mt-0.5 size-4 shrink-0" />
                Some items need a valid prescription. You’ll upload it on the next step.
              </p>
            )}
            <dl className="flex items-center justify-between text-base">
              <dt className="font-medium text-gray-700">
                Estimated total <span className="text-sm font-normal text-gray-500">({count} items)</span>
              </dt>
              <dd className="font-semibold text-gray-900">
                {formatNaira(estimatedTotal)}
                {hasUnpriced && <span className="text-sm font-normal text-gray-500"> + quoted items</span>}
              </dd>
            </dl>
            <Link href="/request" onClick={() => setOpen(false)} className={buttonClasses("primary", "xl", "mt-4 w-full")}>
              Continue to request
            </Link>
            <p className="mt-3 text-center text-xs text-gray-500">No payment now — you pay when it’s delivered.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
