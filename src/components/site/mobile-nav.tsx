"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu01, XClose } from "@untitledui/icons";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "./logo";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

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
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in bg-gray-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(320px,85vw)] flex-col bg-white shadow-xl">
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
              <Link href="/account" className="rounded-md px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-gray-50">
                My account
              </Link>
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-gray-200 p-4" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
              <Link href="/signup" className={buttonClasses("primary", "lg")}>
                Sign up
              </Link>
              <Link href="/login" className={buttonClasses("secondary", "lg")}>
                Log in
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
