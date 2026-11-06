"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "@untitledui/icons";
import { patientRequestAction } from "@/actions/requests";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatNaira } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types";

export function PatientRequestActions({ id, status, total }: { id: string; status: RequestStatus; total: number }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const run = (action: "confirm" | "cancel") =>
    start(async () => {
      const res = await patientRequestAction(id, action);
      setConfirmCancel(false);
      if (!res.ok) toast({ tone: "error", title: res.error });
      else toast({ tone: "success", title: res.message ?? "Done" });
      router.refresh();
    });

  const canCancel = status === "submitted" || status === "reviewing" || status === "quoted";
  if (status !== "quoted" && !canCancel) return null;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        {status === "quoted" && (
          <Button size="lg" iconLeading={CheckCircle} loading={pending} onClick={() => run("confirm")} className="sm:flex-1">
            Confirm quote · {formatNaira(total)}
          </Button>
        )}
        {canCancel && (
          <Button size="lg" variant="secondary" disabled={pending} onClick={() => setConfirmCancel(true)}>
            Cancel request
          </Button>
        )}
      </div>
      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        icon={XCircle}
        tone="error"
        title="Cancel this request?"
        description="Your pharmacist will stop working on it. You can always send a new request later."
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={() => setConfirmCancel(false)}>
              Keep request
            </Button>
            <Button variant="destructive" size="lg" loading={pending} onClick={() => run("cancel")}>
              Yes, cancel
            </Button>
          </>
        }
      />
    </>
  );
}
