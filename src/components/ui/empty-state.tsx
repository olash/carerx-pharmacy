import type { FC, ReactNode } from "react";
import { FeaturedIcon } from "./featured-icon";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
}: {
  icon: FC<{ className?: string }>;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col items-center px-4 py-12 text-center", className)}>
      {/* Untitled "background pattern" circles */}
      <svg
        className="pointer-events-none absolute left-1/2 top-0 -z-0 size-[320px] -translate-x-1/2 -translate-y-[90px] text-gray-200"
        viewBox="0 0 320 320"
        fill="none"
        aria-hidden
      >
        {[48, 80, 112, 144].map((r, i) => (
          <circle key={r} cx="160" cy="160" r={r} stroke="currentColor" strokeOpacity={1 - i * 0.25} />
        ))}
      </svg>
      <FeaturedIcon icon={icon} theme="modern" size="lg" className="relative" />
      <h3 className="relative mt-4 text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="relative mt-1 max-w-sm text-sm text-gray-600">{description}</p>}
      {actions && <div className="relative mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
