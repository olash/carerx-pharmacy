"use client";

import { ShoppingBag03 } from "@untitledui/icons";
import { useRequestList } from "@/components/providers/request-list";

export function RequestListButton() {
  const { count, hydrated, setOpen } = useRequestList();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-gray-800 outline-none ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-focus sm:px-4"
    >
      <ShoppingBag03 className="size-5 text-gray-500" />
      <span className="hidden sm:inline">Your list</span>
      <span
        className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
          hydrated && count > 0 ? "bg-ink text-white" : "bg-gray-100 text-gray-600"
        }`}
        aria-label={`${hydrated ? count : 0} items in your request list`}
      >
        {hydrated ? count : 0}
      </span>
    </button>
  );
}
