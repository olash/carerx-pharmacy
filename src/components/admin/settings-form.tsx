"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/actions/admin/settings";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Input, Select, Toggle } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { ConsultationHours, PharmacySettings } from "@/lib/types";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const order = [1, 2, 3, 4, 5, 6, 0];

export function SettingsForm({ settings, hours }: { settings: PharmacySettings; hours: ConsultationHours[] }) {
  const [slot, setSlot] = useState(String(settings.slot_minutes));
  const [windowDays, setWindowDays] = useState(String(settings.booking_window_days));
  const [fee, setFee] = useState(String(Number(settings.delivery_fee)));
  const [h, setH] = useState(() =>
    hours.map((x) => ({ ...x, start_time: x.start_time.slice(0, 5), end_time: x.end_time.slice(0, 5) })),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const set = (weekday: number, patch: Partial<ConsultationHours>) => setH((xs) => xs.map((x) => (x.weekday === weekday ? { ...x, ...patch } : x)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await saveSettings({ slot_minutes: Number(slot), booking_window_days: Number(windowDays), delivery_fee: Number(fee), hours: h });
          if (!res.ok) return setError(res.error);
          toast({ tone: "success", title: "Settings saved" });
          router.refresh();
        });
      }}
      className="flex flex-col gap-6"
    >
      <Card>
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">Consultation hours</h2>
          <p className="mt-1 text-sm text-gray-600">When patients can book chats with a pharmacist (Africa/Lagos time).</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {order.map((wd) => {
            const row = h.find((x) => x.weekday === wd)!;
            return (
              <li key={wd} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
                <div className="w-40">
                  <Toggle name={`open-${wd}`} checked={row.is_open} onChange={(e) => set(wd, { is_open: e.target.checked })} label={days[wd]} />
                </div>
                {row.is_open ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={row.start_time} step={600} onChange={(e) => set(wd, { start_time: e.target.value })} aria-label={`${days[wd]} opens`} className="h-10 rounded-lg px-3 text-sm shadow-xs ring-1 ring-inset ring-gray-300 outline-none focus:ring-2 focus:ring-brand-600" />
                    <span className="text-sm text-gray-500">to</span>
                    <input type="time" value={row.end_time} step={600} onChange={(e) => set(wd, { end_time: e.target.value })} aria-label={`${days[wd]} closes`} className="h-10 rounded-lg px-3 text-sm shadow-xs ring-1 ring-inset ring-gray-300 outline-none focus:ring-2 focus:ring-brand-600" />
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Closed for consultations</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Booking & delivery</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Select label="Consultation length" name="slot_minutes" value={slot} onChange={(e) => setSlot(e.target.value)}>
            {[10, 15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </Select>
          <Input label="Bookable up to (days ahead)" name="booking_window_days" type="number" min={1} max={60} value={windowDays} onChange={(e) => setWindowDays(e.target.value)} />
          <Input label="Delivery fee (₦)" name="delivery_fee" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} hint="Default; editable per quote." />
        </div>
      </Card>

      {error && <Alert tone="error" title={error} />}
      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={pending}>Save settings</Button>
      </div>
    </form>
  );
}
