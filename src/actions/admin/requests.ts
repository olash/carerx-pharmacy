"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, RequestStatus } from "@/lib/types";

const transitions: Record<RequestStatus, RequestStatus[]> = {
  submitted: ["reviewing", "quoted", "rejected", "cancelled"],
  reviewing: ["quoted", "rejected", "cancelled"],
  quoted: ["confirmed", "reviewing", "quoted", "rejected", "cancelled"],
  confirmed: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "ready"],
  completed: [],
  cancelled: [],
  rejected: [],
};

const revalidate = (id: string) => {
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin", "layout");
  revalidatePath(`/account/requests/${id}`);
};

async function current(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase.from("drug_requests").select("status, fulfilment").eq("id", id).single();
  return data;
}

export async function setRequestStatus(id: string, next: RequestStatus, note?: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const supabase = await createClient();
  const req = await current(supabase, id);
  if (!req) return { ok: false, error: "Request not found." };
  if (!transitions[req.status].includes(next)) return { ok: false, error: `Can’t move a ${req.status} request to ${next}.` };
  if (next === "out_for_delivery" && req.fulfilment !== "delivery") return { ok: false, error: "This is a pickup order." };
  if (next === "rejected" && !note?.trim()) return { ok: false, error: "Tell the patient why you’re declining." };

  const patch: { status: RequestStatus; reviewed_by?: string; pharmacist_note?: string } = { status: next };
  if (next === "reviewing") patch.reviewed_by = staff.id;
  if (note?.trim()) patch.pharmacist_note = note.trim().slice(0, 2000);
  const { error } = await supabase.from("drug_requests").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(id);
  return { ok: true, message: "Status updated." };
}

const quoteSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(), // existing uuid or "new-…"
      drug_id: z.uuid().nullable(),
      name: z.string().trim().min(1).max(160),
      quantity: z.number().int().min(1).max(999),
      unit_price: z.number().min(0).max(100_000_000).nullable(),
      is_available: z.boolean(),
      pharmacist_note: z.string().trim().max(300).nullable(),
    }),
  ).min(1, "A request needs at least one item."),
  removed: z.array(z.uuid()),
  delivery_fee: z.number().min(0).max(1_000_000),
  pharmacist_note: z.string().trim().max(2000),
  send: z.boolean(),
});

export async function saveQuote(id: string, input: z.input<typeof quoteSchema>): Promise<ActionResult> {
  const staff = await requireStaff();
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quote" };
  const q = parsed.data;
  const supabase = await createClient();
  const req = await current(supabase, id);
  if (!req) return { ok: false, error: "Request not found." };
  if (!["submitted", "reviewing", "quoted"].includes(req.status)) return { ok: false, error: "This request can no longer be edited." };

  if (q.send) {
    const missing = q.items.filter((i) => i.is_available && i.unit_price === null);
    if (missing.length) return { ok: false, error: `Add a price for: ${missing.map((m) => m.name).join(", ")}` };
    if (!q.items.some((i) => i.is_available)) return { ok: false, error: "Nothing is available — decline the request instead." };
  }

  if (q.removed.length) {
    const { error } = await supabase.from("drug_request_items").delete().in("id", q.removed).eq("request_id", id);
    if (error) return { ok: false, error: error.message };
  }

  const existing = q.items.filter((i) => !i.id.startsWith("new-"));
  const added = q.items.filter((i) => i.id.startsWith("new-"));
  for (const i of existing) {
    const { error } = await supabase
      .from("drug_request_items")
      .update({ quantity: i.quantity, unit_price: i.unit_price, is_available: i.is_available, pharmacist_note: i.pharmacist_note || null })
      .eq("id", i.id)
      .eq("request_id", id);
    if (error) return { ok: false, error: error.message };
  }
  if (added.length) {
    const { error } = await supabase.from("drug_request_items").insert(
      added.map((i) => ({
        request_id: id,
        drug_id: i.drug_id,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        is_available: i.is_available,
        pharmacist_note: i.pharmacist_note || null,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  const { error } = await supabase
    .from("drug_requests")
    .update({
      delivery_fee: req.fulfilment === "delivery" ? q.delivery_fee : 0,
      pharmacist_note: q.pharmacist_note || null,
      reviewed_by: staff.id,
      ...(q.send ? { status: "quoted" as const } : req.status === "submitted" ? { status: "reviewing" as const } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidate(id);
  return { ok: true, message: q.send ? "Quote sent to the patient." : "Draft saved." };
}
