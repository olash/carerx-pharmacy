import Link from "next/link";
import { site } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * CareRx mark: a softened apothecary cross with a marigold "dose" dot.
 * Drawn on a 32px grid so it stays crisp at favicon sizes.
 */
export function LogoMark({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className={inverted ? "fill-paper" : "fill-brand-600"} />
      <path
        d="M13.5 8.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v5h5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-5v5a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5v-5h-5A1.5 1.5 0 0 1 7 17v-2a1.5 1.5 0 0 1 1.5-1.5h5v-5Z"
        className={inverted ? "fill-brand-600" : "fill-paper"}
      />
      <circle cx="23.5" cy="8.5" r="2.5" className="fill-marigold-400" />
    </svg>
  );
}

export function Logo({
  href = "/",
  suffix,
  className,
  inverted,
}: {
  href?: string;
  suffix?: string;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-focus", className)}>
      <LogoMark inverted={inverted} />
      <span className={cn("whitespace-nowrap font-display text-[22px] font-semibold leading-none tracking-tight", inverted ? "text-paper" : "text-ink")}>
        {site.shortName}
        {suffix && (
          <span className={cn("ml-1.5 hidden font-sans text-sm font-medium tracking-normal min-[400px]:inline", inverted ? "text-brand-200" : "text-gray-500")}>
            {suffix}
          </span>
        )}
      </span>
    </Link>
  );
}
