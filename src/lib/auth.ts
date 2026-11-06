import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Data Access Layer for auth. `getUser` validates the JWT with Supabase Auth
 * (getClaims verifies the signature locally when asymmetric keys are used).
 */
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

export async function requireProfile(next?: string): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return profile;
}

export function isStaffRole(role: Profile["role"] | undefined | null) {
  return role === "pharmacist" || role === "admin";
}

export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  if (!isStaffRole(profile.role)) redirect("/admin/login?error=forbidden");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireStaff();
  if (profile.role !== "admin") redirect("/admin?error=admin-only");
  return profile;
}
