"use client";

import { cn } from "@/lib/utils";
import { useTilt } from "@/lib/use-tilt";
import { useInsideBumper } from "@/lib/bumper-context";

/**
 * PSASlab
 * -------
 * A pure CSS/DOM "graded slab" frame that wraps any trading card image to look
 * like it's sealed in a PSA-style case. No 3D, no canvas.
 *
 * - Scales to its parent width via a CSS container (everything sized in `cqw`),
 *   so it works in a 200px box or a 400px box with no prop changes.
 * - Depth (acrylic bevel, floor shadow, gloss) is all Tailwind arbitrary
 *   utilities — no custom CSS. The multi-layer shadows are long but local.
 * - The gloss highlight and a subtle perspective tilt both follow the cursor
 *   (disable the tilt with `interactive={false}`).
 *
 * Logo-mode only: the label shows a single centered mark. Defaults to the PSA
 * logo in /public; override it with the `logo` prop to drop in your own art.
 */

const PLACEHOLDER_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700">
    <defs>
      <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c8e6ff"/>
        <stop offset="0.35" stop-color="#ffd9f0"/>
        <stop offset="0.7" stop-color="#d9ffe6"/>
        <stop offset="1" stop-color="#fff0c8"/>
      </linearGradient>
    </defs>
    <rect width="500" height="700" rx="26" fill="url(#holo)"/>
    <rect x="26" y="26" width="448" height="648" rx="16" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.7"/>
    <circle cx="250" cy="300" r="120" fill="#ffffff" opacity="0.55"/>
    <text x="250" y="312" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#5b6470">DROP</text>
    <text x="250" y="362" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#5b6470">A CARD</text>
    <rect x="60" y="540" width="380" height="90" rx="10" fill="#ffffff" opacity="0.55"/>
  </svg>`);

// Recessed channel lines that run along each side of the card well. Same
// engraved treatment as the inner-well line (faint dark line + a soft
// highlight beside it), but broken at the corners so they don't connect.
const CARD_GROOVE_H =
  "pointer-events-none absolute h-[0.16cqw] bg-[rgba(110,123,142,0.45)] shadow-[0_0.18cqw_0.22cqw_-0.1cqw_rgba(255,255,255,0.8)]";
const CARD_GROOVE_V =
  "pointer-events-none absolute w-[0.16cqw] bg-[rgba(110,123,142,0.45)] shadow-[0.18cqw_0_0.22cqw_-0.1cqw_rgba(255,255,255,0.8)]";

type PSASlabProps = {
  /** Card image URL or data URI. Falls back to a holo placeholder. */
  src?: string;
  alt?: string;
  /** Override the centered label mark. Defaults to the PSA logo. */
  logo?: React.ReactNode;
  /** Cursor-follow tilt + gloss. Default true. */
  interactive?: boolean;
  className?: string;
};

function DefaultMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/psa.png"
      alt="PSA"
      draggable={false}
      className="h-[9cqw] w-auto select-none object-contain"
    />
  );
}

export function PSASlab({
  src,
  alt = "Graded trading card",
  logo = <DefaultMark />,
  interactive = true,
  className,
}: PSASlabProps) {
  // Inside a bumper, the bumper drives the tilt for the whole assembly, so the
  // slab disables its own (its gloss still tracks via inherited --mx/--my).
  const bumped = useInsideBumper();
  const selfTilt = interactive && !bumped;
  const { ref, handlers } = useTilt<HTMLDivElement>(selfTilt);

  return (
    <div
      className={cn("@container relative w-full", className)}
    >
      {/* Floor shadow — anchors the slab when standalone. A bumper supplies
          its own, so skip it when wrapped. */}
      {!bumped ? (
        <div className="pointer-events-none absolute inset-x-[8%] bottom-[-3cqw] h-[10cqw] blur-[2cqw] bg-[radial-gradient(ellipse_at_center,rgba(8,11,18,0.55)_0%,rgba(8,11,18,0.28)_45%,transparent_72%)]" />
      ) : null}

      <div
        ref={ref}
        {...handlers}
        className={cn(
          "relative flex aspect-100/161 w-full flex-col gap-[6cqw]",
          "rounded-[4cqw] px-[5cqw] pt-[5cqw] pb-[13cqw]",
          "shadow-[0_1.6cqw_5cqw_rgba(15,20,32,0.4),0_0.3cqw_1cqw_rgba(15,20,32,0.3)]",
          selfTilt &&
            "transition-transform duration-500 ease-out will-change-transform transform-[perspective(1400px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] motion-reduce:transition-none motion-reduce:transform-none",
          "animate-in fade-in zoom-in-95 duration-700",
        )}
      >
        {/* Acrylic face — translucent fill, frosted backdrop, and the beveled
            inset shadows. Kept on its own layer (behind the content) so the
            backdrop-filter isn't on the same element as the tilt transform. */}
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[linear-gradient(152deg,rgba(252,253,254,0.5)_0%,rgba(238,241,245,0.38)_46%,rgba(223,227,234,0.34)_78%,rgba(232,235,240,0.44)_100%)] backdrop-blur-[0.5cqw] backdrop-saturate-[1.1] shadow-[inset_0_0_0_0.4cqw_rgba(255,255,255,0.85),inset_0_1.2cqw_2.4cqw_rgba(255,255,255,0.95),inset_0_-1.8cqw_3.4cqw_rgba(120,132,150,0.45),inset_-1.4cqw_0_2.6cqw_rgba(120,132,150,0.18),inset_1.4cqw_0_2.6cqw_rgba(255,255,255,0.55)]" />

        {/* Label — clean logo bar */}
        <div className="flex items-center justify-center rounded-[1.4cqw] border-[0.7cqw] border-[#cf1f2e] bg-white px-[2cqw] py-[5cqw] shadow-[0_0.4cqw_1cqw_rgba(0,0,0,.12)]">
          {logo}
        </div>

        {/* Card window */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {/* Card well — sized to the card so the grooves hug its edges */}
          <div className="relative h-full max-w-full aspect-5/7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src || PLACEHOLDER_SRC}
              alt={alt}
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_SRC;
              }}
              // className="h-full w-full rounded-[1.4cqw] object-contain shadow-[0_0.8cqw_1.8cqw_rgba(0,0,0,.22),0_0.2cqw_0.5cqw_rgba(0,0,0,.18)]"
            />

            {/* Four recessed channel lines, broken at the corners */}
            <span className={cn(CARD_GROOVE_H, "left-[14%] right-[14%] top-[-1.8cqw]")} />
            <span className={cn(CARD_GROOVE_H, "left-[14%] right-[14%] bottom-[-1.8cqw]")} />
            <span className={cn(CARD_GROOVE_V, "top-[14%] bottom-[14%] left-[-1.8cqw]")} />
            <span className={cn(CARD_GROOVE_V, "top-[14%] bottom-[14%] right-[-1.8cqw]")} />
          </div>
        </div>

        {/* Engraved inner-well line — the recessed step around label + card */}
        <div className="pointer-events-none absolute inset-[2.8cqw] rounded-[3cqw] border-[0.18cqw] border-[rgba(110,123,142,0.5)] shadow-[0_0.2cqw_0.2cqw_-0.05cqw_rgba(255,255,255,0.85),inset_0_0.22cqw_0.28cqw_-0.1cqw_rgba(15,20,32,0.28)]" />

        {/* Gloss sheen — fixed diagonal + cursor-tracking highlight */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-[radial-gradient(circle_at_var(--mx,50%)_var(--my,26%),rgba(255,255,255,0.28),rgba(255,255,255,0)_44%),linear-gradient(118deg,transparent_38%,rgba(255,255,255,0.22)_47%,rgba(255,255,255,0.03)_55%,transparent_62%)]" />
      </div>
    </div>
  );
}
