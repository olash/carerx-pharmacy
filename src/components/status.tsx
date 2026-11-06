import { Badge, type BadgeColor } from "@/components/ui/badge";
import type { ConsultStatus, RequestStatus } from "@/lib/types";
import { stockLevel } from "@/lib/utils";

export const requestStatusMeta: Record<
  RequestStatus,
  { label: string; color: BadgeColor; patientHint: string }
> = {
  submitted: { label: "Submitted", color: "gray", patientHint: "We’ve received your request. A pharmacist will review it shortly." },
  reviewing: { label: "In review", color: "blue", patientHint: "A pharmacist is checking availability and your prescription." },
  quoted: { label: "Quote ready", color: "warning", patientHint: "Your quote is ready. Review the prices and confirm to proceed." },
  confirmed: { label: "Confirmed", color: "indigo", patientHint: "Thanks for confirming. We’re packing your order now." },
  ready: { label: "Packed", color: "brand", patientHint: "Your order is packed and waiting for a rider." },
  out_for_delivery: { label: "On the way", color: "purple", patientHint: "A rider is bringing your order. Please have cash, a transfer or a card ready." },
  completed: { label: "Delivered", color: "success", patientHint: "Delivered and paid. Thank you for choosing us!" },
  cancelled: { label: "Cancelled", color: "gray", patientHint: "This request was cancelled." },
  rejected: { label: "Declined", color: "error", patientHint: "The pharmacist couldn’t fulfil this request. See the note below." },
};

export const requestFlow: RequestStatus[] = ["submitted", "reviewing", "quoted", "confirmed", "ready", "completed"];

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const m = requestStatusMeta[status];
  return (
    <Badge color={m.color} dot>
      {m.label}
    </Badge>
  );
}

export const consultStatusMeta: Record<ConsultStatus, { label: string; color: BadgeColor }> = {
  booked: { label: "Upcoming", color: "blue" },
  in_progress: { label: "In session", color: "brand" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "gray" },
  no_show: { label: "Missed", color: "warning" },
};

export function ConsultStatusBadge({ status }: { status: ConsultStatus }) {
  const m = consultStatusMeta[status];
  return (
    <Badge color={m.color} dot>
      {m.label}
    </Badge>
  );
}

export function StockBadge({ qty, threshold, showQty }: { qty: number; threshold: number; showQty?: boolean }) {
  const level = stockLevel(qty, threshold);
  if (level === "out_of_stock") return <Badge color="error" dot>Out of stock</Badge>;
  if (level === "low_stock")
    return (
      <Badge color="warning" dot>
        {showQty ? `Low · ${qty} left` : "Low stock"}
      </Badge>
    );
  return (
    <Badge color="success" dot>
      {showQty ? `${qty} in stock` : "In stock"}
    </Badge>
  );
}

export function RxBadge() {
  return (
    <Badge color="purple" className="font-semibold">
      Rx
    </Badge>
  );
}
