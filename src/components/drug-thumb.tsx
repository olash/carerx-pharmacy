/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Packaging-style product tile. Without a photo we render a small "carton"
 * set in the product's own details, on a muted paper tone — closer to a real
 * pharmacy shelf than an icon.
 */
const tones = [
  { bg: "bg-[#e6ede6]", band: "bg-[#2c6e4b]" }, // sage
  { bg: "bg-[#efe3d8]", band: "bg-[#a4552f]" }, // clay
  { bg: "bg-[#e1e8ee]", band: "bg-[#2f5f86]" }, // sky
  { bg: "bg-[#f1e8d4]", band: "bg-[#b07a12]" }, // sand
  { bg: "bg-[#e9e1ea]", band: "bg-[#6e3f73]" }, // plum
  { bg: "bg-[#e7e4de]", band: "bg-[#44403c]" }, // stone
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function DrugThumb({
  name,
  form,
  imageUrl,
  brand,
  strength,
  className,
  size = "md",
}: {
  name: string;
  form?: string | null;
  imageUrl?: string | null;
  brand?: string | null;
  strength?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const t = tones[hash(brand || name) % tones.length]!;
  if (imageUrl) {
    return (
      <div className={cn("overflow-hidden bg-paper", className)}>
        <img src={imageUrl} alt="" className="size-full object-contain p-3" loading="lazy" />
      </div>
    );
  }

  if (size === "sm") {
    return (
      <div className={cn("flex items-center justify-center", t.bg, className)} aria-hidden>
        <div className="flex h-[62%] w-[52%] flex-col overflow-hidden rounded-[3px] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.12)]">
          <div className={cn("h-[22%]", t.band)} />
          <div className="flex flex-1 items-center justify-center font-display text-[11px] font-semibold leading-none text-ink">
            {name.charAt(0)}
          </div>
        </div>
      </div>
    );
  }

  const cleanName = strength ? name.replace(strength, "").trim() : name;
  const lg = size === "lg";
  return (
    <div className={cn("flex items-center justify-center", t.bg, className)} aria-hidden>
      {/* carton: front face + a slim shaded side for depth */}
      <div className={cn("relative flex", lg ? "w-[56%] max-w-[300px]" : "w-[54%] max-w-[210px]")}>
        <div
          className={cn(
            "relative flex aspect-[4/3.1] w-full flex-col overflow-hidden rounded-[3px] bg-[#fffdf9] text-left shadow-[0_1px_1px_rgba(28,25,23,0.06),0_14px_28px_-10px_rgba(28,25,23,0.35)]",
          )}
        >
          <div className={cn(t.band, lg ? "h-3" : "h-2")} />
          <div className={cn("flex flex-1 flex-col", lg ? "gap-2 p-6" : "gap-1 p-3.5")}>
            <span className={cn("truncate font-semibold uppercase tracking-[0.14em] text-gray-500", lg ? "text-xs" : "text-[9px]")}>
              {brand || form || "\u00a0"}
            </span>
            <span className={cn("line-clamp-2 font-display font-semibold leading-[1.1] text-ink", lg ? "text-[32px]" : "text-[17px]")}>
              {cleanName}
            </span>
            <span className={cn("mt-auto flex items-end justify-between gap-2", lg ? "text-sm" : "text-[10px]")}>
              <span className={cn("font-semibold text-ink", lg ? "text-lg" : "text-xs")}>{strength}</span>
              <span className="truncate text-gray-500">{form}</span>
            </span>
          </div>
          <div className={cn("absolute bottom-0 left-0 right-0", t.band, "h-[3px] opacity-60")} />
        </div>
        <div className="absolute -right-[7%] top-[3px] bottom-[3px] w-[7%] rounded-r-[3px] bg-gradient-to-r from-black/[0.10] to-black/[0.02] [transform:skewY(-20deg)] origin-left" />
      </div>
    </div>
  );
}
