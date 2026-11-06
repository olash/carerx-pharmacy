"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle, XClose } from "@untitledui/icons";
import { cn } from "@/lib/utils";

type Toast = { id: number; title: string; description?: string; tone: "success" | "error" };
type Ctx = { toast: (t: Omit<Toast, "id">) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback<Ctx["toast"]>(
    (t) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle : AlertCircle;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200"
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", t.tone === "success" ? "text-success-600" : "text-error-600")} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                {t.description && <p className="mt-1 text-sm text-gray-600">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-m-1 rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-500"
                aria-label="Dismiss"
              >
                <XClose className="size-5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}
