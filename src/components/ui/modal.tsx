"use client";

import { useEffect, useRef, type FC, type ReactNode } from "react";
import { XClose } from "@untitledui/icons";
import { FeaturedIcon } from "./featured-icon";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  tone = "brand",
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: FC<{ className?: string }>;
  tone?: "brand" | "error" | "warning" | "success";
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-auto w-[calc(100%-32px)] max-w-md rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-950/60 backdrop:backdrop-blur-sm open:animate-fade-in",
        className,
      )}
    >
      {open && (
        <div className="relative p-4 sm:p-6">
          <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-500" aria-label="Close">
            <XClose className="size-6" />
          </button>
          {icon && <FeaturedIcon icon={icon} color={tone} size="lg" />}
          <h2 className={cn("text-lg font-semibold text-gray-900", icon && "mt-4")}>{title}</h2>
          {description && <div className="mt-1 text-sm text-gray-600">{description}</div>}
          {children && <div className="mt-5">{children}</div>}
          {footer && <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
