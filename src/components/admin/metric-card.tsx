import Link from "next/link";
import type { FC } from "react";
import { ArrowRight } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/ui/featured-icon";

export function MetricCard({
  label,
  value,
  icon,
  href,
  hint,
  tone = "gray",
}: {
  label: string;
  value: number | string;
  icon: FC<{ className?: string }>;
  href?: string;
  hint?: string;
  tone?: "gray" | "brand" | "warning" | "error";
}) {
  return (
    <div className="flex flex-col rounded-xl bg-white shadow-xs ring-1 ring-gray-200">
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-display-sm font-semibold text-gray-900">{value}</p>
          {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
        </div>
        <FeaturedIcon icon={icon} theme={tone === "gray" ? "modern" : "light"} color={tone === "gray" ? "gray" : tone} size="md" />
      </div>
      {href && (
        <Link href={href} className="mt-auto flex items-center justify-end gap-1.5 border-t border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:text-gray-900">
          View <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
