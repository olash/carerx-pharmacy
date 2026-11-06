import Link from "next/link";
import { site } from "@/lib/config";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <path d="M13 8h6v5h5v6h-5v5h-6v-5H8v-6h5V8Z" fill="white" />
      <path d="M24 13v6h-5v5" fill="none" stroke="#5FE9D0" strokeWidth="0" />
    </svg>
  );
}

export function Logo({ href = "/", suffix, className }: { href?: string; suffix?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-focus", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-gray-900">
        {site.shortName}
        <span className="font-normal text-gray-500"> {suffix ?? "Pharmacy"}</span>
      </span>
    </Link>
  );
}
