"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Lightweight disclosure-style dropdown (Untitled "dropdown menu" look). */
export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  className?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      {open && (
        <div
          id={id}
          role="menu"
          aria-label={label}
          className={cn(
            "absolute top-full z-50 mt-2 min-w-60 animate-fade-in overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  icon: Icon,
  children,
  className,
  ...props
}: { icon?: React.FC<{ className?: string }>; children: ReactNode; className?: string } & React.ComponentProps<"button">) {
  return (
    <div className="px-1.5 py-px">
      <button
        type="button"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium text-gray-700 outline-none hover:bg-gray-50 focus-visible:bg-gray-50",
          className,
        )}
        {...props}
      >
        {Icon && <Icon className="size-4 text-gray-500" />}
        {children}
      </button>
    </div>
  );
}
