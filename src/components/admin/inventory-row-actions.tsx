"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, DotsVertical, Edit05, Eye, EyeOff, Trash01, XClose } from "@untitledui/icons";
import { deleteDrug, setActive, setStock } from "@/actions/admin/inventory";
import { useToast } from "@/components/providers/toast";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { stockLevel, cn } from "@/lib/utils";

export function StockCell({ id, qty, threshold }: { id: string; qty: number; threshold: number }) {
  const [value, setValue] = useState(String(qty));
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const level = stockLevel(qty, threshold);

  const save = () =>
    start(async () => {
      const n = Number(value);
      const res = await setStock(id, n);
      if (!res.ok) return toast({ tone: "error", title: res.error });
      setEditing(false);
      toast({ tone: "success", title: "Stock updated" });
      router.refresh();
    });

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group inline-flex items-center gap-2 rounded-md px-2 py-1 -mx-2 text-left hover:bg-gray-50"
        title="Click to update stock"
      >
        <span
          className={cn(
            "size-2 rounded-full",
            level === "out_of_stock" ? "bg-error-500" : level === "low_stock" ? "bg-warning-500" : "bg-success-500",
          )}
        />
        <span className="font-medium tabular-nums text-gray-900">{qty}</span>
        <Edit05 className="size-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
      </button>
    );
  }
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <input
        autoFocus
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        aria-label="Stock quantity"
        className="h-8 w-20 rounded-md px-2 text-sm tabular-nums ring-1 ring-inset ring-gray-300 outline-none focus:ring-2 focus:ring-brand-600"
      />
      <button type="submit" disabled={pending} className="rounded-md p-1.5 text-brand-700 hover:bg-brand-50" aria-label="Save stock">
        <Check className="size-4" />
      </button>
      <button type="button" onClick={() => (setEditing(false), setValue(String(qty)))} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-50" aria-label="Cancel">
        <XClose className="size-4" />
      </button>
    </form>
  );
}

export function InventoryRowActions({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const res = await fn();
      toast(res.ok ? { tone: "success", title: res.message ?? "Saved" } : { tone: "error", title: res.error ?? "Failed" });
      setConfirm(false);
      router.refresh();
    });

  return (
    <>
      <Dropdown
        label={`Actions for ${name}`}
        trigger={({ toggle, open, id: menuId }) => (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={menuId}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-500"
            aria-label={`Actions for ${name}`}
          >
            <DotsVertical className="size-5" />
          </button>
        )}
        className="min-w-48"
      >
        {(close) => (
          <>
            <div className="px-1.5 py-px">
              <Link href={`/admin/inventory/${id}`} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Edit05 className="size-4 text-gray-500" /> Edit
              </Link>
            </div>
            <DropdownItem icon={active ? EyeOff : Eye} onClick={() => (close(), run(() => setActive(id, !active)))}>
              {active ? "Hide from site" : "Show on site"}
            </DropdownItem>
            <div className="my-1 border-t border-gray-200" />
            <DropdownItem icon={Trash01} className="text-error-700" onClick={() => (close(), setConfirm(true))}>
              Delete
            </DropdownItem>
          </>
        )}
      </Dropdown>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        icon={Trash01}
        tone="error"
        title={`Delete ${name}?`}
        description="This permanently removes it from your inventory. Past requests keep their item names. To keep it but stop selling it, hide it instead."
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="lg" loading={pending} onClick={() => run(() => deleteDrug(id))}>Delete</Button>
          </>
        }
      />
    </>
  );
}
