import Link from "next/link";
import { Suspense } from "react";
import { getProfile, getSessionUser, isStaffRole } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "./logo";
import { AccountMenu } from "./account-menu";
import { RequestListButton } from "./request-list-button";
import { MobileNav } from "./mobile-nav";
import { site } from "@/lib/config";

export const navLinks = [
  { href: "/drugs", label: "Medicines" },
  { href: "/consult", label: "Talk to a pharmacist" },
  { href: "/#how-it-works", label: "How it works" },
];

async function HeaderAccount() {
  const [user, profile] = await Promise.all([getSessionUser(), getProfile()]);
  if (!user) {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <ButtonLink href="/login" variant="tertiary">
          Log in
        </ButtonLink>
        <ButtonLink href="/signup">Sign up</ButtonLink>
      </div>
    );
  }
  return <AccountMenu name={profile?.full_name ?? null} email={user.email ?? null} isStaff={isStaffRole(profile?.role)} />;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="hidden bg-brand-700 text-brand-50 sm:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs font-medium md:px-8">
          <span>{site.pcnNotice} Pay on pickup or delivery.</span>
          <span className="opacity-90">
            {site.storeHours} · <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="underline-offset-2 hover:underline">{site.phone}</a>
          </span>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:h-[72px] md:px-8">
        <MobileNav links={navLinks} />
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-base font-semibold text-gray-600 outline-none hover:text-gray-900 focus-visible:ring-focus"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <RequestListButton />
          <Suspense fallback={<Skeleton className="h-10 w-28" />}>
            <HeaderAccount />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
