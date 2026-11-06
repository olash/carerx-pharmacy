"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck01, File06, LayoutAlt01, LogOut01, ChevronDown } from "@untitledui/icons";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { signOut } from "@/actions/auth";

export function AccountMenu({ name, email, isStaff }: { name: string | null; email: string | null; isStaff: boolean }) {
  const router = useRouter();
  return (
    <Dropdown
      label="Account"
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex items-center gap-2 rounded-lg p-1 pr-2 outline-none hover:bg-gray-50 focus-visible:ring-focus"
        >
          <Avatar name={name ?? email} size="sm" />
          <ChevronDown className="hidden size-4 text-gray-500 sm:block" />
          <span className="sr-only">Open account menu</span>
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
            <Avatar name={name ?? email} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-700">{name ?? "Your account"}</p>
              <p className="truncate text-sm text-gray-600">{email}</p>
            </div>
          </div>
          <div className="py-1">
            <DropdownItem icon={File06} onClick={() => (close(), router.push("/account"))}>
              My requests
            </DropdownItem>
            <DropdownItem icon={CalendarCheck01} onClick={() => (close(), router.push("/account?tab=consultations"))}>
              Consultations
            </DropdownItem>
            {isStaff && (
              <div className="px-1.5 py-px">
                <Link
                  href="/admin"
                  role="menuitem"
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  <LayoutAlt01 className="size-4" /> Pharmacy admin
                </Link>
              </div>
            )}
          </div>
          <form action={signOut} className="border-t border-gray-200 py-1">
            <DropdownItem icon={LogOut01} type="submit">
              Log out
            </DropdownItem>
          </form>
        </>
      )}
    </Dropdown>
  );
}
