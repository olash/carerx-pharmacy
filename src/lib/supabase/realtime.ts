import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Subscribe to a realtime channel *after* the browser session has loaded, so
 * the socket authenticates as the user (otherwise RLS hides every event).
 * Returns an unsubscribe function.
 */
export function subscribeAuthed(build: (supabase: ReturnType<typeof createClient>) => RealtimeChannel) {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;
  let cancelled = false;

  (async () => {
    const { data } = await supabase.auth.getSession();
    if (cancelled) return;
    if (data.session) await supabase.realtime.setAuth(data.session.access_token);
    if (cancelled) return;
    channel = build(supabase).subscribe();
  })();

  return () => {
    cancelled = true;
    if (channel) void supabase.removeChannel(channel);
  };
}
