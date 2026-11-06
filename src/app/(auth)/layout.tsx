import Image from "next/image";
import { Logo } from "@/components/site/logo";
import { site } from "@/lib/config";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
        <p className="text-[13px] text-gray-500">
          {site.pcnNotice} {site.address}
        </p>
      </div>
      <div className="relative hidden p-4 lg:block">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-gray-200">
          <Image
            src="/images/hero-lagos-pharmacy.webp"
            alt="A pharmacist helping a customer choose medicine"
            fill
            priority
            sizes="50vw"
            className="object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
            <p className="max-w-md font-display text-4xl font-medium leading-[1.1] text-white">
              The same pharmacist you’d see at the counter, <em className="font-normal text-marigold-300">a message away.</em>
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-gray-200">
              {["Licensed by the PCN", "Pay on pickup or delivery", "Private chats"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-marigold-300" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
