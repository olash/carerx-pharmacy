import "server-only";
import { connection } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { escapeLike } from "@/lib/utils";
import type { Category, Drug } from "@/lib/types";

export type DrugWithCategory = Drug & { category: Pick<Category, "name" | "slug"> | null };

export const PAGE_SIZE = 24;

export async function getCategories(): Promise<Category[]> {
  await connection();
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name");
  if (error) throw error;
  return data;
}

export async function searchDrugs({
  q,
  category,
  availability,
  rx,
  page = 1,
}: {
  q?: string;
  category?: string;
  availability?: "in_stock";
  rx?: "otc" | "rx";
  page?: number;
}) {
  await connection();
  const supabase = createPublicClient();
  let query = supabase
    .from("drugs")
    .select("*, category:categories(name, slug)", { count: "exact" })
    .eq("is_active", true);

  if (q?.trim()) {
    const term = escapeLike(q.trim());
    query = query.or(`name.ilike.%${term}%,generic_name.ilike.%${term}%,brand.ilike.%${term}%`);
  }
  if (category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", category).maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (availability === "in_stock") query = query.gt("stock_qty", 0);
  if (rx === "otc") query = query.eq("requires_prescription", false);
  if (rx === "rx") query = query.eq("requires_prescription", true);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order("name").order("id").range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { drugs: data as DrugWithCategory[], total: count ?? 0 };
}

export async function getFeaturedDrugs(limit = 8) {
  await connection();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("drugs")
    .select("*, category:categories(name, slug)")
    .eq("is_active", true)
    .gt("stock_qty", 0)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as DrugWithCategory[];
}

export async function getDrugBySlug(slug: string) {
  await connection();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("drugs")
    .select("*, category:categories(name, slug)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as DrugWithCategory | null;
}

export async function getRelatedDrugs(drug: Drug, limit = 4) {
  if (!drug.category_id) return [];
  await connection();
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("drugs")
    .select("*, category:categories(name, slug)")
    .eq("is_active", true)
    .eq("category_id", drug.category_id)
    .neq("id", drug.id)
    .limit(limit);
  return (data ?? []) as DrugWithCategory[];
}
