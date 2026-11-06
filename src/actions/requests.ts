"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

const schema = z.object({
  fulfilment: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().max(500).optional().default(""),
  contactPhone: z.string().trim().min(7, "Enter a phone number we can reach you on").max(32),
  note: z.string().max(2000).optional().default(""),
  prescriptionPath: z.string().max(300).nullable(),
  items: z
    .array(
      z.object({
        drugId: z.uuid().nullable(),
        name: z.string().trim().max(120),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Add at least one medicine")
    .max(50),
});

export async function submitDrugRequest(input: z.input<typeof schema>): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  const d = parsed.data;
  if (d.fulfilment === "delivery" && d.deliveryAddress.trim().length < 8) {
    return { ok: false, error: "Enter your full delivery address.", fieldErrors: { deliveryAddress: "Enter your full delivery address" } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_drug_request", {
    p_fulfilment: d.fulfilment,
    p_delivery_address: d.deliveryAddress,
    p_contact_phone: d.contactPhone,
    p_patient_note: d.note,
    p_prescription_path: d.prescriptionPath as string,
    p_items: d.items.map((i) => ({ drug_id: i.drugId, name: i.name, quantity: i.qty })),
  });
  if (error || !data) return { ok: false, error: friendlyError(error) };

  revalidatePath("/account");
  return { ok: true, data: { id: data } };
}

export async function patientRequestAction(requestId: string, action: "confirm" | "cancel"): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("patient_request_action", { p_request_id: requestId, p_action: action });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/account/requests/${requestId}`);
  return { ok: true, message: action === "confirm" ? "Quote confirmed — we’re preparing your order." : "Request cancelled." };
}
