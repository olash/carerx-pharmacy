/**
 * CareRx spot illustrations — a small, consistent set for explaining the
 * service (how it works, empty states). Drawn on a 160×120 grid with a single
 * 1.5px line weight. Lines use `currentColor`, so they adapt to light or dark
 * sections; fills use the brand Forest + Marigold tokens sparingly.
 */
import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type Props = SVGProps<SVGSVGElement> & { tone?: "light" | "dark" };

function Frame({ children, className, tone = "light", ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-auto w-full", tone === "dark" ? "text-paper" : "text-ink", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

const paper = (tone?: string) => (tone === "dark" ? "rgba(255,255,255,0.06)" : "var(--color-paper)");
const white = (tone?: string) => (tone === "dark" ? "rgba(255,255,255,0.1)" : "#fff");

/** A phone with a list and a prescription slip — "Tell us what you need". */
export function IlloRequest(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="80" cy="108" rx="54" ry="5" fill={paper(p.tone)} stroke="none" />
      <rect x="86" y="30" width="44" height="58" rx="3" fill={white(p.tone)} transform="rotate(8 108 59)" />
      <path d="M96 44h22M95 52h18M94 60h20" transform="rotate(8 108 59)" opacity="0.6" />
      <text x="93" y="80" transform="rotate(8 108 59)" fontSize="13" fontFamily="var(--font-newsreader), serif" fontStyle="italic" fill="var(--color-brand-500)" stroke="none">Rx</text>
      <rect x="40" y="16" width="48" height="86" rx="9" fill={white(p.tone)} />
      <path d="M58 22h12" />
      <rect x="47" y="34" width="34" height="9" rx="2" />
      <circle cx="51" cy="54" r="2.5" fill="var(--color-brand-500)" stroke="none" />
      <path d="M57 54h20" />
      <circle cx="51" cy="64" r="2.5" fill="var(--color-brand-500)" stroke="none" />
      <path d="M57 64h16" />
      <circle cx="51" cy="74" r="2.5" fill="var(--color-marigold-400)" stroke="none" />
      <path d="M57 74h18" />
      <rect x="47" y="84" width="34" height="9" rx="4.5" fill="var(--color-brand-600)" stroke="none" />
    </Frame>
  );
}

/** A clipboard being checked, with a capsule — "A pharmacist checks it". */
export function IlloReview(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="80" cy="108" rx="54" ry="5" fill={paper(p.tone)} stroke="none" />
      <rect x="44" y="18" width="56" height="80" rx="4" fill={white(p.tone)} />
      <rect x="60" y="13" width="24" height="10" rx="3" fill={paper(p.tone)} />
      <path d="M53 38l4 4 7-8" stroke="var(--color-brand-500)" strokeWidth={2} />
      <path d="M70 39h22" opacity="0.6" />
      <path d="M53 56l4 4 7-8" stroke="var(--color-brand-500)" strokeWidth={2} />
      <path d="M70 57h18" opacity="0.6" />
      <circle cx="58" cy="76" r="5" />
      <path d="M70 76h20" opacity="0.6" />
      <g transform="rotate(-35 116 74)">
        <rect x="100" y="66" width="32" height="15" rx="7.5" fill={white(p.tone)} />
        <path d="M116 66v15" />
        <path d="M100 73.5a7.5 7.5 0 0 1 7.5-7.5H116v15h-8.5a7.5 7.5 0 0 1-7.5-7.5z" fill="var(--color-marigold-400)" stroke="none" />
        <rect x="100" y="66" width="32" height="15" rx="7.5" />
      </g>
    </Frame>
  );
}

/** A sealed pharmacy bag at a door — "Delivered to you". */
export function IlloDelivery(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="80" cy="108" rx="58" ry="5" fill={paper(p.tone)} stroke="none" />
      <path d="M28 104V22h44v82" />
      <rect x="32" y="26" width="36" height="78" fill={paper(p.tone)} stroke="none" />
      <circle cx="62" cy="66" r="2" fill="currentColor" stroke="none" />
      <path d="M86 52h48l-4 52H90z" fill={white(p.tone)} />
      <path d="M98 52v-6a12 12 0 0 1 24 0v6" />
      <rect x="99" y="64" width="22" height="22" rx="3" fill="var(--color-brand-600)" stroke="none" />
      <path d="M110 69v12M104 75h12" stroke="#fff" strokeWidth={2.5} />
      <path d="M86 96h46" opacity="0.4" />
      <path d="M138 34c6 4 6 12 0 16" opacity="0.5" />
      <path d="M144 30c9 6 9 18 0 24" opacity="0.3" />
    </Frame>
  );
}

/** Two speech bubbles, one with a cross — "Talk to a pharmacist". */
export function IlloChat(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="80" cy="108" rx="52" ry="5" fill={paper(p.tone)} stroke="none" />
      <path d="M26 24h64a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H50l-12 11V68H26a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8z" fill={white(p.tone)} />
      <path d="M32 38h48M32 48h36M32 58h42" opacity="0.6" />
      <path d="M70 54h64a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8h-10v11l-12-11H70a8 8 0 0 1-8-8V62a8 8 0 0 1 8-8z" fill="var(--color-brand-600)" stroke="none" />
      <path d="M96 67v14M89 74h14" stroke="#fff" strokeWidth={2.5} />
      <circle cx="122" cy="74" r="3" fill="var(--color-marigold-400)" stroke="none" />
    </Frame>
  );
}

/** A receipt with a naira mark — "Pay on delivery". */
export function IlloPayOnDelivery(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="80" cy="108" rx="50" ry="5" fill={paper(p.tone)} stroke="none" />
      <path d="M52 14h56v86l-7-5-7 5-7-5-7 5-7-5-7 5-7-5-7 5z" fill={white(p.tone)} />
      <path d="M62 30h36M62 40h28M62 50h32" opacity="0.6" />
      <path d="M62 64h36" />
      <text x="62" y="84" fontSize="16" fontFamily="var(--font-newsreader), serif" fontWeight="600" fill="currentColor" stroke="none">₦</text>
      <path d="M76 79h22" strokeWidth={2} />
      <circle cx="114" cy="78" r="13" fill="var(--color-brand-600)" stroke="none" />
      <path d="M108 78l4 4 8-9" stroke="#fff" strokeWidth={2.2} />
    </Frame>
  );
}

/** An open, empty pharmacy bag — empty states. */
export function IlloEmptyBag(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="80" cy="106" rx="44" ry="5" fill={paper(p.tone)} stroke="none" />
      <path d="M50 44h60l-5 58H55z" fill={white(p.tone)} />
      <path d="M66 44v-8a14 14 0 0 1 28 0v8" />
      <path d="M50 44l-6-10h72l-6 10" fill={paper(p.tone)} />
      <path d="M73 70h14M80 63v14" stroke="var(--color-brand-500)" strokeWidth={2.2} />
      <circle cx="122" cy="30" r="2.5" fill="var(--color-marigold-400)" stroke="none" />
      <circle cx="36" cy="58" r="2" fill="var(--color-brand-300)" stroke="none" />
    </Frame>
  );
}
