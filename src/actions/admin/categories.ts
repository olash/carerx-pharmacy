"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  description: z.string().trim().max(240).optional().default(""),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

const revalidate = () => {
  revalidatePath("/admin/categories");
  revalidatePath("/drugs");
  revalidatePath("/");
};

export async function saveCategory(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const payload = { ...parsed.data, description: parsed.data.description || null };
  const { error } = id
    ? await supabase.from("categories").update(payload).eq("id", id)
    : await supabase.from("categories").insert({ ...payload, slug: slugify(parsed.data.name) });
  if (error) return { ok: false, error: error.code === "23505" ? "A category with that name already exists." : error.message };
  revalidate();
  return { ok: true, message: id ? "Category updated." : "Category added." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, message: "Category deleted. Its medicines are now uncategorised." };
}
