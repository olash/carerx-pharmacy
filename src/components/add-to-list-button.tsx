"use client";

import { Check, Plus } from "@untitledui/icons";
import { useState } from "react";
import { useRequestList } from "@/components/providers/request-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AddableDrug = {
  id: string;
  slug: string;
  name: string;
  strength: string | null;
  pack_size: string | null;
  dosage_form: string | null;
  price: number;
  requires_prescription: boolean;
  stock_qty: number;
};

export function AddToListButton({
  drug,
  qty = 1,
  size = "md",
  className,
  openDrawer = false,
  label = "Add to request",
  variant = "primary",
}: {
  drug: AddableDrug;
  qty?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  openDrawer?: boolean;
  label?: string;
  variant?: "primary" | "quiet";
}) {
  const { add, setOpen, items } = useRequestList();
  const [justAdded, setJustAdded] = useState(false);
  const inList = items.some((i) => i.key === drug.id);
  const out = drug.stock_qty <= 0;

  return (
    <Button
      size={size}
      variant={inList ? "secondary-color" : variant === "quiet" || out ? "secondary" : "primary"}
      iconLeading={justAdded ? Check : Plus}
      className={cn(variant === "quiet" && "rounded-full", className)}
      onClick={() => {
        add({
          drugId: drug.id,
          slug: drug.slug,
          name: drug.name,
          detail: [drug.strength, drug.pack_size].filter(Boolean).join(" · ") || null,
          price: Number(drug.price),
          requiresRx: drug.requires_prescription,
          form: drug.dosage_form,
          qty,
        });
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1400);
        if (openDrawer) setOpen(true);
      }}
    >
      {justAdded ? "Added to your list" : inList ? "Add another" : out ? "Request anyway" : label}
    </Button>
  );
}
