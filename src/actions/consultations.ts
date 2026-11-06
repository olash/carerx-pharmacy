"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

const bookSchema = z.object({
  scheduledAt: z.iso.datetime({ offset: true }),
  topic: z.string().trim().min(1, "Choose a topic").max(120),
  details: z.string().max(2000).optional().default(""),
});

export async function bookConsultation(input: z.input<typeof bookSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_consultation", {
    p_scheduled_at: parsed.data.scheduledAt,
    p_topic: parsed.data.topic,
    p_details: parsed.data.details,
  });
  if (error || !data) return { ok: false, error: friendlyError(error) };
  revalidatePath("/account");
  return { ok: true, data: { id: data } };
}

export async function cancelConsultation(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("patient_cancel_consultation", { p_id: id });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/account/consultations/${id}`);
  revalidatePath("/account");
  return { ok: true, message: "Consultation cancelled." };
}
