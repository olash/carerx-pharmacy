"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Plus, SearchLg, Send01, Trash01, XCircle, Truck01, Package, PhoneCall01, Save01 } from "@untitledui/icons";
import { saveQuote, setRequestStatus } from "@/actions/admin/requests";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/status";
import { cn, escapeLike, formatNaira } from "@/lib/utils";
import type { DrugRequest, DrugRequestItem, RequestStatus } from "@/lib/types";

type Stock = { stock_qty: number; low_stock_threshold: number; price: number } | null;
type EditItem = {
  id: string;
  drug_id: string | null;
  name: string;
  quantity: number;
  unit_price: string;
  is_available: boolean;
  pharmacist_note: string;
  stock: Stock;
};

const editable: RequestStatus[] = ["submitted", "reviewing", "quoted"];

function DrugSearch({ onPick }: { onPick: (d: { id: string; name: string; strength: string | null; price: number; stock_qty: number; low_stock_threshold: number }) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; strength: string | null; price: number; stock_qty: number; low_stock_threshold: number }[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(async () => {
      const term = escapeLike(q.trim());
      const { data } = await createClient()
        .from("drugs")
        .select("id, name, strength, price, stock_qty, low_stock_threshold")
        .or(`name.ilike.%${term}%,generic_name.ilike.%${term}%,brand.ilike.%${term}%`)
        .order("stock_qty", { ascending: false })
        .limit(8);
      setResults((data ?? []).map((d) => ({ ...d, price: Number(d.price) })));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);
  const shown = q.trim().length < 2 ? [] : results;
  return (
    <div className="flex flex-col gap-2">
      <label className="relative">
        <SearchLg className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search inventory…"
          aria-label="Search inventory"
          className="h-10 w-full rounded-lg pl-10 pr-3 text-sm shadow-xs ring-1 ring-inset ring-gray-300 outline-none focus:ring-2 focus:ring-brand-600"
        />
      </label>
      <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg ring-1 ring-gray-200 empty:hidden">
        {shown.map((d) => (
          <li key={d.id}>
            <button type="button" onClick={() => onPick(d)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-900">{d.name}</span>
                <span className="text-xs text-gray-500">{formatNaira(d.price)}</span>
              </span>
              <StockBadge qty={d.stock_qty} threshold={d.low_stock_threshold} showQty />
            </button>
          </li>
        ))}
      </ul>
      {q.trim().length >= 2 && (
        <button
          type="button"
          onClick={() => onPick({ id: "", name: q.trim(), strength: null, price: 0, stock_qty: 0, low_stock_threshold: 0 })}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand-700 hover:bg-brand-25"
        >
          <Plus className="size-4" /> Add “{q.trim()}” as a custom item
        </button>
      )}
    </div>
  );
}

export function RequestReview({
  request,
  items: initialItems,
  stock,
}: {
  request: DrugRequest;
  items: DrugRequestItem[];
  stock: Record<string, Stock>;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEditable = editable.includes(request.status);
  const [items, setItems] = useState<EditItem[]>(() =>
    initialItems.map((i) => {
      const s = i.drug_id ? stock[i.drug_id] ?? null : null;
      return {
        id: i.id,
        drug_id: i.drug_id,
        name: i.name,
        quantity: i.quantity,
        // Pre-fill with shelf price for convenience.
        unit_price: i.unit_price !== null ? String(Number(i.unit_price)) : s ? String(s.price) : "",
        is_available: i.is_available ?? (s ? s.stock_qty >= i.quantity : true),
        pharmacist_note: i.pharmacist_note ?? "",
        stock: s,
      };
    }),
  );
  const [removed, setRemoved] = useState<string[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(String(Number(request.delivery_fee)));
  const [note, setNote] = useState(request.pharmacist_note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [pending, start] = useTransition();

  const totals = useMemo(() => {
    const subtotal = items.filter((i) => i.is_available).reduce((s, i) => s + (Number(i.unit_price) || 0) * i.quantity, 0);
    const delivery = Number(deliveryFee) || 0;
    return { subtotal, delivery, total: subtotal + delivery };
  }, [items, deliveryFee]);

  const update = (id: string, patch: Partial<EditItem>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const submitQuote = (send: boolean) =>
    start(async () => {
      setError(null);
      const res = await saveQuote(request.id, {
        items: items.map((i) => ({
          id: i.id,
          drug_id: i.drug_id,
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price === "" ? null : Number(i.unit_price),
          is_available: i.is_available,
          pharmacist_note: i.pharmacist_note || null,
        })),
        removed,
        delivery_fee: Number(deliveryFee) || 0,
        pharmacist_note: note,
        send,
      });
      if (!res.ok) return setError(res.error);
      toast({ tone: "success", title: res.message ?? "Saved" });
      setRemoved([]);
      router.refresh();
    });

  const move = (status: RequestStatus, n?: string) =>
    start(async () => {
      setError(null);
      const res = await setRequestStatus(request.id, status, n);
      if (!res.ok) return setError(res.error);
      toast({ tone: "success", title: res.message ?? "Updated" });
      setDeclining(false);
      router.refresh();
    });

  const inputCls = "h-9 rounded-md bg-white px-2.5 text-sm ring-1 ring-inset ring-gray-300 outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-gray-50 disabled:text-gray-500";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-5 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{isEditable ? "Review & quote" : "Items"}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {isEditable ? "Confirm availability, set prices and suggest alternatives. Then send the quote." : "This order has been confirmed by the patient."}
          </p>
        </div>
        {isEditable && (
          <Button variant="secondary" size="sm" iconLeading={Plus} onClick={() => setAdding(true)}>
            Add item
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-600">
            <tr>
              <th className="min-w-[280px] px-4 py-3 sm:px-6">Item</th>
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3">Availability</th>
              <th className="px-3 py-3">Unit price (₦)</th>
              <th className="whitespace-nowrap px-3 py-3 text-right">Line total</th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((i) => (
              <tr key={i.id} className={cn(!i.is_available && "bg-gray-25")}>
                <td className="px-4 py-3 align-top sm:px-6">
                  <p className={cn("font-medium text-gray-900", !i.is_available && "text-gray-500 line-through")}>{i.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {i.stock ? <StockBadge qty={i.stock.stock_qty} threshold={i.stock.low_stock_threshold} showQty /> : <Badge color="blue">Not in catalogue</Badge>}
                    {i.id.startsWith("new-") && <Badge color="brand">Added by you</Badge>}
                  </div>
                  {isEditable ? (
                    <input
                      value={i.pharmacist_note}
                      onChange={(e) => update(i.id, { pharmacist_note: e.target.value })}
                      placeholder="Note to patient (e.g. substituted with generic)"
                      maxLength={300}
                      aria-label={`Note for ${i.name}`}
                      className={cn(inputCls, "mt-2 w-full")}
                    />
                  ) : (
                    i.pharmacist_note && <p className="mt-1 text-gray-600">↳ {i.pharmacist_note}</p>
                  )}
                </td>
                <td className="px-3 py-3 align-top">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={i.quantity}
                    disabled={!isEditable}
                    onChange={(e) => update(i.id, { quantity: Math.max(1, Math.min(999, Number(e.target.value) || 1)) })}
                    aria-label={`Quantity of ${i.name}`}
                    className={cn(inputCls, "w-16 tabular-nums")}
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="inline-flex rounded-lg ring-1 ring-inset ring-gray-300" role="radiogroup" aria-label={`Availability of ${i.name}`}>
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        role="radio"
                        aria-checked={i.is_available === v}
                        disabled={!isEditable}
                        onClick={() => update(i.id, { is_available: v })}
                        className={cn(
                          "h-9 px-3 text-sm font-semibold first:rounded-l-lg last:rounded-r-lg disabled:cursor-not-allowed",
                          i.is_available === v
                            ? v
                              ? "bg-success-50 text-success-700"
                              : "bg-error-50 text-error-700"
                            : "text-gray-500 hover:bg-gray-50",
                        )}
                      >
                        {v ? "Available" : "Unavailable"}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={i.unit_price}
                    disabled={!isEditable || !i.is_available}
                    onChange={(e) => update(i.id, { unit_price: e.target.value })}
                    placeholder="0"
                    aria-label={`Unit price of ${i.name}`}
                    className={cn(inputCls, "w-28 tabular-nums", isEditable && i.is_available && i.unit_price === "" && "ring-warning-300")}
                  />
                </td>
                <td className="px-3 py-3 text-right align-top font-medium text-gray-900">
                  {i.is_available ? formatNaira((Number(i.unit_price) || 0) * i.quantity) : "—"}
                </td>
                <td className="px-3 py-3 align-top">
                  {isEditable && items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setItems((xs) => xs.filter((x) => x.id !== i.id));
                        if (!i.id.startsWith("new-")) setRemoved((r) => [...r, i.id]);
                      }}
                      className="rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-error-600"
                      aria-label={`Remove ${i.name}`}
                    >
                      <Trash01 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 border-t border-gray-200 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Textarea
          label="Note to patient"
          name="pharmacist_note"
          rows={3}
          value={note}
          disabled={!isEditable}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. We substituted Augmentin with an equivalent generic to save you ₦4,000. Take with food."
          hint="Shown on the patient’s request page."
        />
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd className="font-medium text-gray-900">{formatNaira(totals.subtotal)}</dd></div>
          {(
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600">Delivery fee</dt>
              <dd>
                <input
                  type="number"
                  min={0}
                  value={deliveryFee}
                  disabled={!isEditable}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  aria-label="Delivery fee"
                  className={cn(inputCls, "w-28 text-right tabular-nums")}
                />
              </dd>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-gray-200 pt-3 text-base">
            <dt className="font-semibold text-gray-900">Total</dt>
            <dd className="font-semibold text-gray-900">{formatNaira(totals.total)}</dd>
          </div>
        </dl>
      </div>

      {error && <div className="px-4 pb-2 sm:px-6"><Alert tone="error" title={error} /></div>}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-25 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap gap-3">
          {["submitted", "reviewing", "quoted"].includes(request.status) && (
            <Button variant="destructive-secondary" iconLeading={XCircle} onClick={() => setDeclining(true)} disabled={pending}>
              Decline
            </Button>
          )}
          {["confirmed", "ready"].includes(request.status) && (
            <Button variant="secondary" onClick={() => move("cancelled")} disabled={pending}>Cancel order</Button>
          )}
        </div>
        <div className="flex flex-wrap gap-3 sm:justify-end">
          {request.status === "submitted" && (
            <Button variant="secondary" onClick={() => move("reviewing")} loading={pending}>Start review</Button>
          )}
          {isEditable && (
            <>
              <Button variant="secondary" iconLeading={Save01} onClick={() => submitQuote(false)} disabled={pending}>Save draft</Button>
              <Button iconLeading={Send01} onClick={() => submitQuote(true)} loading={pending}>
                {request.status === "quoted" ? "Update quote" : "Send quote"}
              </Button>
            </>
          )}
          {request.status === "quoted" && (
            <Button variant="secondary-color" iconLeading={PhoneCall01} onClick={() => move("confirmed")} disabled={pending}>
              Patient confirmed by phone
            </Button>
          )}
          {request.status === "confirmed" && (
            <Button iconLeading={Package} onClick={() => move("ready")} loading={pending}>
              Packed, ready for a rider
            </Button>
          )}
          {request.status === "ready" && (
            <Button iconLeading={Truck01} onClick={() => move("out_for_delivery")} loading={pending}>Handed to rider</Button>
          )}
          {request.status === "out_for_delivery" && (
            <>
              <Button variant="secondary" onClick={() => move("ready")} disabled={pending}>Delivery failed</Button>
              <Button iconLeading={CheckCircle} onClick={() => move("completed")} loading={pending}>Delivered & paid</Button>
            </>
          )}
        </div>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add an item" description="Add an alternative or extra item from your inventory.">
        {adding && (
          <DrugSearch
            onPick={(d) => {
              setItems((xs) => [
                ...xs,
                {
                  id: `new-${crypto.randomUUID()}`,
                  drug_id: d.id || null,
                  name: d.id && d.strength && !d.name.toLowerCase().includes(d.strength.toLowerCase()) ? `${d.name} · ${d.strength}` : d.name,
                  quantity: 1,
                  unit_price: d.id ? String(d.price) : "",
                  is_available: true,
                  pharmacist_note: "",
                  stock: d.id ? { stock_qty: d.stock_qty, low_stock_threshold: d.low_stock_threshold, price: d.price } : null,
                },
              ]);
              setAdding(false);
            }}
          />
        )}
      </Modal>

      <Modal
        open={declining}
        onClose={() => setDeclining(false)}
        icon={XCircle}
        tone="error"
        title="Decline this request?"
        description="The patient will see your reason. Be kind and suggest next steps."
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={() => setDeclining(false)}>Cancel</Button>
            <Button variant="destructive" size="lg" loading={pending} disabled={!declineNote.trim()} onClick={() => move("rejected", declineNote)}>Decline request</Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          name="decline"
          rows={4}
          required
          value={declineNote}
          onChange={(e) => setDeclineNote(e.target.value)}
          placeholder="e.g. The prescription image is unreadable. Please upload a clearer photo in a new request or book a consultation."
        />
      </Modal>
    </Card>
  );
}
