import type { ConsultationHours } from "./types";

export type Slot = { iso: string; label: string; available: boolean };
export type SlotDay = { date: string; weekday: string; day: string; month: string; slots: Slot[] };

function offsetMinutes(at: Date, timeZone: string) {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = part?.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Convert a wall-clock time in `timeZone` to a UTC Date. */
export function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, timeZone: string) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const off = offsetMinutes(new Date(guess), timeZone);
  return new Date(guess - off * 60_000);
}

function localParts(at: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day) };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h! * 60 + m!;
};

export function generateSlots({
  hours,
  slotMinutes,
  windowDays,
  timeZone,
  booked,
  now,
  locale = "en-NG",
}: {
  hours: ConsultationHours[];
  slotMinutes: number;
  windowDays: number;
  timeZone: string;
  booked: string[];
  now: Date;
  locale?: string;
}): SlotDay[] {
  const bookedSet = new Set(booked.map((b) => new Date(b).getTime()));
  const minStart = now.getTime() + 10 * 60_000; // same lead time the database enforces
  const maxStart = now.getTime() + windowDays * 86_400_000;
  const today = localParts(now, timeZone);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone, ...o });
  const days: SlotDay[] = [];

  for (let i = 0; i < windowDays; i++) {
    // Noon local avoids DST edge cases when stepping days.
    const noon = zonedToUtc(today.y, today.m, today.d + i, 12, 0, timeZone);
    const { y, m, d } = localParts(noon, timeZone);
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const rule = hours.find((h) => h.weekday === weekday);
    const slots: Slot[] = [];
    if (rule?.is_open) {
      const start = toMinutes(rule.start_time);
      const end = toMinutes(rule.end_time);
      for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
        const at = zonedToUtc(y, m, d, Math.floor(t / 60), t % 60, timeZone);
        const ms = at.getTime();
        if (ms < minStart || ms > maxStart) continue;
        slots.push({
          iso: at.toISOString(),
          label: fmt({ hour: "numeric", minute: "2-digit", hour12: true }).format(at),
          available: !bookedSet.has(ms),
        });
      }
    }
    days.push({
      date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      weekday: fmt({ weekday: "short" }).format(noon),
      day: fmt({ day: "numeric" }).format(noon),
      month: fmt({ month: "short" }).format(noon),
      slots,
    });
  }
  return days;
}
