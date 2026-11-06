"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const safeNext = (next: unknown, fallback: string) => {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
};

export async function signIn(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const area = formData.get("area") === "admin" ? "admin" : "site";
  if (!email || !password) return { ok: false, error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: "That email and password combination didn’t work." };

  if (area === "admin") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (!profile || (profile.role !== "admin" && profile.role !== "pharmacist")) {
      await supabase.auth.signOut();
      return { ok: false, error: "This account doesn’t have staff access. Ask an admin to invite you." };
    }
    redirect(safeNext(formData.get("next"), "/admin"));
  }

  redirect(safeNext(formData.get("next"), "/account"));
}

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number, e.g. 0803 123 4567")
    .or(z.string().trim().regex(/^\+?[0-9 ]{8,16}$/, "Enter a valid phone number")),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function signUp(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = signUpSchema.safeParse({ ...raw, phone: String(raw.phone ?? "").replace(/\s+/g, "") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const { email, password, full_name, phone } = parsed.data;
  const supabase = await createClient();
  const next = safeNext(formData.get("next"), "/account");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    return { ok: false, error: error.message.includes("registered") ? "An account with this email already exists. Try logging in." : error.message };
  }
  if (!data.session) {
    return { ok: true, message: "Check your inbox — we sent you a link to confirm your email." };
  }
  redirect(next);
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(formData.get("area") === "admin" ? "/admin/login" : "/");
}
