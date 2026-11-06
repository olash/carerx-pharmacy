import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  size = "md",
  online,
  className,
}: {
  name: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}) {
  const dims = { xs: "size-6 text-xs", sm: "size-8 text-sm", md: "size-10 text-base", lg: "size-12 text-lg" }[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600 ring-1 ring-inset ring-black/[0.08]",
        dims,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 size-2.5 rounded-full ring-[1.5px] ring-white",
            online ? "bg-success-500" : "bg-gray-300",
          )}
        />
      )}
    </span>
  );
}
