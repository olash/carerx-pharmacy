"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { subscribeAuthed } from "@/lib/supabase/realtime";
import { useToast } from "@/components/providers/toast";
import { playChime } from "@/lib/chime";

/**
 * Live alerts for staff: new patient messages, new bookings and new drug
 * requests. Plays a chime (if enabled) and refreshes badge counts.
 */
export function AdminAlerts({ userId, staffIds, soundEnabled }: { userId: string; staffIds: string[]; soundEnabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const staff = useRef(new Set(staffIds));
  const sound = useRef(soundEnabled);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);
  useEffect(() => {
    staff.current = new Set(staffIds);
    sound.current = soundEnabled;
  }, [staffIds, soundEnabled]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 300);
    };
    const unsubscribe = subscribeAuthed((supabase) =>
      supabase
        .channel(`admin-alerts:${userId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "consultation_messages" }, (payload) => {
          const m = payload.new as { consultation_id: string; sender_id: string; body: string | null };
          if (m.sender_id === userId || staff.current.has(m.sender_id)) return;
          const viewing = pathRef.current === `/admin/consultations/${m.consultation_id}`;
          if (!viewing) {
            if (sound.current) playChime();
            toast({
              tone: "info",
              title: "New message from a patient",
              description: m.body ? (m.body.length > 90 ? `${m.body.slice(0, 90)}…` : m.body) : "Sent an attachment",
              href: `/admin/consultations/${m.consultation_id}`,
              actionLabel: "Open chat",
            });
          }
          refresh();
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "consultations" }, (payload) => {
          const c = payload.new as { id: string; topic: string };
          if (sound.current) playChime();
          toast({ tone: "info", title: "New consultation booked", description: c.topic, href: `/admin/consultations/${c.id}`, actionLabel: "View booking" });
          refresh();
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "drug_requests" }, (payload) => {
          const r = payload.new as { id: string; ref: string };
          if (sound.current) playChime();
          toast({ tone: "info", title: `New drug request ${r.ref}`, href: `/admin/requests/${r.id}`, actionLabel: "Review" });
          refresh();
        }),
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [userId, router, toast]);

  return null;
}
