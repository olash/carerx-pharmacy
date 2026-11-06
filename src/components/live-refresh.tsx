"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeAuthed } from "@/lib/supabase/realtime";

/**
 * Subscribes to Postgres changes and refreshes the server-rendered page when
 * something relevant changes (status updates, new requests, etc.).
 */
export function LiveRefresh({
  channel,
  table,
  filter,
  events = "*",
}: {
  channel: string;
  table: "drug_requests" | "consultations" | "consultation_messages";
  filter?: string;
  events?: "*" | "INSERT" | "UPDATE";
}) {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeAuthed((supabase) =>
      supabase.channel(channel).on("postgres_changes", { event: events, schema: "public", table, filter }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 250);
      }),
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [channel, table, filter, events, router]);
  return null;
}
