"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

export type RequestListItem = {
  key: string; // drug id, or "custom:<name>"
  drugId: string | null;
  slug: string | null;
  name: string;
  detail?: string | null;
  price: number | null;
  requiresRx: boolean;
  form?: string | null;
  qty: number;
};

type Ctx = {
  items: RequestListItem[];
  count: number;
  hydrated: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<RequestListItem, "qty" | "key"> & { qty?: number }) => void;
  addCustom: (name: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  needsPrescription: boolean;
  estimatedTotal: number;
};

const STORAGE_KEY = "carerx.request-list.v1";
const RequestListContext = createContext<Ctx | null>(null);

function read(): RequestListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as RequestListItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const subscribeNoop = () => () => {};

export function RequestListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RequestListItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    // Hydrate from storage once on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(read());
    setLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }, [items, loaded]);

  const add = useCallback<Ctx["add"]>((item) => {
    const key = item.drugId ?? `custom:${item.name.toLowerCase()}`;
    setItems((prev) => {
      const existing = prev.find((p) => p.key === key);
      if (existing) {
        return prev.map((p) => (p.key === key ? { ...p, qty: Math.min(p.qty + (item.qty ?? 1), 99) } : p));
      }
      return [...prev, { ...item, key, qty: item.qty ?? 1 }];
    });
  }, []);

  const addCustom = useCallback<Ctx["addCustom"]>(
    (name, qty = 1) => {
      const clean = name.trim().slice(0, 120);
      if (!clean) return;
      add({ drugId: null, slug: null, name: clean, price: null, requiresRx: false, qty, detail: "Not in our catalogue" });
    },
    [add],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, qty: Math.max(1, Math.min(99, qty)) } : p)));
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      hydrated: isClient && loaded,
      open,
      setOpen,
      add,
      addCustom,
      setQty,
      remove,
      clear,
      needsPrescription: items.some((i) => i.requiresRx),
      estimatedTotal: items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0),
    }),
    [items, isClient, loaded, open, add, addCustom, setQty, remove, clear],
  );

  return <RequestListContext value={value}>{children}</RequestListContext>;
}

export function useRequestList() {
  const ctx = useContext(RequestListContext);
  if (!ctx) throw new Error("useRequestList must be used inside RequestListProvider");
  return ctx;
}
