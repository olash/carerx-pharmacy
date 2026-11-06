import { CheckVerified02 } from "@untitledui/icons";
import { Logo } from "@/components/site/logo";
import { Avatar } from "@/components/ui/avatar";
import { site } from "@/lib/config";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
        <p className="text-sm text-gray-500">© {site.name}</p>
      </div>
      <div className="relative hidden overflow-hidden bg-brand-950 lg:flex lg:flex-col lg:justify-end lg:p-16">
        <svg className="absolute inset-0 h-full w-full text-white/5" aria-hidden>
          <defs>
            <pattern id="auth-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M56 0H0V56" fill="none" stroke="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
        <div className="relative">
          <blockquote className="text-display-sm font-medium text-white">
            “I sent my prescription at lunch and my meds were at my door before 5pm. The pharmacist even called to explain the dosage.”
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <Avatar name="Tolu Adeyemi" size="lg" className="bg-brand-100 text-brand-800" />
            <div>
              <p className="text-lg font-semibold text-white">Tolu Adeyemi</p>
              <p className="text-base text-brand-200">Patient, Lekki</p>
            </div>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-4 text-sm text-brand-100">
            {["Licensed pharmacists", "Pay on delivery", "Private consultations", "Genuine medicines"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckVerified02 className="size-5 text-brand-300" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
