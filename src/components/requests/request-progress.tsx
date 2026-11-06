import { Check } from "@untitledui/icons";
import type { Fulfilment, RequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Untitled "progress steps" (horizontal, icons with connectors). */
export function RequestProgress({ status, fulfilment }: { status: RequestStatus; fulfilment: Fulfilment }) {
  const steps: { key: RequestStatus[]; label: string }[] = [
    { key: ["submitted"], label: "Submitted" },
    { key: ["reviewing"], label: "Pharmacist review" },
    { key: ["quoted"], label: "Confirm quote" },
    { key: ["confirmed"], label: "Preparing" },
    { key: fulfilment === "delivery" ? ["ready", "out_for_delivery"] : ["ready"], label: fulfilment === "delivery" ? "On the way" : "Ready for pickup" },
    { key: ["completed"], label: "Completed" },
  ];
  const order: RequestStatus[] = ["submitted", "reviewing", "quoted", "confirmed", "ready", "out_for_delivery", "completed"];
  const pos = order.indexOf(status);
  const stepIndex = (k: RequestStatus[]) => Math.max(...k.map((s) => order.indexOf(s)));

  if (status === "cancelled" || status === "rejected") return null;

  return (
    <ol className="grid grid-cols-6 gap-2" aria-label="Request progress">
      {steps.map((s, i) => {
        const idx = stepIndex(s.key);
        // "quoted" step is done once the patient confirms
        const done = s.key.includes("quoted") ? pos > order.indexOf("quoted") : pos > idx || (status === "completed" && s.key.includes("completed"));
        const current = !done && (s.key.includes(status) || (s.key.includes("quoted") && status === "quoted"));
        return (
          <li key={s.label} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span className={cn("absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2", done || current ? "bg-brand-600" : "bg-gray-200")} aria-hidden />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 items-center justify-center rounded-full",
                done ? "bg-brand-600 text-white" : current ? "bg-brand-50 ring-2 ring-brand-600 [box-shadow:0_0_0_4px_rgba(14,147,132,0.16)]" : "bg-gray-50 ring-1 ring-gray-200",
              )}
            >
              {done ? <Check className="size-4" /> : <span className={cn("size-2.5 rounded-full", current ? "bg-brand-600" : "bg-gray-300")} />}
            </span>
            <span className={cn("mt-2 hidden text-xs font-semibold sm:block", done || current ? "text-brand-700" : "text-gray-500")}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
