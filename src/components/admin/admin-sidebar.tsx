"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FC } from "react";
import {
  BarChart01,
  CalendarCheck01,
  File06,
  Folder,
  LogOut01,
  Menu01,
  Package,
  Settings01,
  Users01,
  XClose,
  LinkExternal01,
} from "@untitledui/icons";
import { Logo } from "@/components/site/logo";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: FC<{ className?: string }>; badge?: number; adminOnly?: boolean; exact?: boolean };

export type SidebarProps = {
  name: string | null;
  email: string | null;
  role: "pharmacist" | "admin" | "patient";
  counts?: { needsReview: number; consultsToday: number; lowStock: number };
};

function navItems(counts: SidebarProps["counts"]): { title?: string; items: NavItem[] }[] {
  return [
    {
      items: [
        { href: "/admin", label: "Dashboard", icon: BarChart01, exact: true },
        { href: "/admin/requests", label: "Drug requests", icon: File06, badge: counts?.needsReview },
        { href: "/admin/consultations", label: "Consultations", icon: CalendarCheck01, badge: counts?.consultsToday },
      ],
    },
    {
      title: "Catalogue",
      items: [
        { href: "/admin/inventory", label: "Inventory", icon: Package, badge: counts?.lowStock },
        { href: "/admin/categories", label: "Categories", icon: Folder },
      ],
    },
    {
      title: "Pharmacy",
      items: [
        { href: "/admin/settings", label: "Settings & hours", icon: Settings01 },
        { href: "/admin/team", label: "Team", icon: Users01, adminOnly: true },
      ],
    },
  ];
}

function SidebarContent({ name, email, role, counts, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-6">
        <Logo href="/admin" suffix="Admin" />
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Admin">
        {navItems(counts).map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-6")}>
            {group.title && <p className="mb-2 px-3 text-xs font-semibold text-gray-500">{group.title}</p>}
            <ul className="flex flex-col gap-0.5">
              {group.items
                .filter((i) => !i.adminOnly || role === "admin")
                .map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-base font-semibold outline-none transition focus-visible:ring-focus",
                          active ? "bg-gray-50 text-gray-800" : "text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        <item.icon className={cn("size-5", active ? "text-gray-500" : "text-gray-400")} />
                        <span className="flex-1">{item.label}</span>
                        {!!item.badge && (
                          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
        <a
          href="/"
          target="_blank"
          className="mt-6 flex items-center gap-3 rounded-md px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50"
        >
          <LinkExternal01 className="size-5 text-gray-400" /> View pharmacy site
        </a>
      </nav>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 rounded-xl p-2 ring-1 ring-gray-200">
          <Avatar name={name ?? email} size="md" online />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-700">{name ?? "Staff"}</p>
            <p className="truncate text-sm capitalize text-gray-600">{role}</p>
          </div>
          <form action={signOut}>
            <input type="hidden" name="area" value="admin" />
            <button type="submit" className="rounded-md p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-500" aria-label="Log out">
              <LogOut01 className="size-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar(props: SidebarProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-gray-200 bg-white lg:block">
        <SidebarContent {...props} />
      </aside>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <Logo href="/admin" suffix="Admin" />
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50" aria-label="Open menu">
          <Menu01 className="size-6" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 animate-fade-in bg-gray-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(300px,85vw)] bg-white shadow-xl">
            <button type="button" onClick={() => setOpen(false)} className="absolute -right-12 top-3 rounded-lg p-2 text-white" aria-label="Close menu">
              <XClose className="size-6" />
            </button>
            <SidebarContent {...props} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export function AdminSidebarFallback() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-gray-200 bg-white lg:block">
        <div className="px-5 pt-6">
          <Logo href="/admin" suffix="Admin" />
        </div>
      </aside>
      <div className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
        <Logo href="/admin" suffix="Admin" />
      </div>
    </>
  );
}
