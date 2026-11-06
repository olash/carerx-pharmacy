import Link from "next/link";
import type { ComponentProps, ReactNode, FC, SVGProps } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "secondary-color"
  | "tertiary"
  | "link-gray"
  | "link-color"
  | "destructive"
  | "destructive-secondary";
type Size = "sm" | "md" | "lg" | "xl";
type Icon = FC<SVGProps<SVGSVGElement>> | FC<{ className?: string }>;

const base =
  "group relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition duration-100 ease-linear outline-none focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-xs ring-1 ring-inset ring-brand-700/40 hover:bg-brand-700 [box-shadow:inset_0_0_0_1px_rgba(16,24,40,0.18),inset_0_-2px_0_0_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.05)]",
  secondary:
    "bg-white text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-gray-800",
  "secondary-color":
    "bg-brand-50 text-brand-700 shadow-xs ring-1 ring-inset ring-brand-200 hover:bg-brand-100 hover:text-brand-800",
  tertiary: "text-gray-600 hover:bg-gray-50 hover:text-gray-700",
  "link-gray": "h-auto! p-0! text-gray-600 hover:text-gray-700",
  "link-color": "h-auto! p-0! text-brand-700 hover:text-brand-800",
  destructive:
    "bg-error-600 text-white shadow-xs hover:bg-error-700 focus-visible:ring-focus-error [box-shadow:inset_0_0_0_1px_rgba(16,24,40,0.18),inset_0_-2px_0_0_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.05)]",
  "destructive-secondary":
    "bg-white text-error-700 shadow-xs ring-1 ring-inset ring-error-300 hover:bg-error-50 hover:text-error-800 focus-visible:ring-focus-error",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-3.5 text-sm",
  lg: "h-11 px-4 text-base",
  xl: "h-12 px-[18px] text-base",
};

const iconSizes: Record<Size, string> = { sm: "size-4", md: "size-5", lg: "size-5", xl: "size-5" };

type Common = {
  variant?: Variant;
  size?: Size;
  iconLeading?: Icon;
  iconTrailing?: Icon;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

function Inner({ iconLeading: L, iconTrailing: T, loading, size = "md", children }: Common) {
  return (
    <>
      {loading ? (
        <svg className={cn(iconSizes[size], "animate-spin")} viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" />
          <path d="M18 10a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : (
        L && <L className={cn(iconSizes[size], "shrink-0 opacity-90")} aria-hidden />
      )}
      {children && <span className="px-0.5">{children}</span>}
      {T && <T className={cn(iconSizes[size], "shrink-0 opacity-90")} aria-hidden />}
    </>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  iconLeading,
  iconTrailing,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: Common & Omit<ComponentProps<"button">, keyof Common>) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <Inner iconLeading={iconLeading} iconTrailing={iconTrailing} loading={loading} size={size}>
        {children}
      </Inner>
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  iconLeading,
  iconTrailing,
  className,
  children,
  ...props
}: Common & Omit<ComponentProps<typeof Link>, keyof Common>) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      <Inner iconLeading={iconLeading} iconTrailing={iconTrailing} size={size}>
        {children}
      </Inner>
    </Link>
  );
}
