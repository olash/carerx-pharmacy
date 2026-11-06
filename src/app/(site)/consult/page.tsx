import { Suspense } from "react";
import { IlloChat } from "@/components/illustrations";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { generateSlots } from "@/lib/slots";
import { BookingForm } from "@/components/consult/booking-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Talk to a pharmacist" };

export default function ConsultPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex items-end justify-between gap-10">
        <div className="max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-700">Free · private · 20 minutes</p>
          <h1 className="mt-2 font-display text-4xl font-medium leading-tight text-ink md:text-5xl">Talk to a pharmacist</h1>
          <p className="mt-2 text-base text-gray-600 md:text-lg">
            Book a private one-on-one chat with a licensed pharmacist about your medicines, side effects or minor ailments.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-gray-700">
            {["Live chat — share photos of packs or prescriptions", "Only pharmacists can see it", "Same-day slots"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-brand-600" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden w-52 shrink-0 lg:block">
          <IlloChat />
        </div>
      </div>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-[520px] w-full rounded-xl" />}>
          <Booking />
        </Suspense>
      </div>
    </div>
  );
}

async function Booking() {
  await connection();
  const supabase = await createClient();
  const [user, { data: settings }, { data: hours }] = await Promise.all([
    getSessionUser(),
    supabase.from("pharmacy_settings").select("*").eq("id", 1).single(),
    supabase.from("consultation_hours").select("*").order("weekday"),
  ]);
  const now = new Date();
  const windowDays = settings?.booking_window_days ?? 14;
  const { data: booked } = await supabase.rpc("get_booked_slots", {
    p_from: now.toISOString(),
    p_to: new Date(now.getTime() + (windowDays + 1) * 86_400_000).toISOString(),
  });
  const timeZone = settings?.timezone ?? "Africa/Lagos";
  const days = generateSlots({
    hours: hours ?? [],
    slotMinutes: settings?.slot_minutes ?? 20,
    windowDays,
    timeZone,
    booked: booked ?? [],
    now,
  });
  return <BookingForm days={days} slotMinutes={settings?.slot_minutes ?? 20} isLoggedIn={!!user} timeZone={timeZone} />;
}
