import Link from "next/link";
import { cn } from "@/lib/utils";

/** Untitled "button-gray" tab list rendered as links (URL-driven). */
export function TabLinks({
  tabs,
  active,
  className,
}: {
  tabs: { href: string; label: string; key: string; count?: number }[];
  active: string;
  className?: string;
}) {
  return (
    <nav className={cn("-mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-none", className)} aria-label="Tabs">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition outline-none focus-visible:ring-focus",
              isActive ? "bg-gray-50 text-gray-700 ring-1 ring-gray-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                  isActive ? "bg-white text-gray-700 ring-gray-200" : "bg-gray-50 text-gray-700 ring-gray-200",
                )}
              >
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
