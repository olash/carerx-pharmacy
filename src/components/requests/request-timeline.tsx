import type { RequestEvent } from "@/lib/types";
import { requestStatusMeta } from "@/components/status";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function RequestTimeline({ events, names }: { events: RequestEvent[]; names?: Record<string, string> }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const meta = requestStatusMeta[e.status];
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!last && <span className="absolute left-[7px] top-5 h-full w-px bg-gray-200" aria-hidden />}
            <span className={cn("relative mt-1 size-[15px] shrink-0 rounded-full ring-4 ring-white", last ? "bg-brand-600" : "bg-gray-300")} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
              <p className="text-xs text-gray-500">
                {formatDateTime(e.created_at)}
                {names && e.actor_id && names[e.actor_id] ? ` · ${names[e.actor_id]}` : ""}
              </p>
              {e.note && <p className="mt-1 text-sm text-gray-600">{e.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
