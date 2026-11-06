"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { File06, SearchLg, Trash01, Truck01 } from "@untitledui/icons";
import { IlloEmptyBag } from "@/components/illustrations";
import { useRequestList } from "@/components/providers/request-list";
import { useToast } from "@/components/providers/toast";
import { AddCustomItem, QtyStepper } from "@/components/site/request-drawer";
import { DrugThumb } from "@/components/drug-thumb";
import { RxBadge } from "@/components/status";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileDropzone, fileExtension } from "@/components/ui/file-upload";
import { createClient } from "@/lib/supabase/client";
import { submitDrugRequest } from "@/actions/requests";
import { formatNaira } from "@/lib/utils";
import { site } from "@/lib/config";

export function RequestForm({
  userId,
  defaultPhone,
  deliveryFee,
}: {
  userId: string;
  defaultPhone: string;
  deliveryFee: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const { items, hydrated, setQty, remove, clear, needsPrescription, estimatedTotal } = useRequestList();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(defaultPhone);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<"idle" | "uploading" | "submitting">("idle");

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-gray-50" />;
  }

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          illustration={<IlloEmptyBag />}
          title="Your request list is empty"
          description="Browse the catalogue, or add any medicine by name below — our pharmacists will source it."
          actions={
            <div className="flex w-full max-w-md flex-col gap-4">
              <Link href="/drugs" className={buttonClasses("primary", "lg")}>
                <SearchLg className="size-5" /> Browse medicines
              </Link>
              <div className="rounded-xl bg-gray-50 p-4 text-left">
                <AddCustomItem />
              </div>
            </div>
          }
        />
      </Card>
    );
  }

  const total = estimatedTotal + deliveryFee;
  const hasUnpriced = items.some((i) => i.price === null);

  const submit = () => {
    setError(null);
    const fe: Record<string, string> = {};
    if (phone.replace(/\D/g, "").length < 7) fe.phone = "Enter a phone number we can reach you on";
    if (address.trim().length < 8) fe.address = "Enter your full delivery address";
    if (needsPrescription && !file) fe.prescription = "Upload your prescription for the Rx items";
    setFieldErrors(fe);
    if (Object.keys(fe).length) {
      setError("Please fix the highlighted fields.");
      return;
    }

    startTransition(async () => {
      let prescriptionPath: string | null = null;
      if (file) {
        setStage("uploading");
        const supabase = createClient();
        const path = `${userId}/${crypto.randomUUID()}.${fileExtension(file)}`;
        const { error: upErr } = await supabase.storage.from("prescriptions").upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (upErr) {
          setStage("idle");
          setError("We couldn’t upload your prescription. Check your connection and try again.");
          return;
        }
        prescriptionPath = path;
      }
      setStage("submitting");
      const res = await submitDrugRequest({
        fulfilment: "delivery",
        deliveryAddress: address,
        contactPhone: phone,
        note,
        prescriptionPath,
        items: items.map((i) => ({ drugId: i.drugId, name: i.name, qty: i.qty })),
      });
      setStage("idle");
      if (!res.ok) {
        setError(res.error);
        return;
      }
      clear();
      toast({ tone: "success", title: "Request sent!", description: "A pharmacist will review it shortly." });
      router.push(`/account/requests/${res.data.id}?new=1`);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-6">
        {/* Items */}
        <Card>
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">Medicines</h2>
            <p className="mt-1 text-sm text-gray-600">Adjust quantities or add anything else you need.</p>
          </div>
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-6">
                <DrugThumb name={item.name} form={item.form} className="size-12 shrink-0 rounded-lg" size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-600">
                        {item.requiresRx && <RxBadge />}
                        {item.detail && <span>{item.detail}</span>}
                        {item.price !== null && <span>· {formatNaira(item.price)} each</span>}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-sm font-semibold text-gray-900">
                      {item.price === null ? <span className="font-medium text-gray-500">To be quoted</span> : formatNaira(item.price * item.qty)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <QtyStepper value={item.qty} onChange={(n) => setQty(item.key, n)} label={item.name} />
                    <button
                      type="button"
                      onClick={() => remove(item.key)}
                      className="inline-flex items-center gap-1 rounded-md p-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-error-700"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash01 className="size-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-200 bg-gray-25 px-4 py-4 sm:px-6">
            <AddCustomItem />
          </div>
        </Card>

        {/* Prescription */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                Prescription {needsPrescription ? <span className="text-brand-600">*</span> : <span className="text-sm font-normal text-gray-500">(optional)</span>}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {needsPrescription
                  ? "Items marked Rx need a valid prescription from a licensed prescriber. A clear photo is fine."
                  : "Have a prescription? Upload it and we’ll match everything on it."}
              </p>
            </div>
            <File06 className="size-6 shrink-0 text-gray-400" />
          </div>
          <div className="mt-4">
            <FileDropzone file={file} onChange={setFile} invalid={!!fieldErrors.prescription} id="prescription" />
            {fieldErrors.prescription && <p className="mt-2 text-sm text-error-600">{fieldErrors.prescription}</p>}
          </div>
        </Card>

        {/* Delivery */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Where should we deliver?</h2>
              <p className="mt-1 text-sm text-gray-600">
                {site.serviceArea}. Same-day for orders confirmed before 3pm · delivery {formatNaira(deliveryFee)}.
              </p>
            </div>
            <Truck01 className="size-6 shrink-0 text-gray-400" />
          </div>

          <div className="mt-6 grid gap-5">
            <Textarea
              label="Delivery address"
              name="address"
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House number, street, area, nearest bus stop / landmark"
              error={fieldErrors.address}
            />
            <Input
              label="Phone number"
              name="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0803 123 4567"
              hint="Our pharmacist may call you to clarify your request."
              error={fieldErrors.phone}
            />
            <Textarea
              label="Note for the pharmacist"
              name="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Allergies, current medications, preferred brands, or anything we should know."
              maxLength={2000}
            />
          </div>
        </Card>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Items ({items.reduce((n, i) => n + i.qty, 0)})</dt>
              <dd className="font-medium text-gray-900">{formatNaira(estimatedTotal)}</dd>
            </div>
            {hasUnpriced && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Unlisted items</dt>
                <dd className="font-medium text-gray-500">To be quoted</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-600">Delivery</dt>
              <dd className="font-medium text-gray-900">{formatNaira(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
              <dt className="font-semibold text-gray-900">Estimated total</dt>
              <dd className="font-semibold text-gray-900">{formatNaira(total)}</dd>
            </div>
          </dl>
          {error && <Alert tone="error" title={error} className="mt-5" />}
          <Button size="xl" className="mt-6 w-full" onClick={submit} loading={pending}>
            {stage === "uploading" ? "Uploading prescription…" : stage === "submitting" ? "Sending…" : "Send request"}
          </Button>
          <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500">
            <p>No payment now. A pharmacist reviews your request and sends a final quote for you to confirm.</p>
            <p>Pay with cash, transfer or POS when your order is delivered.</p>
          </div>
        </Card>
        <Label className="sr-only">Request summary</Label>
      </aside>
    </div>
  );
}
