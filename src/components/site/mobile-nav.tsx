"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu01, XClose } from "@untitledui/icons";
import { Logo } from "./logo";

export function MobileNav({ links, auth }: { links: { href: string; label: string }[]; auth?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Lock page scroll and close on Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 rounded-lg p-2 text-gray-500 outline-none hover:bg-gray-50 focus-visible:ring-focus lg:hidden"
        aria-label="Open menu"
      >
        <Menu01 className="size-6" />
      </button>
      {/* Portal to <body>: the header's backdrop-blur would otherwise trap this fixed overlay inside the header. */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in bg-gray-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(320px,85vw)] animate-slide-in-left flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50" aria-label="Close menu">
                <XClose className="size-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-md px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-gray-50">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div
              className="mt-auto flex flex-col gap-3 border-t border-gray-200 p-4"
              onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
              onSubmit={() => setTimeout(() => setOpen(false), 0)}
            >
              {auth}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
