/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

const palettes = [
  { bg: "bg-brand-50", fg: "text-brand-600", accent: "fill-brand-200" },
  { bg: "bg-blue-50", fg: "text-blue-600", accent: "fill-blue-200" },
  { bg: "bg-warning-50", fg: "text-warning-600", accent: "fill-warning-200" },
  { bg: "bg-purple-50", fg: "text-purple-700", accent: "fill-purple-200" },
  { bg: "bg-error-50", fg: "text-error-600", accent: "fill-error-200" },
  { bg: "bg-success-50", fg: "text-success-600", accent: "fill-success-200" },
  { bg: "bg-indigo-50", fg: "text-indigo-700", accent: "fill-indigo-200" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function FormGlyph({ form, className, accent }: { form: string; className?: string; accent: string }) {
  const f = form.toLowerCase();
  if (/(syrup|suspension|bottle|solution)/.test(f))
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <rect x="17" y="6" width="14" height="6" rx="1.5" className={accent} />
        <path d="M15 16a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v24a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V16Z" stroke="currentColor" strokeWidth="2" />
        <rect x="18" y="22" width="12" height="11" rx="1.5" className={accent} />
      </svg>
    );
  if (/(inject|insulin|vial)/.test(f))
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <rect x="18" y="5" width="12" height="5" rx="1.5" className={accent} />
        <path d="M17 14h14v26a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V14Z" stroke="currentColor" strokeWidth="2" />
        <path d="M17 24h14" stroke="currentColor" strokeWidth="2" />
        <rect x="19" y="26" width="10" height="10" rx="1" className={accent} />
      </svg>
    );
  if (/(gel|cream|ointment)/.test(f))
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <path d="M14 10h20l-3 30H17L14 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <rect x="19" y="4" width="10" height="6" rx="1.5" className={accent} />
        <path d="M17 22h14" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  if (/(device|monitor|kit|strip|bandage|inhaler)/.test(f))
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
        <rect x="9" y="12" width="30" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="17" width="20" height="9" rx="2" className={accent} />
        <circle cx="24" cy="31" r="2" fill="currentColor" />
      </svg>
    );
  // tablets / capsules (default)
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <g transform="rotate(-40 24 24)">
        <rect x="8" y="17" width="32" height="14" rx="7" stroke="currentColor" strokeWidth="2" />
        <path d="M24 17h9a7 7 0 0 1 0 14h-9V17Z" className={accent} />
      </g>
    </svg>
  );
}

export function DrugThumb({
  name,
  form,
  imageUrl,
  className,
  size = "md",
}: {
  name: string;
  form?: string | null;
  imageUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const p = palettes[hash(name) % palettes.length]!;
  const glyph = { sm: "size-6", md: "size-14", lg: "size-24" }[size];
  if (imageUrl) {
    return (
      <div className={cn("overflow-hidden bg-gray-50", className)}>
        <img src={imageUrl} alt="" className="size-full object-contain" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-center", p.bg, p.fg, className)} aria-hidden>
      <FormGlyph form={form ?? ""} className={glyph} accent={p.accent} />
    </div>
  );
}
