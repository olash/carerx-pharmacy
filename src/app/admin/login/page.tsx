import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";
import { LogoMark } from "@/components/site/logo";
import { Badge } from "@/components/ui/badge";
import { site } from "@/lib/config";

export const metadata: Metadata = { title: "Staff sign in" };

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-12">
      <svg className="pointer-events-none absolute left-1/2 top-0 size-[768px] -translate-x-1/2 -translate-y-1/3 text-gray-200" viewBox="0 0 768 768" fill="none" aria-hidden>
        {[96, 160, 224, 288, 352].map((r, i) => (
          <circle key={r} cx="384" cy="384" r={r} stroke="currentColor" strokeOpacity={1 - i * 0.18} />
        ))}
      </svg>
      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-12" />
          <Badge color="brand" className="mt-6">Staff portal</Badge>
          <h1 className="mt-3 text-display-xs font-semibold text-gray-900">Sign in to {site.shortName} Admin</h1>
          <p className="mt-2 text-base text-gray-600">Manage inventory, review requests and run consultations.</p>
        </div>
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <LoginForm area="admin" />
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Not staff? <Link href="/" className="font-semibold text-brand-700 hover:text-brand-800">Go to the pharmacy site</Link>
        </p>
      </div>
    </div>
  );
}
