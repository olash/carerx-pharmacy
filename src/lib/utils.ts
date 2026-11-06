import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { site } from "./config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const naira = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: site.currency,
  maximumFractionDigits: 0,
});

export function formatNaira(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return naira.format(Number(value));
}

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(site.locale, {
    timeZone: site.timezone,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat(site.locale, {
    timeZone: site.timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export type StockLevel = "in_stock" | "low_stock" | "out_of_stock";

export function stockLevel(qty: number, threshold: number): StockLevel {
  if (qty <= 0) return "out_of_stock";
  if (qty <= threshold) return "low_stock";
  return "in_stock";
}

/** Escape user input for use inside a PostgREST `ilike` filter. */
export function escapeLike(value: string) {
  return value.replace(/[%_,()\\]/g, (c) => `\\${c}`);
}
