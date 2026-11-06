"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Attachment01, File06, Send01, XClose, Lock01 } from "@untitledui/icons";
import { createClient } from "@/lib/supabase/client";
import { subscribeAuthed } from "@/lib/supabase/realtime";
import { markConsultRead } from "@/actions/admin/consultations";
import type { ConsultationMessage } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { fileExtension, formatBytes } from "@/components/ui/file-upload";
import { cn, formatDate, formatTime } from "@/lib/utils";

type Msg = ConsultationMessage & { pending?: boolean; failed?: boolean };

export function ChatRoom({
  consultationId,
  currentUserId,
  patientId,
  patientName,
  staffNames,
  initialMessages,
  canSend,
  closedReason,
  viewer,
}: {
  consultationId: string;
  currentUserId: string;
  patientId: string;
  patientName: string;
  staffNames: Record<string, string>;
  initialMessages: ConsultationMessage[];
  canSend: boolean;
  closedReason?: string;
  viewer: "patient" | "staff";
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Realtime: new messages for this consultation.
  useEffect(
    () =>
      subscribeAuthed((client) =>
        client.channel(`chat:${consultationId}`).on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "consultation_messages", filter: `consultation_id=eq.${consultationId}` },
          (payload) => {
            const m = payload.new as ConsultationMessage;
            setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m].sort((a, b) => a.created_at.localeCompare(b.created_at))));
            if (viewer === "staff" && m.sender_id === patientId) void markConsultRead(consultationId);
          },
        ),
      ),
    [consultationId, viewer, patientId],
  );

  // Staff opening the chat marks the patient's messages as read.
  useEffect(() => {
    if (viewer === "staff") void markConsultRead(consultationId);
  }, [viewer, consultationId]);

  // Fallback: merge messages from a server refresh (e.g. after a status change).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const missing = initialMessages.filter((m) => !ids.has(m.id));
      return missing.length ? [...prev, ...missing].sort((a, b) => a.created_at.localeCompare(b.created_at)) : prev;
    });
  }, [initialMessages]);

  // Signed URLs for attachments.
  useEffect(() => {
    const missing = messages.map((m) => m.attachment_path).filter((p): p is string => !!p && !urls[p]);
    if (!missing.length) return;
    supabase.storage
      .from("chat-attachments")
      .createSignedUrls(missing, 60 * 60)
      .then(({ data }) => {
        if (!data) return;
        setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl as string])) }));
      });
  }, [messages, urls, supabase]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, urls]);

  const nameOf = (id: string) =>
    id === patientId ? patientName : staffNames[id] ? `${staffNames[id]}` : viewer === "patient" ? "Pharmacist" : "Staff";

  const send = async () => {
    const body = text.trim();
    if (!body && !file) return;
    setError(null);
    const tempId = -Date.now();
    const temp: Msg = {
      id: tempId,
      consultation_id: consultationId,
      sender_id: currentUserId,
      body: body || null,
      attachment_path: null,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((m) => [...m, temp]);
    setText("");
    const sendingFile = file;
    setFile(null);

    let attachment_path: string | null = null;
    if (sendingFile) {
      const path = `${consultationId}/${crypto.randomUUID()}.${fileExtension(sendingFile)}`;
      const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, sendingFile, {
        contentType: sendingFile.type || undefined,
      });
      if (upErr) {
        setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)));
        setError("Couldn’t upload the file. Please try again.");
        return;
      }
      attachment_path = path;
    }

    const { data, error: insErr } = await supabase
      .from("consultation_messages")
      .insert({ consultation_id: consultationId, sender_id: currentUserId, body: body || null, attachment_path })
      .select()
      .single();

    if (insErr || !data) {
      setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)));
      setError("Message not sent. This chat may have been closed.");
      return;
    }
    setMessages((m) => {
      const without = m.filter((x) => x.id !== tempId);
      return without.some((x) => x.id === data.id) ? without : [...without, data];
    });
    textRef.current?.focus();
  };

  // Day separators.
  const dayOf = (iso: string) => formatDate(iso, { weekday: "long", day: "numeric", month: "long", year: undefined });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <p className="mx-auto flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600 ring-1 ring-gray-200">
            <Lock01 className="size-3.5" /> Private chat between you and our pharmacists
          </p>
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              {viewer === "patient"
                ? "No messages yet. Say hello — your pharmacist will join at your booked time."
                : "No messages yet. Start the session by greeting the patient."}
            </p>
          )}
          {messages.map((m, idx) => {
            const mine = m.sender_id === currentUserId;
            const day = dayOf(m.created_at);
            const showDay = idx === 0 || day !== dayOf(messages[idx - 1]!.created_at);
            const url = m.attachment_path ? urls[m.attachment_path] : undefined;
            const isImage = m.attachment_path && /\.(png|jpe?g|webp|heic)$/i.test(m.attachment_path);
            return (
              <div key={m.id} className="flex flex-col gap-4">
                {showDay && (
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <span className="h-px flex-1 bg-gray-200" />
                    {day}
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                )}
                <div className={cn("flex gap-3", mine && "flex-row-reverse")}>
                  {!mine && <Avatar name={nameOf(m.sender_id)} size="md" />}
                  <div className={cn("flex max-w-[85%] flex-col gap-1.5 sm:max-w-[70%]", mine && "items-end")}>
                    <p className="flex gap-2 text-sm">
                      <span className="font-medium text-gray-700">{mine ? "You" : nameOf(m.sender_id)}</span>
                      <span className="text-xs leading-5 text-gray-500">
                        {m.pending ? "Sending…" : m.failed ? "Failed" : formatTime(m.created_at)}
                      </span>
                    </p>
                    {m.attachment_path && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className={cn("overflow-hidden rounded-lg ring-1 ring-gray-200", !url && "pointer-events-none")}
                      >
                        {isImage && url ? (
                          <img src={url} alt="Attachment" className="max-h-64 w-auto max-w-full object-cover" />
                        ) : (
                          <span className="flex items-center gap-3 bg-white px-3 py-2.5 text-sm font-medium text-gray-700">
                            <File06 className="size-6 text-gray-400" /> {url ? "Open attachment" : "Loading attachment…"}
                          </span>
                        )}
                      </a>
                    )}
                    {m.body && (
                      <div
                        className={cn(
                          "whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-base",
                          mine ? "rounded-tr-none bg-brand-600 text-white" : "rounded-tl-none bg-gray-50 text-gray-900 ring-1 ring-gray-200",
                          m.failed && "opacity-60",
                        )}
                      >
                        {m.body}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {canSend ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="rounded-xl bg-white shadow-xs ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-brand-600"
            >
              {file && (
                <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 text-sm text-gray-700">
                  <File06 className="size-4 text-gray-500" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-gray-500">{formatBytes(file.size)}</span>
                  <button type="button" onClick={() => setFile(null)} className="ml-auto rounded p-1 text-gray-400 hover:text-gray-600" aria-label="Remove attachment">
                    <XClose className="size-4" />
                  </button>
                </div>
              )}
              <textarea
                ref={textRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                maxLength={4000}
                placeholder="Type a message…"
                aria-label="Message"
                className="block w-full resize-none rounded-t-xl bg-transparent px-3.5 py-3 text-base text-gray-900 outline-none placeholder:text-gray-500"
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  aria-label="Attach a photo or PDF"
                >
                  <Attachment01 className="size-5" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 10 * 1024 * 1024) setError("Files must be under 10MB.");
                    else if (f) setFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="submit"
                  disabled={!text.trim() && !file}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-50"
                >
                  Send <Send01 className="size-4" />
                </button>
              </div>
            </form>
          ) : (
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">{closedReason ?? "This consultation is closed."}</p>
          )}
          {error && <p className="mt-2 text-sm text-error-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
