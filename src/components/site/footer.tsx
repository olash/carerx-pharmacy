import Link from "next/link";
import { Mail01, MarkerPin01, Phone } from "@untitledui/icons";
import { site } from "@/lib/config";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-16">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-base text-gray-600">{site.description}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Pharmacy</h3>
          <ul className="mt-4 flex flex-col gap-3 text-base font-semibold text-gray-600">
            <li><Link href="/drugs" className="hover:text-gray-900">Browse medicines</Link></li>
            <li><Link href="/request" className="hover:text-gray-900">Send a request</Link></li>
            <li><Link href="/consult" className="hover:text-gray-900">Book a consultation</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Account</h3>
          <ul className="mt-4 flex flex-col gap-3 text-base font-semibold text-gray-600">
            <li><Link href="/account" className="hover:text-gray-900">My requests</Link></li>
            <li><Link href="/account?tab=consultations" className="hover:text-gray-900">My consultations</Link></li>
            <li><Link href="/admin/login" className="hover:text-gray-900">Staff login</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Visit or call</h3>
          <ul className="mt-4 flex flex-col gap-3 text-base text-gray-600">
            <li className="flex gap-2"><MarkerPin01 className="mt-0.5 size-5 shrink-0 text-gray-400" />{site.address}</li>
            <li className="flex gap-2"><Phone className="mt-0.5 size-5 shrink-0 text-gray-400" /><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-gray-900">{site.phone}</a></li>
            <li className="flex gap-2"><Mail01 className="mt-0.5 size-5 shrink-0 text-gray-400" /><a href={`mailto:${site.email}`} className="hover:text-gray-900">{site.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-gray-500 md:flex-row md:justify-between md:px-8">
          <p>© <Year /> {site.name}. {site.pcnNotice}</p>
          <p>Information on this site does not replace advice from your doctor. In an emergency call 112.</p>
        </div>
      </div>
    </footer>
  );
}

async function Year() {
  "use cache";
  return new Date().getFullYear();
}
