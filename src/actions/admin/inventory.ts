"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const drugSchema = z.object({
  name: z.string().trim().min(2, "Enter the product name").max(160),
  generic_name: optionalText(160),
  brand: optionalText(120),
  category_id: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.uuid().nullable()),
  dosage_form: optionalText(60),
  strength: optionalText(60),
  pack_size: optionalText(60),
  price: z.coerce.number({ error: "Enter a price" }).min(0, "Price can’t be negative").max(100_000_000),
  stock_qty: z.coerce.number().int("Whole numbers only").min(0, "Stock can’t be negative").max(1_000_000),
  low_stock_threshold: z.coerce.number().int().min(0).max(100_000),
  requires_prescription: z.boolean(),
  is_active: z.boolean(),
  nafdac_no: optionalText(40),
  description: optionalText(4000),
  usage_notes: optionalText(4000),
  image_url: optionalText(1000),
});

function revalidateCatalogue(slug?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/drugs");
  revalidatePath("/");
  if (slug) revalidatePath(`/drugs/${slug}`);
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, base: string, excludeId?: string) {
  const root = slugify(base) || "medicine";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    let q = supabase.from("drugs").select("id").eq("slug", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function saveDrug(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "") || null;
  const raw = Object.fromEntries(formData);
  const parsed = drugSchema.safeParse({
    ...raw,
    requires_prescription: formData.get("requires_prescription") === "on",
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  let slug: string;
  if (id) {
    const { data: existing } = await supabase.from("drugs").select("slug").eq("id", id).single();
    slug = existing?.slug ?? (await uniqueSlug(supabase, parsed.data.name, id));
    const { error } = await supabase.from("drugs").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    slug = await uniqueSlug(supabase, [parsed.data.name, parsed.data.strength].filter(Boolean).join(" "));
    const { error } = await supabase.from("drugs").insert({ ...parsed.data, slug });
    if (error) return { ok: false, error: error.message };
  }

  revalidateCatalogue(slug);
  redirect(`/admin/inventory?saved=${encodeURIComponent(parsed.data.name)}`);
}

export async function deleteDrug(id: string): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("drugs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCatalogue();
  return { ok: true, message: "Medicine deleted." };
}

export async function setStock(id: string, qty: number): Promise<ActionResult> {
  await requireStaff();
  if (!Number.isInteger(qty) || qty < 0 || qty > 1_000_000) return { ok: false, error: "Enter a whole number of 0 or more." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("drugs").update({ stock_qty: qty }).eq("id", id).select("slug").single();
  if (error) return { ok: false, error: error.message };
  revalidateCatalogue(data.slug);
  return { ok: true, message: "Stock updated." };
}

export async function setActive(id: string, active: boolean): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.from("drugs").update({ is_active: active }).eq("id", id).select("slug").single();
  if (error) return { ok: false, error: error.message };
  revalidateCatalogue(data.slug);
  return { ok: true, message: active ? "Now visible on the site." : "Hidden from the site." };
}

const importRow = z.object({
  name: z.string().trim().min(2).max(160),
  generic_name: optionalText(160),
  brand: optionalText(120),
  category: z.string().trim().optional().default(""),
  dosage_form: optionalText(60),
  strength: optionalText(60),
  pack_size: optionalText(60),
  price: z.coerce.number().min(0),
  stock_qty: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(10),
  requires_prescription: z
    .string()
    .optional()
    .default("")
    .transform((v) => /^(y|yes|true|1|rx)$/i.test(v.trim())),
  is_active: z
    .string()
    .optional()
    .default("yes")
    .transform((v) => !/^(n|no|false|0|hidden)$/i.test(v.trim())),
  nafdac_no: optionalText(40),
  description: optionalText(4000),
  usage_notes: optionalText(4000),
  slug: z.string().trim().optional().default(""),
});

export async function importDrugs(
  rows: Record<string, string>[],
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  await requireStaff();
  if (rows.length === 0) return { ok: false, error: "The file has no rows." };
  if (rows.length > 2000) return { ok: false, error: "Import up to 2,000 rows at a time." };
  const supabase = await createClient();

  const { data: cats } = await supabase.from("categories").select("id, name, slug");
  const catByKey = new Map<string, string>();
  for (const c of cats ?? []) {
    catByKey.set(c.slug.toLowerCase(), c.id);
    catByKey.set(c.name.toLowerCase(), c.id);
  }
  const { data: existing } = await supabase.from("drugs").select("id, slug");
  const existingSlugs = new Set((existing ?? []).map((d) => d.slug));

  const errors: string[] = [];
  const upserts: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const parsed = importRow.safeParse(row);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!;
      errors.push(`Row ${i + 2}: ${String(issue.path[0] ?? "")} — ${issue.message}`);
      return;
    }
    const { category, slug: givenSlug, ...rest } = parsed.data;
    const slug = slugify(givenSlug || [rest.name, rest.strength].filter(Boolean).join(" "));
    if (seen.has(slug)) {
      errors.push(`Row ${i + 2}: duplicate of an earlier row (${slug})`);
      return;
    }
    seen.add(slug);
    const category_id = category ? catByKey.get(category.toLowerCase()) ?? null : null;
    if (category && !category_id) errors.push(`Row ${i + 2}: unknown category “${category}” — imported without a category`);
    upserts.push({ ...rest, slug, category_id });
  });

  if (upserts.length) {
    const { error } = await supabase.from("drugs").upsert(upserts as never, { onConflict: "slug" });
    if (error) return { ok: false, error: error.message };
  }
  const created = upserts.filter((u) => !existingSlugs.has(u.slug as string)).length;
  revalidateCatalogue();
  return { ok: true, data: { created, updated: upserts.length - created, errors } };
}
