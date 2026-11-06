import type { FC, ReactNode } from "react";
import { AlertCircle, CheckCircle, InfoCircle, AlertTriangle } from "@untitledui/icons";
import { cn } from "@/lib/utils";

const styles = {
  info: { box: "bg-gray-25 ring-gray-300", icon: InfoCircle, iconC: "text-gray-600" },
  brand: { box: "bg-brand-25 ring-brand-300", icon: InfoCircle, iconC: "text-brand-600" },
  success: { box: "bg-success-25 ring-success-200", icon: CheckCircle, iconC: "text-success-600" },
  warning: { box: "bg-warning-25 ring-warning-300", icon: AlertTriangle, iconC: "text-warning-600" },
  error: { box: "bg-error-25 ring-error-300", icon: AlertCircle, iconC: "text-error-600" },
} satisfies Record<string, { box: string; icon: FC<{ className?: string }>; iconC: string }>;

export function Alert({
  tone = "info",
  title,
  children,
  actions,
  className,
}: {
  tone?: keyof typeof styles;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const s = styles[tone];
  const Icon = s.icon;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl p-4 ring-1 ring-inset", s.box, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", s.iconC)} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-gray-700">{title}</p>
        {children && <div className="mt-1 text-gray-600">{children}</div>}
        {actions && <div className="mt-3 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
