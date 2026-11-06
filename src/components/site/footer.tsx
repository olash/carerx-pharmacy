import Link from "next/link";
import { site } from "@/lib/config";
import { Logo } from "./logo";

const columns = [
  {
    title: "Pharmacy",
    links: [
      ["Browse medicines", "/drugs"],
      ["Send a prescription", "/request"],
      ["Ask a pharmacist", "/consult"],
      ["How it works", "/#how-it-works"],
    ],
  },
  {
    title: "Your account",
    links: [
      ["My requests", "/account"],
      ["My consultations", "/account?tab=consultations"],
      ["Create an account", "/signup"],
      ["Staff sign in", "/admin/login"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-gray-300">
      <div className="mx-auto max-w-7xl px-4 pt-16 md:px-8 md:pt-20">
        <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div className="max-w-sm">
            <Logo inverted />
            <p className="mt-5 text-[15px] leading-relaxed text-gray-400">{site.description}</p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gray-500">{c.title}</h3>
              <ul className="mt-5 flex flex-col gap-3 text-[15px]">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-gray-300 transition hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gray-500">Visit or call</h3>
            <address className="mt-5 flex flex-col gap-3 text-[15px] not-italic">
              <span className="text-gray-300">{site.address}</span>
              <span className="text-gray-400">{site.storeHours}</span>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="font-medium text-white hover:underline hover:underline-offset-4">
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="text-gray-300 hover:text-white">
                {site.email}
              </a>
            </address>
          </div>
        </div>
        <div className="flex flex-col gap-3 py-8 text-[13px] leading-relaxed text-gray-500 lg:flex-row lg:justify-between">
          <p>
            © <Year /> {site.name}. {site.pcnNotice} {site.premisesLicence}. Superintendent: {site.superintendent.name}.
          </p>
          <p>Information on this site doesn’t replace advice from your doctor. In an emergency, call 112.</p>
        </div>
      </div>
    </footer>
  );
}

async function Year() {
  "use cache";
  return new Date().getFullYear();
}
