"use client";

 
import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash01 } from "@untitledui/icons";
import { saveDrug, deleteDrug } from "@/actions/admin/inventory";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/providers/toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { DrugThumb } from "@/components/drug-thumb";
import { fileExtension } from "@/components/ui/file-upload";
import type { Category, Drug } from "@/lib/types";

const forms = ["Tablet", "Capsule", "Syrup", "Suspension", "Injection", "Cream", "Gel", "Ointment", "Drops", "Inhaler", "Sachet", "Effervescent tablet", "Dispersible tablet", "Test kit", "Test strips", "Device", "Bandage", "Other"];

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-b border-gray-200 py-6 last:border-0 lg:grid-cols-[280px_1fr] lg:gap-8">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      <div className="flex max-w-2xl flex-col gap-5">{children}</div>
    </section>
  );
}

export function DrugForm({ drug, categories }: { drug?: Drug; categories: Category[] }) {
  const [state, action, pending] = useActionState(saveDrug, null);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  const [imageUrl, setImageUrl] = useState(drug?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(drug?.name ?? "");
  const [form, setForm] = useState(drug?.dosage_form ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const upload = async (file: File) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return toast({ tone: "error", title: "Use a PNG, JPG or WEBP image." });
    if (file.size > 5 * 1024 * 1024) return toast({ tone: "error", title: "Images must be under 5MB." });
    setUploading(true);
    const supabase = createClient();
    const path = `drugs/${crypto.randomUUID()}.${fileExtension(file)}`;
    const { error } = await supabase.storage.from("drug-images").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return toast({ tone: "error", title: "Upload failed", description: error.message });
    setImageUrl(supabase.storage.from("drug-images").getPublicUrl(path).data.publicUrl);
  };

  return (
    <form action={action}>
      {drug && <input type="hidden" name="id" value={drug.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />
      {state && !state.ok && <Alert tone="error" title={state.error} className="mb-2" />}

      <Section title="Product details" description="How the medicine appears to patients on the website.">
        <Input label="Name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emzor Paracetamol 500mg" error={fe.name} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Generic name" name="generic_name" defaultValue={drug?.generic_name ?? ""} placeholder="Paracetamol" error={fe.generic_name} />
          <Input label="Brand / manufacturer" name="brand" defaultValue={drug?.brand ?? ""} placeholder="Emzor" error={fe.brand} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Category" name="category_id" defaultValue={drug?.category_id ?? ""} error={fe.category_id}>
            <option value="">Uncategorised</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select label="Dosage form" name="dosage_form" value={form} onChange={(e) => setForm(e.target.value)}>
            <option value="">Select…</option>
            {[...new Set([...(drug?.dosage_form ? [drug.dosage_form] : []), ...forms])].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Strength" name="strength" defaultValue={drug?.strength ?? ""} placeholder="500mg" error={fe.strength} />
          <Input label="Pack size" name="pack_size" defaultValue={drug?.pack_size ?? ""} placeholder="10 x 10 tablets" error={fe.pack_size} />
        </div>
      </Section>

      <Section title="Photo" description="Optional. A clean pack shot on a white background works best. Without one we show a neat placeholder.">
        <div className="flex items-start gap-5">
          <DrugThumb name={name || "New medicine"} form={form} imageUrl={imageUrl || null} size="sm" className="size-24 shrink-0 rounded-xl ring-1 ring-gray-200" />
          <div className="flex flex-col gap-3">
            <label className={buttonClasses("secondary", "md", "cursor-pointer")}>
              <ImagePlus className="size-5" /> {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
            </label>
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl("")} className="text-left text-sm font-semibold text-gray-600 hover:text-error-700">
                Remove image
              </button>
            )}
            <p className="text-sm text-gray-500">PNG, JPG or WEBP · max 5MB</p>
          </div>
        </div>
      </Section>

      <Section title="Pricing & stock" description="Shelf price in Naira. Pharmacists can still adjust the price on each quote.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Input label="Price (₦)" name="price" type="number" min={0} step="0.01" required defaultValue={drug ? Number(drug.price) : ""} placeholder="1200" error={fe.price} />
          <Input label="In stock" name="stock_qty" type="number" min={0} step={1} required defaultValue={drug?.stock_qty ?? 0} error={fe.stock_qty} />
          <Input label="Low stock alert at" name="low_stock_threshold" type="number" min={0} step={1} defaultValue={drug?.low_stock_threshold ?? 10} error={fe.low_stock_threshold} />
        </div>
      </Section>

      <Section title="Regulatory" description="Prescription-only medicines require patients to upload a prescription before they can submit.">
        <Toggle name="requires_prescription" defaultChecked={drug?.requires_prescription ?? false} label="Prescription required (Rx)" hint="Patients must upload a valid prescription." />
        <Input label="NAFDAC registration no." name="nafdac_no" defaultValue={drug?.nafdac_no ?? ""} placeholder="A4-0233" error={fe.nafdac_no} wrapperClassName="max-w-xs" />
      </Section>

      <Section title="Information" description="Shown on the medicine page. Keep it short and plain-English.">
        <Textarea label="Description" name="description" rows={3} defaultValue={drug?.description ?? ""} placeholder="What it’s used for" error={fe.description} />
        <Textarea label="How to use" name="usage_notes" rows={3} defaultValue={drug?.usage_notes ?? ""} placeholder="Typical adult dosage and key warnings" error={fe.usage_notes} />
      </Section>

      <Section title="Visibility" description="Hidden medicines stay in your inventory but don’t appear on the website.">
        <Toggle name="is_active" defaultChecked={drug?.is_active ?? true} label="Show on website" />
      </Section>

      <div className="sticky bottom-0 -mx-4 mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
        <div>
          {drug && (
            <Button variant="destructive-secondary" iconLeading={Trash01} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Link href="/admin/inventory" className={buttonClasses("secondary")}>Cancel</Link>
          <Button type="submit" loading={pending} disabled={uploading}>
            {drug ? "Save changes" : "Add medicine"}
          </Button>
        </div>
      </div>

      {drug && (
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          icon={Trash01}
          tone="error"
          title={`Delete ${drug.name}?`}
          description="This can’t be undone. To stop selling it but keep its history, switch off “Show on website” instead."
          footer={
            <>
              <Button variant="secondary" size="lg" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button
                variant="destructive"
                size="lg"
                loading={deleting}
                onClick={async () => {
                  setDeleting(true);
                  const res = await deleteDrug(drug.id);
                  setDeleting(false);
                  if (!res.ok) return toast({ tone: "error", title: res.error });
                  toast({ tone: "success", title: "Medicine deleted" });
                  router.push("/admin/inventory");
                }}
              >
                Delete
              </Button>
            </>
          }
        />
      )}
    </form>
  );
}
