import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeColor = "gray" | "brand" | "error" | "warning" | "success" | "blue" | "indigo" | "purple";

const colors: Record<BadgeColor, { pill: string; dot: string }> = {
  gray: { pill: "bg-gray-50 text-gray-700 ring-gray-200", dot: "bg-gray-500" },
  brand: { pill: "bg-brand-50 text-brand-700 ring-brand-200", dot: "bg-brand-500" },
  error: { pill: "bg-error-50 text-error-700 ring-error-200", dot: "bg-error-500" },
  warning: { pill: "bg-warning-50 text-warning-700 ring-warning-200", dot: "bg-warning-500" },
  success: { pill: "bg-success-50 text-success-700 ring-success-200", dot: "bg-success-500" },
  blue: { pill: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  indigo: { pill: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-700" },
  purple: { pill: "bg-purple-50 text-purple-700 ring-purple-200", dot: "bg-purple-700" },
};

export function Badge({
  color = "gray",
  dot,
  size = "sm",
  className,
  children,
}: {
  color?: BadgeColor;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-sm",
        colors[color].pill,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", colors[color].dot)} aria-hidden />}
      {children}
    </span>
  );
}
