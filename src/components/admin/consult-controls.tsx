"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, PlayCircle, Save01 } from "@untitledui/icons";
import { saveConsultNotes, setConsultStatus } from "@/actions/admin/consultations";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { ConsultStatus } from "@/lib/types";

export function ConsultStatusActions({ id, status }: { id: string; status: ConsultStatus }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const go = (s: ConsultStatus) =>
    start(async () => {
      const res = await setConsultStatus(id, s);
      toast(res.ok ? { tone: "success", title: res.message ?? "Updated" } : { tone: "error", title: res.error });
      router.refresh();
    });
  return (
    <div className="flex flex-wrap gap-2">
      {status === "booked" && (
        <>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => go("no_show")}>Mark no-show</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => go("cancelled")}>Cancel</Button>
          <Button size="sm" iconLeading={PlayCircle} loading={pending} onClick={() => go("in_progress")}>Start session</Button>
        </>
      )}
      {status === "in_progress" && (
        <Button size="sm" iconLeading={CheckCircle} loading={pending} onClick={() => go("completed")}>End consultation</Button>
      )}
      {status === "completed" && (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => go("in_progress")}>Reopen chat</Button>
      )}
      {status === "no_show" && (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => go("booked")}>Undo no-show</Button>
      )}
    </div>
  );
}

export function ConsultNotes({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Private notes"
        name="notes"
        rows={6}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Assessment, advice given, follow-up… Only staff can see this."
        hint="Never shown to the patient."
      />
      <Button
        size="sm"
        variant="secondary"
        iconLeading={Save01}
        loading={pending}
        disabled={notes === saved}
        onClick={() =>
          start(async () => {
            const res = await saveConsultNotes(id, notes);
            if (res.ok) setSaved(notes);
            toast(res.ok ? { tone: "success", title: "Notes saved" } : { tone: "error", title: res.error });
          })
        }
        className="self-end"
      >
        {notes === saved ? "Saved" : "Save notes"}
      </Button>
    </div>
  );
}
