import Link from "next/link";
import { Suspense } from "react";
import { getProfile, getSessionUser, isStaffRole } from "@/lib/auth";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { signOut } from "@/actions/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "./logo";
import { AccountMenu } from "./account-menu";
import { RequestListButton } from "./request-list-button";
import { MobileNav } from "./mobile-nav";
import { site } from "@/lib/config";

export const navLinks = [
  { href: "/drugs", label: "Medicines" },
  { href: "/request", label: "Send a prescription" },
  { href: "/consult", label: "Ask a pharmacist" },
  { href: "/#how-it-works", label: "How it works" },
];

async function MobileNavAuth() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <>
        <Link href="/signup" className={buttonClasses("primary", "lg")}>Sign up</Link>
        <Link href="/login" className={buttonClasses("secondary", "lg")}>Log in</Link>
      </>
    );
  }
  return (
    <>
      <p className="truncate text-sm text-gray-600">Signed in as <span className="font-medium text-gray-900">{user.email}</span></p>
      <Link href="/account" className={buttonClasses("primary", "lg")}>My account</Link>
      <form action={signOut}>
        <button type="submit" className={buttonClasses("secondary", "lg", "w-full")}>Log out</button>
      </form>
    </>
  );
}

async function HeaderAccount() {
  const [user, profile] = await Promise.all([getSessionUser(), getProfile()]);
  if (!user) {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <Link href="/login" className="px-2 text-[15px] font-medium text-gray-700 hover:text-ink">
          Log in
        </Link>
        <ButtonLink href="/signup" className="rounded-full px-4">Create account</ButtonLink>
      </div>
    );
  }
  return <AccountMenu name={profile?.full_name ?? null} email={user.email ?? null} isStaff={isStaffRole(profile?.role)} />;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="hidden border-b border-gray-200/70 bg-paper md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-6 px-4 text-[13px] text-gray-600 md:px-8">
          <p className="flex items-center gap-2 truncate">
            <span className="size-1.5 shrink-0 rounded-full bg-success-500" aria-hidden />
            Pharmacist on duty · {site.openingShort}
          </p>
          <p className="hidden shrink-0 items-center gap-5 lg:flex">
            <span>{site.address}</span>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="font-medium text-gray-900 underline-offset-4 hover:underline">
              {site.phone}
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:h-[72px] md:px-8">
        <MobileNav links={navLinks} auth={<Suspense fallback={null}><MobileNavAuth /></Suspense>} />
        <Logo />
        <nav className="ml-8 hidden items-center gap-7 lg:flex" aria-label="Main">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-sm text-[15px] font-medium text-gray-700 outline-none transition hover:text-ink focus-visible:ring-focus"
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
