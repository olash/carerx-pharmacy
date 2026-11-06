import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  CalendarCheck01,
  CheckVerified02,
  ChevronDown,
  File06,
  MessageChatCircle,
  SearchLg,
  ShieldTick,
  ShoppingBag03,
  Truck01,
  Wallet02,
} from "@untitledui/icons";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeaturedIcon } from "@/components/ui/featured-icon";
import { Avatar } from "@/components/ui/avatar";
import { DrugCard, DrugCardSkeleton } from "@/components/drug-card";
import { categoryIcon } from "@/components/category-icon";
import { getCategories, getFeaturedDrugs } from "@/lib/data/catalogue";
import { site } from "@/lib/config";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <SectionHeading
          eyebrow="Shop by need"
          title="Find what you need, fast"
          description="Browse by category or search over our full shelf. Every request is checked by a licensed pharmacist."
          action={<ButtonLink href="/drugs" variant="secondary" iconTrailing={ArrowRight}>All medicines</ButtonLink>}
        />
        <Suspense fallback={<CategoryGridSkeleton />}>
          <CategoryGrid />
        </Suspense>
      </section>
      <HowItWorks />
      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <SectionHeading
          eyebrow="In stock now"
          title="Popular at the counter"
          description="Prices shown are our current shelf prices. Your pharmacist confirms the final quote."
          action={<ButtonLink href="/drugs?availability=in_stock" variant="secondary" iconTrailing={ArrowRight}>See all in stock</ButtonLink>}
        />
        <Suspense fallback={<div className="mt-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <DrugCardSkeleton key={i} />)}</div>}>
          <FeaturedDrugs />
        </Suspense>
      </section>
      <ConsultBand />
      <Faq />
      <CtaBand />
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-brand-700 md:text-base">{eyebrow}</p>
        <h2 className="mt-3 text-display-sm font-semibold text-gray-900 md:text-display-md">{title}</h2>
        <p className="mt-4 text-lg text-gray-600 md:text-xl">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-25 to-white">
      <svg className="pointer-events-none absolute inset-0 h-full w-full text-brand-100/70 [mask-image:radial-gradient(60%_60%_at_70%_30%,black,transparent)]" aria-hidden>
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-2 lg:gap-16">
        <div>
          <Link
            href="/consult"
            className="group inline-flex items-center gap-3 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-medium text-brand-700 shadow-xs ring-1 ring-inset ring-brand-200 hover:bg-brand-25"
          >
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 ring-1 ring-inset ring-brand-200">New</span>
            Chat with a pharmacist today
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
          <h1 className="mt-6 text-display-md font-semibold text-gray-900 sm:text-display-lg lg:text-display-xl">
            Your medicines, checked by a pharmacist.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-gray-600 md:text-xl">
            Send a drug request, upload your prescription and we’ll confirm availability and price. Pick up in store or get
            it delivered — you only pay when it arrives.
          </p>
          <form action="/drugs" className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search medicines</span>
              <SearchLg className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
              <input
                name="q"
                placeholder="Search e.g. Coartem, Amlodipine, Vitamin C"
                className="h-12 w-full rounded-lg bg-white pl-11 pr-4 text-base text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-brand-600"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-600 px-5 text-base font-semibold text-white shadow-xs hover:bg-brand-700 focus-visible:ring-focus outline-none"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <ButtonLink href="/request" variant="link-color" iconLeading={File06}>
              Upload a prescription
            </ButtonLink>
            <ButtonLink href="/consult" variant="link-gray" iconLeading={MessageChatCircle}>
              Book a free consultation
            </ButtonLink>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
      <div className="absolute -right-8 -top-8 size-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="relative rounded-2xl bg-white p-5 shadow-xl ring-1 ring-gray-200 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Request</p>
            <p className="text-lg font-semibold text-gray-900">RQ-1042</p>
          </div>
          <Badge color="warning" dot size="md">Quote ready</Badge>
        </div>
        <ul className="mt-5 divide-y divide-gray-200 rounded-xl ring-1 ring-gray-200">
          {[
            ["Coartem 80/480", "1 × pack", "₦8,500", true],
            ["Amoxicillin 500mg", "2 × 20 caps", "₦6,400", true],
            ["Vitamin C 1000mg", "1 × tube", "₦3,900", true],
          ].map(([n, q, p]) => (
            <li key={String(n)} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <CheckVerified02 className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{n}</p>
                  <p className="text-xs text-gray-500">{q}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900">{p}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Total · pay on delivery</p>
          <p className="text-xl font-semibold text-gray-900">₦18,800</p>
        </div>
        <div className="mt-4 h-11 rounded-lg bg-brand-600 text-center text-base font-semibold leading-[44px] text-white">Confirm quote</div>
      </div>
      <div className="relative -mt-6 ml-auto w-[85%] rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-200 sm:-mr-6 lg:-mr-10">
        <div className="flex items-start gap-3">
          <Avatar name="Ada Okafor" size="md" online />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-700">
              Pharm. Ada <span className="font-normal text-gray-500">· 2 min ago</span>
            </p>
            <p className="mt-1 rounded-lg rounded-tl-none bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200">
              Take Coartem with a fatty meal or milk, twice daily for 3 days. Finish the full course even if you feel better. 💊
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  const items = [
    { icon: ShieldTick, title: "Licensed pharmacists", text: site.pcnNotice },
    { icon: Wallet02, title: "Pay on pickup or delivery", text: "No card needed online" },
    { icon: Truck01, title: "Same-day delivery", text: "Across Lagos for orders before 3pm" },
    { icon: CheckVerified02, title: "Genuine medicines", text: "NAFDAC-registered stock only" },
  ];
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-4">
            <FeaturedIcon icon={Icon} theme="modern" size="lg" />
            <div>
              <p className="text-base font-semibold text-gray-900">{title}</p>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function CategoryGrid() {
  const categories = await getCategories();
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
      {categories.map((c) => {
        const Icon = categoryIcon(c.slug);
        return (
          <Link
            key={c.id}
            href={`/drugs?category=${c.slug}`}
            className="group flex flex-col gap-4 rounded-xl bg-white p-4 shadow-xs ring-1 ring-gray-200 outline-none transition hover:bg-gray-25 hover:ring-brand-300 focus-visible:ring-focus md:p-5"
          >
            <FeaturedIcon icon={Icon} size="md" />
            <div>
              <p className="text-sm font-semibold text-gray-900 md:text-base">{c.name}</p>
              {c.description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{c.description}</p>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-50 ring-1 ring-gray-200" />
      ))}
    </div>
  );
}

async function FeaturedDrugs() {
  const drugs = await getFeaturedDrugs(8);
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:gap-6 lg:grid-cols-4">
      {drugs.map((d) => (
        <DrugCard key={d.id} drug={d} />
      ))}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: ShoppingBag03,
      title: "Build your request",
      text: "Add medicines from our catalogue or type in anything you need. Upload a prescription for Rx-only items.",
    },
    {
      icon: CheckVerified02,
      title: "A pharmacist reviews it",
      text: "We check your prescription, confirm what’s in stock, suggest safe alternatives and send you a quote.",
    },
    {
      icon: Truck01,
      title: "Pick up or get it delivered",
      text: "Confirm the quote and choose pickup or delivery. Pay with cash, transfer or POS when it gets to you.",
    },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-brand-700 md:text-base">How it works</p>
          <h2 className="mt-3 text-display-sm font-semibold text-gray-900 md:text-display-md">Three steps. No queues.</h2>
          <p className="mt-4 text-lg text-gray-600 md:text-xl">
            The care of your neighbourhood pharmacist, with the convenience of ordering from your phone.
          </p>
        </div>
        <ol className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative flex flex-col items-center text-center">
              <FeaturedIcon icon={Icon} size="lg" />
              <span className="mt-5 text-sm font-semibold text-brand-700">Step {i + 1}</span>
              <h3 className="mt-1 text-xl font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 max-w-sm text-base text-gray-600">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex justify-center">
          <ButtonLink href="/request" size="xl" iconTrailing={ArrowRight}>
            Start a request
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function ConsultBand() {
  const points = [
    "Medication questions, side effects and interactions",
    "Advice on minor ailments and what to take",
    "Help understanding your prescription",
    "Free — no payment needed to book",
  ];
  return (
    <section className="bg-brand-950">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-brand-300 md:text-base">Online consultations</p>
          <h2 className="mt-3 text-display-sm font-semibold text-white md:text-display-md">Talk to a pharmacist, privately.</h2>
          <p className="mt-4 text-lg text-brand-100 md:text-xl">
            Pick a time that suits you and chat one-on-one with a licensed pharmacist from your phone or laptop.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-base text-brand-50">
                <CheckVerified02 className="mt-0.5 size-6 shrink-0 text-brand-300" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/consult" size="xl" iconLeading={CalendarCheck01} className="bg-white text-brand-800 hover:bg-brand-50">
              Book a consultation
            </ButtonLink>
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-6" aria-hidden>
          <div className="rounded-xl bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-gray-900">Choose a time</p>
            <p className="text-sm text-gray-600">20-minute chat · Africa/Lagos</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {["Mon 10", "Tue 11", "Wed 12", "Thu 13", "Fri 14"].map((d, i) => (
                <div key={d} className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ring-1 ${i === 1 ? "bg-brand-600 text-white ring-brand-600" : "text-gray-700 ring-gray-200"}`}>
                  {d.split(" ")[0]}
                  <span className="block text-base">{d.split(" ")[1]}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["9:00", "9:20", "9:40", "10:00", "10:20", "11:40"].map((t, i) => (
                <div key={t} className={`rounded-lg py-2 text-center text-sm font-semibold ring-1 ${i === 3 ? "bg-brand-50 text-brand-700 ring-brand-300" : i === 1 ? "text-gray-300 line-through ring-gray-100" : "text-gray-700 ring-gray-200"}`}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    ["Do I need to pay online?", "No. Once a pharmacist confirms your quote, you pay on pickup or on delivery — cash, transfer or POS."],
    ["What if a medicine isn’t in your catalogue?", "Type it into your request list. Our pharmacists will source it or recommend a safe, equivalent alternative."],
    ["Which medicines need a prescription?", "Prescription-only medicines (marked Rx) such as antibiotics and blood pressure drugs need a valid prescription from a licensed prescriber. Upload a clear photo or PDF with your request."],
    ["How long does review take?", "Most requests are reviewed within 30 minutes during opening hours. You’ll see live status updates in your account."],
    ["Is my consultation private?", "Yes. Only you and our pharmacists can see your chat. We never share your health information."],
  ];
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 md:px-8 md:py-24">
      <div className="text-center">
        <h2 className="text-display-sm font-semibold text-gray-900 md:text-display-md">Frequently asked questions</h2>
        <p className="mt-4 text-lg text-gray-600 md:text-xl">Everything you need to know about ordering and consultations.</p>
      </div>
      <div className="mt-12 divide-y divide-gray-200">
        {faqs.map(([q, a]) => (
          <details key={q} className="group py-6 first:pt-0">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
              {q}
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ring-2 ring-gray-400 text-gray-400 transition group-open:rotate-180">
                <ChevronDown className="size-4" />
              </span>
            </summary>
            <p className="mt-2 pr-12 text-base text-gray-600">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
      <div className="flex flex-col gap-8 rounded-2xl bg-gray-50 px-6 py-10 md:flex-row md:items-center md:justify-between md:p-16">
        <div>
          <h2 className="text-display-xs font-semibold text-gray-900 md:text-display-sm">Got a prescription to fill?</h2>
          <p className="mt-3 text-lg text-gray-600 md:text-xl">Snap it, upload it, and we’ll handle the rest.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/consult" variant="secondary" size="xl">Ask a pharmacist</ButtonLink>
          <ButtonLink href="/request" size="xl">Upload prescription</ButtonLink>
        </div>
      </div>
    </section>
  );
}
