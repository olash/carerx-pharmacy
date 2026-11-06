import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="relative overflow-x-auto">
      <table className={cn("w-full min-w-[640px] text-left text-sm", className)} {...props} />
    </div>
  );
}
export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-b border-gray-200 bg-gray-50", className)} {...props} />;
}
export function Th({ className, ...props }: ComponentProps<"th">) {
  return <th className={cn("whitespace-nowrap px-6 py-3 text-xs font-medium text-gray-600", className)} {...props} />;
}
export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-6 py-4 align-middle text-gray-600", className)} {...props} />;
}
export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-b border-gray-200 last:border-0", className)} {...props} />;
}
