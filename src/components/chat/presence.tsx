"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeAuthed } from "@/lib/supabase/realtime";
import { cn } from "@/lib/utils";

type PresenceState = { enabled: boolean; patientOnline: boolean; staffOnline: boolean };
type Meta = { role: "patient" | "staff" };

const PresenceContext = createContext<PresenceState>({ enabled: false, patientOnline: false, staffOnline: false });

/**
 * Joins the private presence channel `consult:<id>` (RLS: patient of the
 * consultation + staff only). When `track` is set, this viewer is announced
 * as present while the page is open.
 */
export function useConsultPresence(consultationId: string, opts: { enabled: boolean; userId?: string; track?: Meta["role"] }) {
  const [state, setState] = useState({ patientOnline: false, staffOnline: false });
  const { enabled, userId, track } = opts;

  useEffect(() => {
    if (!enabled) return;
    return subscribeAuthed(
      (supabase) => {
        const ch = supabase.channel(`consult:${consultationId}`, {
          config: { private: true, presence: { key: userId ?? `viewer-${Math.random().toString(36).slice(2)}` } },
        });
        ch.on("presence", { event: "sync" }, () => {
          const metas = Object.values(ch.presenceState<Meta>()).flat();
          setState({
            patientOnline: metas.some((m) => m.role === "patient"),
            staffOnline: metas.some((m) => m.role === "staff"),
          });
        });
        return ch;
      },
      (ch) => {
        if (track) void ch.track({ role: track });
      },
    );
  }, [consultationId, enabled, userId, track]);

  return enabled ? state : { patientOnline: false, staffOnline: false };
}

export function ConsultPresenceProvider({
  consultationId,
  enabled,
  userId,
  track,
  children,
}: {
  consultationId: string;
  enabled: boolean;
  userId: string;
  track: Meta["role"];
  children: ReactNode;
}) {
  const s = useConsultPresence(consultationId, { enabled, userId, track });
  return <PresenceContext value={{ enabled, ...s }}>{children}</PresenceContext>;
}

export function usePresence() {
  return useContext(PresenceContext);
}

export function OnlineDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full ring-2 ring-white", online ? "bg-success-500" : "bg-gray-300", className)}
      aria-hidden
    />
  );
}

/** Small "Online / Offline" pill for the other party, inside a provider. */
export function PresencePill({ who }: { who: "patient" | "staff" }) {
  const p = usePresence();
  if (!p.enabled) return null;
  const online = who === "patient" ? p.patientOnline : p.staffOnline;
  const label = who === "patient" ? (online ? "Patient is in the chat" : "Patient offline") : online ? "Pharmacist online" : "Pharmacist not here yet";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        online ? "bg-success-50 text-success-700 ring-success-200" : "bg-gray-50 text-gray-600 ring-gray-200",
      )}
      aria-live="polite"
    >
      <span className={cn("size-1.5 rounded-full", online ? "bg-success-500" : "bg-gray-400")} />
      {label}
    </span>
  );
}

/** Avatar-corner dot bound to the provider. */
export function PresenceAvatarDot({ who }: { who: "patient" | "staff" }) {
  const p = usePresence();
  if (!p.enabled) return null;
  return <OnlineDot online={who === "patient" ? p.patientOnline : p.staffOnline} className="absolute bottom-0 right-0" />;
}

/** Standalone dot for list rows (joins without tracking). */
export function ConsultOnlineDot({ consultationId }: { consultationId: string }) {
  const { patientOnline } = useConsultPresence(consultationId, { enabled: true });
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600" title={patientOnline ? "Patient is in the chat room" : "Patient offline"}>
      <OnlineDot online={patientOnline} />
      <span className={patientOnline ? "text-success-700" : "text-gray-500"}>{patientOnline ? "Online" : "Offline"}</span>
    </span>
  );
}
