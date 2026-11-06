"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CalendarCheck01, ChevronLeft, ChevronRight, Clock } from "@untitledui/icons";
import type { SlotDay } from "@/lib/slots";
import { bookConsultation } from "@/actions/consultations";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const consultTopics = [
  "Question about my medication",
  "Side effects or interactions",
  "Advice on a minor ailment",
  "Help understanding a prescription",
  "Chronic condition check-in (BP, diabetes)",
  "Something else",
];

export function BookingForm({
  days,
  slotMinutes,
  isLoggedIn,
  timeZone,
}: {
  days: SlotDay[];
  slotMinutes: number;
  isLoggedIn: boolean;
  timeZone: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const firstWithSlots = Math.max(0, days.findIndex((d) => d.slots.some((s) => s.available)));
  const [dayIdx, setDayIdx] = useState(firstWithSlots);
  const [slot, setSlot] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [offset, setOffset] = useState(Math.max(0, Math.min(firstWithSlots, days.length - 7)));

  const day = days[dayIdx];
  const visible = days.slice(offset, offset + 7);
  const selected = useMemo(() => day?.slots.find((s) => s.iso === slot), [day, slot]);

  const book = () => {
    setError(null);
    if (!slot) return setError("Choose a time slot.");
    if (!topic) return setError("Choose what you’d like to discuss.");
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent("/consult")}`);
      return;
    }
    start(async () => {
      const res = await bookConsultation({ scheduledAt: slot, topic, details });
      if (!res.ok) {
        setError(res.error);
        if (res.error.includes("slot") || res.error.includes("time")) router.refresh();
        return;
      }
      toast({ tone: "success", title: "Consultation booked", description: "You can chat with your pharmacist here at your time." });
      router.push(`/account/consultations/${res.data.id}?new=1`);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Choose a date & time</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
              <Clock className="size-4" /> {slotMinutes}-minute chat · times shown in {timeZone.replace("_", " ")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOffset((o) => Math.max(0, o - 7))}
              disabled={offset === 0}
              className="rounded-lg p-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Previous week"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setOffset((o) => Math.min(days.length - 7, o + 7))}
              disabled={offset + 7 >= days.length}
              className="rounded-lg p-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Next week"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2" role="radiogroup" aria-label="Date">
          {visible.map((d) => {
            const idx = days.indexOf(d);
            const free = d.slots.filter((s) => s.available).length;
            const active = idx === dayIdx;
            return (
              <button
                key={d.date}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={free === 0}
                onClick={() => {
                  setDayIdx(idx);
                  setSlot(null);
                }}
                className={cn(
                  "flex flex-col items-center rounded-lg px-1 py-2.5 text-center ring-1 ring-inset transition disabled:cursor-not-allowed",
                  active ? "bg-brand-600 text-white ring-brand-600" : "text-gray-700 ring-gray-200 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400",
                )}
              >
                <span className={cn("text-xs font-medium", active ? "text-brand-100" : "text-gray-500")}>{d.weekday}</span>
                <span className="text-lg font-semibold">{d.day}</span>
                <span className={cn("text-[11px] font-medium", active ? "text-brand-100" : free ? "text-brand-700" : "text-gray-400")}>
                  {free ? `${free} free` : "Closed"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700">
            {day ? `${day.weekday} ${day.day} ${day.month}` : "No dates"}
          </p>
          {day && day.slots.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" role="radiogroup" aria-label="Time">
              {day.slots.map((s) => (
                <button
                  key={s.iso}
                  type="button"
                  role="radio"
                  aria-checked={slot === s.iso}
                  disabled={!s.available}
                  onClick={() => setSlot(s.iso)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-semibold ring-1 ring-inset transition",
                    slot === s.iso
                      ? "bg-brand-50 text-brand-700 ring-2 ring-brand-600"
                      : s.available
                        ? "text-gray-700 ring-gray-300 hover:bg-gray-50"
                        : "cursor-not-allowed text-gray-300 line-through ring-gray-100",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No slots on this day. Try another date.</p>
          )}
        </div>
      </Card>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Card className="flex flex-col gap-5 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Your consultation</h2>
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <CalendarCheck01 className="size-6 shrink-0 text-brand-600" />
            <div className="text-sm">
              {selected && day ? (
                <>
                  <p className="font-semibold text-gray-900">
                    {day.weekday} {day.day} {day.month} · {selected.label}
                  </p>
                  <p className="text-gray-600">{slotMinutes} minutes · live chat</p>
                </>
              ) : (
                <p className="text-gray-600">Pick a date and time</p>
              )}
            </div>
          </div>
          <Select label="What would you like to discuss?" name="topic" required value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="" disabled>
              Choose a topic
            </option>
            {consultTopics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Textarea
            label="Details (optional)"
            name="details"
            rows={4}
            maxLength={2000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Symptoms, medicines you take, allergies…"
            hint="Only pharmacists can see this."
          />
          {error && <Alert tone="error" title={error} />}
          <Button size="xl" onClick={book} loading={pending} className="w-full">
            {isLoggedIn ? "Book consultation" : "Log in to book"}
          </Button>
          <p className="text-xs text-gray-500">
            Free of charge. Not for emergencies — if you’re seriously unwell, call 112 or go to the nearest hospital.
          </p>
        </Card>
      </aside>
    </div>
  );
}
