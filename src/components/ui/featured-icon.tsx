import type { FC } from "react";
import { cn } from "@/lib/utils";

type Color = "brand" | "gray" | "error" | "warning" | "success" | "blue";

const light: Record<Color, string> = {
  brand: "bg-brand-100 text-brand-600 ring-brand-50",
  gray: "bg-gray-100 text-gray-500 ring-gray-50",
  error: "bg-error-100 text-error-600 ring-error-50",
  warning: "bg-warning-100 text-warning-600 ring-warning-50",
  success: "bg-success-100 text-success-600 ring-success-50",
  blue: "bg-blue-100 text-blue-600 ring-blue-50",
};

/** Untitled UI "Featured icon" — light circle with outer ring, or modern outlined square. */
export function FeaturedIcon({
  icon: Icon,
  color = "brand",
  size = "md",
  theme = "light",
  className,
}: {
  icon: FC<{ className?: string }>;
  color?: Color;
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "light" | "modern";
  className?: string;
}) {
  const dims = { sm: "size-8", md: "size-10", lg: "size-12", xl: "size-14" }[size];
  const icon = { sm: "size-4", md: "size-5", lg: "size-6", xl: "size-7" }[size];
  const ring = { sm: "ring-4", md: "ring-[6px]", lg: "ring-8", xl: "ring-[10px]" }[size];

  if (theme === "modern") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg bg-white text-gray-700 shadow-xs ring-1 ring-inset ring-gray-200",
          dims,
          className,
        )}
      >
        <Icon className={icon} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full", dims, ring, light[color], className)}>
      <Icon className={icon} />
    </span>
  );
}
