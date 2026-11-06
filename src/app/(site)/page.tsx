import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ArrowUpRight, SearchLg } from "@untitledui/icons";
import { ButtonLink } from "@/components/ui/button";
import { DrugCard, DrugCardSkeleton } from "@/components/drug-card";
import { getCategoriesWithCounts, getFeaturedDrugs } from "@/lib/data/catalogue";
import { site } from "@/lib/config";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <HowItWorks />
      <section className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <SectionTitle
          kicker="On the shelf"
          title="Popular this week"
          action={
            <Link href="/drugs" className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-ink">
              Browse all medicines <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          }
        />
        <Suspense
          fallback={
            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 min-[460px]:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <DrugCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <FeaturedDrugs />
        </Suspense>
      </section>
      <Categories />
      <Pharmacist />
      <Faq />
      <ClosingCta />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function SectionTitle({ kicker, title, intro, action }: { kicker: string; title: string; intro?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-700">{kicker}</p>
        <h2 className="mt-3 font-display text-4xl font-medium leading-[1.1] text-ink md:text-5xl">{title}</h2>
        {intro && <p className="mt-4 text-lg leading-relaxed text-gray-600">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-700">
            <span className="h-px w-6 bg-brand-600" aria-hidden />
            <span className="hidden sm:inline">Community pharmacy ·</span> {site.branch}
          </p>
          <h1 className="mt-6 font-display text-[34px] font-medium leading-[1.04] text-ink min-[400px]:text-[40px] sm:text-6xl lg:text-[72px]">
            Your neighbourhood pharmacist, <em className="font-normal text-brand-700">now on your phone.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-700">
            Send a prescription or a list of what you need. A licensed pharmacist checks it, confirms the price, and we
            bring it to your door — you only pay when it arrives.
          </p>

          <form
            action="/drugs"
            className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-brand-600"
            role="search"
          >
            <SearchLg className="ml-3 size-5 shrink-0 text-gray-500" aria-hidden />
            <label htmlFor="hero-q" className="sr-only">
              Search medicines
            </label>
            <input
              id="hero-q"
              name="q"
              placeholder="Coartem, amlodipine, vitamin C…"
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-full bg-brand-600 px-5 text-[15px] font-semibold text-white outline-none transition hover:bg-brand-700 focus-visible:ring-focus"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px]">
            <Link
              href="/request"
              className="group inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-gray-300 underline-offset-[6px] hover:decoration-ink"
            >
              Send a prescription <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link href="/consult" className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-[6px] hover:text-ink hover:decoration-ink">
              Ask a pharmacist, free
            </Link>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 divide-x divide-gray-300 border-t border-gray-300 pt-6">
            {[
              ["PCN", "licensed premises"],
              ["30 min", "typical reply"],
              ["₦0", "to pay upfront"],
            ].map(([k, v]) => (
              <div key={k} className="px-3 first:pl-0 sm:px-4">
                <dt className="font-display text-2xl font-medium text-ink sm:text-3xl">{k}</dt>
                <dd className="mt-1 text-[13px] leading-snug text-gray-600">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="relative pb-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-gray-200 sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="/images/hero-lagos-pharmacy.webp"
              alt="A pharmacist showing a customer a box of medicine in a Lagos pharmacy"
              fill
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover object-[62%_center]"
            />
          </div>
          <figcaption className="absolute bottom-0 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur sm:left-auto sm:right-6 sm:max-w-xs">
            <span className="relative flex size-2.5 shrink-0" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success-500 opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success-500" />
            </span>
            <p className="text-sm leading-snug text-gray-700">
              <span className="font-semibold text-ink">A pharmacist is on duty now.</span> Most requests are checked within
              30 minutes.
            </p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Services() {
  const items = [
    {
      href: "/request",
      img: "/images/patient-at-home.webp",
      alt: "A woman at home ordering on her phone",
      title: "Send what you need",
      text: "Upload a prescription or type a list. We check every item, suggest safe alternatives and send you a quote.",
      cta: "Start a request",
      pos: "object-center",
    },
    {
      href: "/consult",
      img: "/images/pharmacist-portrait.webp",
      alt: "A pharmacist in a white coat",
      title: "Talk it through",
      text: "Book a free, private 20-minute chat about side effects, interactions or what to take for a minor ailment.",
      cta: "Book a chat",
      pos: "object-[50%_25%]",
    },
    {
      href: "/#how-it-works",
      img: "/images/care-at-home.webp",
      alt: "A carer going through medicines with an older man at home",
      title: "Delivered, then paid",
      text: "Same-day delivery across Lagos, or pick up in store. Pay by cash, transfer or POS when it reaches you.",
      cta: "How delivery works",
      pos: "object-center",
    },
  ];
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-24 md:px-8 md:pb-28 md:pt-32">
      <SectionTitle kicker="What we do" title="Everything your local chemist does — without the queue." />
      <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-3">
        {items.map((s) => (
          <Link key={s.title} href={s.href} className="group rounded-2xl outline-none focus-visible:ring-focus">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-200">
              <Image
                src={s.img}
                alt={s.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className={`object-cover transition duration-500 group-hover:scale-[1.03] ${s.pos}`}
              />
            </div>
            <h3 className="mt-6 font-display text-2xl font-medium text-ink">{s.title}</h3>
            <p className="mt-2 max-w-sm text-base leading-relaxed text-gray-600">{s.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-brand-700">
              {s.cta} <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Tell us what you need", "Search our shelf, type in anything we don’t list, and attach a photo of your prescription if you have one."],
    ["A pharmacist checks it", "We confirm what’s in stock, check doses and interactions, and send a quote. Nothing happens until you say yes."],
    ["Pick up or get it delivered", "Collect from the counter or have it brought to you the same day. Pay when it arrives — cash, transfer or POS."],
  ];
  return (
    <section id="how-it-works" className="scroll-mt-28 bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-marigold-300">How it works</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-[1.1] md:text-5xl">
              A real pharmacist reads every request. <em className="font-normal text-gray-400">Not a bot.</em>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-gray-300">
              You get the judgement of a professional who knows Nigerian brands, prices and what’s actually available this week —
              with the convenience of ordering from your phone.
            </p>
            <Link
              href="/request"
              className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-ink outline-none transition hover:bg-paper focus-visible:ring-focus"
            >
              Start a request <ArrowRight className="size-5" />
            </Link>
          </div>
          <ol className="flex flex-col">
            {steps.map(([title, text], i) => (
              <li key={title} className="grid grid-cols-[56px_1fr] gap-4 border-t border-white/15 py-8 last:border-b sm:grid-cols-[80px_1fr]">
                <span className="font-display text-4xl font-light text-marigold-300 sm:text-5xl">0{i + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-2 max-w-lg text-base leading-relaxed text-gray-300">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

async function FeaturedDrugs() {
  const drugs = await getFeaturedDrugs(8);
  return (
    <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 min-[460px]:grid-cols-2 lg:grid-cols-4 max-sm:[&>*:nth-child(n+5)]:hidden">
      {drugs.map((d) => (
        <DrugCard key={d.id} drug={d} />
      ))}
    </div>
  );
}

function Categories() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <SectionTitle kicker="Browse the shelf" title="Find it by what it’s for" />
        <Suspense fallback={<div className="mt-12 h-80 animate-pulse rounded-2xl bg-paper-2" />}>
          <CategoryDirectory />
        </Suspense>
      </div>
    </section>
  );
}

async function CategoryDirectory() {
  const categories = await getCategoriesWithCounts();
  return (
    <ul className="mt-12 grid border-t border-gray-300 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <li key={c.id} className="border-b border-gray-300">
          <Link
            href={`/drugs?category=${c.slug}`}
            className="group flex h-full items-center justify-between gap-4 py-6 outline-none focus-visible:bg-paper-2 sm:px-5"
          >
            <span>
              <span className="block font-display text-xl font-medium text-ink group-hover:underline group-hover:underline-offset-4">{c.name}</span>
              {c.description && <span className="mt-1 block text-sm text-gray-600">{c.description}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums text-gray-500">
              {c.count}
              <ArrowRight className="size-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Pharmacist() {
  const p = site.superintendent;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-gray-200 lg:order-last">
          <Image
            src="/images/pharmacist-portrait-2.webp"
            alt={`${p.name}, ${p.title}`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-top"
          />
        </div>
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-700">The people behind the counter</p>
          <blockquote className="mt-6 font-display text-3xl font-normal leading-[1.25] text-ink md:text-[40px]">“{p.quote}”</blockquote>
          <div className="mt-8 flex items-center gap-4">
            <span className="h-px w-10 bg-gray-400" aria-hidden />
            <div>
              <p className="font-semibold text-ink">{p.name}</p>
              <p className="text-sm text-gray-600">
                {p.title} · {p.registration}
              </p>
            </div>
          </div>
          <ul className="mt-12 grid gap-6 border-t border-gray-200 pt-8 sm:grid-cols-2">
            {[
              ["Genuine stock only", "Every product is NAFDAC-registered and bought from licensed distributors."],
              ["Prescriptions checked", "Prescription-only medicines are dispensed against a valid prescription — always."],
              ["Private by default", "Only our pharmacists see your requests, prescriptions and chats."],
              ["Here when you need us", `${site.storeHours}. In an emergency, call 112.`],
            ].map(([t, d]) => (
              <li key={t}>
                <p className="font-semibold text-ink">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    ["Do I need to pay online?", "No. Once a pharmacist confirms your quote, you pay on pickup or on delivery — cash, transfer or POS."],
    ["What if a medicine isn’t on your site?", "Type it into your list anyway. We’ll source it, or recommend a safe equivalent and explain the difference."],
    [
      "Which medicines need a prescription?",
      "Prescription-only medicines such as antibiotics and most blood-pressure and diabetes treatments. Upload a clear photo or PDF with your request and we’ll verify it.",
    ],
    ["How quickly will I hear back?", "Most requests are reviewed within 30 minutes during opening hours. Your request page updates live, and we may call to clarify."],
    ["Is my consultation private?", "Yes. Only you and our pharmacists can see your chat. We never share your health information."],
  ];
  return (
    <section className="border-t border-gray-200">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-700">Questions</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-[1.1] text-ink md:text-5xl">Before you order</h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-gray-600">
            Can’t find your answer? Call us on{" "}
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="font-semibold text-ink underline underline-offset-4">
              {site.phone}
            </a>{" "}
            or{" "}
            <Link href="/consult" className="font-semibold text-ink underline underline-offset-4">
              book a free chat
            </Link>
            .
          </p>
        </div>
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <span className="relative mt-1.5 size-4 shrink-0" aria-hidden>
                  <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-ink" />
                  <span className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-ink transition group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="mt-3 max-w-2xl pr-10 text-base leading-relaxed text-gray-600">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="px-4 pb-20 md:px-8 md:pb-28">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-brand-700">
        <div className="grid lg:grid-cols-2">
          <div className="relative z-10 px-6 py-14 sm:px-12 md:py-20">
            <h2 className="font-display text-4xl font-medium leading-[1.1] text-white md:text-5xl">
              Got a prescription? <em className="font-normal text-brand-200">Send it in two minutes.</em>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-brand-100">Snap a photo, add anything else you need, and we’ll take it from there.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/request"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-ink outline-none transition hover:bg-paper focus-visible:ring-focus"
              >
                Send a prescription <ArrowRight className="size-5" />
              </Link>
              <ButtonLink
                href="/consult"
                size="xl"
                variant="tertiary"
                className="rounded-full px-6 text-white ring-1 ring-inset ring-white/40 hover:bg-white/10 hover:text-white"
              >
                Ask a pharmacist first
              </ButtonLink>
            </div>
          </div>
          <div className="relative hidden min-h-[360px] lg:block">
            <Image src="/images/prescription-bottles.webp" alt="" fill sizes="50vw" className="object-cover object-[50%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-700 via-brand-700/10 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
