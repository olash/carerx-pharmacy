import type { DrugRequest, DrugRequestItem } from "./types";

export function requestTotals(request: Pick<DrugRequest, "delivery_fee" | "fulfilment">, items: Pick<DrugRequestItem, "unit_price" | "quantity" | "is_available">[]) {
  const billable = items.filter((i) => i.is_available !== false);
  const subtotal = billable.reduce((s, i) => s + Number(i.unit_price ?? 0) * i.quantity, 0);
  const unpriced = billable.some((i) => i.unit_price === null);
  const delivery = request.fulfilment === "delivery" ? Number(request.delivery_fee) : 0;
  return { subtotal, delivery, total: subtotal + delivery, unpriced };
}
