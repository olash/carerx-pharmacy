"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarMinus01 } from "@untitledui/icons";
import { cancelConsultation } from "@/actions/consultations";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function CancelConsultButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Cancel booking
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={CalendarMinus01}
        tone="error"
        title="Cancel this consultation?"
        description="Your slot will be released for someone else. You can book another time whenever you like."
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={() => setOpen(false)}>Keep booking</Button>
            <Button
              variant="destructive"
              size="lg"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await cancelConsultation(id);
                  setOpen(false);
                  toast(res.ok ? { tone: "success", title: res.message ?? "Cancelled" } : { tone: "error", title: res.error });
                  router.refresh();
                })
              }
            >
              Yes, cancel
            </Button>
          </>
        }
      />
    </>
  );
}
