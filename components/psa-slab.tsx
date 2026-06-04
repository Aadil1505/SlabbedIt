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
 * The label is a printed PSA-style grade lockup driven by `label`; the `logo`
 * prop supplies the small brand mark on it (defaults to the PSA logo).
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

// Crisp scribe marks at the card edge — one per side, broken at the corners so
// they read as four separate engraved lines rather than a closed frame.
const SCRIBE_H =
  "pointer-events-none absolute h-[0.12cqw] bg-[rgba(90,103,122,0.45)] shadow-[0_0.14cqw_0.16cqw_-0.02cqw_rgba(255,255,255,0.7)]";
const SCRIBE_V =
  "pointer-events-none absolute w-[0.12cqw] bg-[rgba(90,103,122,0.45)] shadow-[0.14cqw_0_0.16cqw_-0.02cqw_rgba(255,255,255,0.7)]";

/** Printed details for the "accurate" label mode. */
export type LabelData = {
  name: string;
  set: string;
  year: string;
  number: string;
  grade: string;
  gradeLabel: string;
  cert: string;
};

type PSASlabProps = {
  /** Card image URL or data URI. Falls back to a holo placeholder. */
  src?: string;
  alt?: string;
  /** The small grading-company brand mark printed on the label. */
  logo?: React.ReactNode;
  /** Label trim color (the grading company's house color). */
  labelColor?: string;
  /** Printed details for the grade lockup (grade, identity, cert). */
  label: LabelData;
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
  labelColor = "#cf1f2e",
  label,
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
          "relative flex aspect-100/161 w-full flex-col gap-[3cqw]",
          "rounded-[3cqw] px-[8cqw] pt-[5.5cqw] pb-[8.5cqw]",
          "shadow-[0_1.6cqw_5cqw_rgba(15,20,32,0.4),0_0.3cqw_1cqw_rgba(15,20,32,0.3)]",
          selfTilt &&
            "transition-transform duration-500 ease-out will-change-transform transform-[perspective(1400px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] motion-reduce:transition-none motion-reduce:transform-none",
          "animate-in fade-in zoom-in-95 duration-700 motion-reduce:animate-none",
        )}
      >
        {/* Acrylic face — translucent fill, frosted backdrop, and the beveled
            inset shadows. Kept on its own layer (behind the content) so the
            backdrop-filter isn't on the same element as the tilt transform. */}
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[linear-gradient(152deg,rgba(249,250,252,0.86)_0%,rgba(235,238,243,0.8)_46%,rgba(221,226,233,0.78)_78%,rgba(231,235,240,0.84)_100%)] backdrop-blur-[0.5cqw] backdrop-saturate-[1.1] shadow-[inset_0_0_0_0.35cqw_rgba(255,255,255,0.95),inset_0_1.4cqw_2.6cqw_rgba(255,255,255,0.95),inset_0_-2cqw_3.6cqw_rgba(120,132,150,0.34),inset_-2cqw_0_3cqw_-0.3cqw_rgba(255,255,255,0.65),inset_2cqw_0_3cqw_-0.3cqw_rgba(255,255,255,0.65),inset_-0.5cqw_0_0.6cqw_rgba(150,160,176,0.12),inset_0.5cqw_0_0.6cqw_rgba(150,160,176,0.12)]" />

        {/* Printed PSA-style grade label. Its negative margin widens it past
            the card toward the tub while leaving a band of acrylic on each
            side. */}
        <AccurateLabel label={label} labelColor={labelColor} logo={logo} />

        {/* Card window */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {/* Card well — height-driven (fills the window height, width follows
              the 5/7 ratio, capped to the width) so the whole card always fits
              and never crops, whatever the label's height. The card is centered,
              and the beveled channel hugs it. */}
          <div className="relative h-full max-w-full aspect-5/7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src || PLACEHOLDER_SRC}
              alt={alt}
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_SRC;
              }}
              // Fill the well exactly so the card is centered and the beveled
              // channel around it stays even on all four sides.
              className="block h-full w-full rounded-[0.9cqw] object-cover"
            />

            {/* Card-well channel — the card is sunk a second step into the tub
                floor. A beveled channel rings it: raised lip highlight outside,
                dark wall dropping to the card, lower wall catching light. */}
            <span className="pointer-events-none absolute inset-[-1.7cqw] rounded-[1.7cqw] shadow-[0_-0.25cqw_0.3cqw_-0.05cqw_rgba(255,255,255,0.72),0_0.3cqw_0.4cqw_-0.1cqw_rgba(28,36,50,0.26),inset_0_0.55cqw_0.7cqw_-0.25cqw_rgba(28,36,50,0.44),inset_0_-0.45cqw_0.6cqw_-0.3cqw_rgba(255,255,255,0.72),inset_0.5cqw_0_0.7cqw_-0.35cqw_rgba(28,36,50,0.2),inset_-0.5cqw_0_0.7cqw_-0.35cqw_rgba(255,255,255,0.4)]" />
            {/* Crisp scribe marks at the card edge — four separate lines,
                broken at the corners so they don't connect into a frame. */}
            <span className={cn(SCRIBE_H, "left-[12%] right-[12%] top-[-0.5cqw]")} />
            <span className={cn(SCRIBE_H, "left-[12%] right-[12%] bottom-[-0.5cqw]")} />
            <span className={cn(SCRIBE_V, "top-[12%] bottom-[12%] left-[-0.5cqw]")} />
            <span className={cn(SCRIBE_V, "top-[12%] bottom-[12%] right-[-0.5cqw]")} />
          </div>
        </div>

        {/* Inner tub — the whole label+card area is recessed a step below the
            slab face. Lit from above, so the step reads as: a bright lip on the
            raised outer edge, a dark wall on the way down, then the lower wall
            catching light. The four directional pairs carve the tub's edges. */}
        <div className="pointer-events-none absolute inset-[2.6cqw] rounded-[2.4cqw] shadow-[0_-0.3cqw_0.4cqw_-0.05cqw_rgba(255,255,255,0.85),0_0.4cqw_0.5cqw_-0.15cqw_rgba(28,36,50,0.28),inset_0_0.9cqw_1.1cqw_-0.4cqw_rgba(28,36,50,0.4),inset_0_-0.7cqw_0.9cqw_-0.45cqw_rgba(255,255,255,0.8),inset_0.85cqw_0_1cqw_-0.5cqw_rgba(28,36,50,0.22),inset_-0.85cqw_0_1cqw_-0.5cqw_rgba(255,255,255,0.45)]" />

        {/* Gloss sheen — fixed diagonal + cursor-tracking highlight */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-[radial-gradient(circle_at_var(--mx,50%)_var(--my,26%),rgba(255,255,255,0.28),rgba(255,255,255,0)_44%),linear-gradient(118deg,transparent_38%,rgba(255,255,255,0.22)_47%,rgba(255,255,255,0.03)_55%,transparent_62%)]" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- accurate label */

// A faithful PSA "flip" modelled on a real label: white field inside red trim.
// Left = identity block (YEAR BRAND / NAME / SET) over the barcode. Right = a
// uniform, evenly-spaced four-line column (#number / grade label / grade / cert)
// — the grade is NOT enlarged, and the cert is black, matching the real label.
// The PSA mark sits on a silver chip straddling the bottom trim. Text is the
// condensed grotesque PSA uses (Univers Condensed, Roboto Condensed fallback).
// Material colors are literal by design (DESIGN.md).
function AccurateLabel({
  label,
  labelColor,
  logo,
}: {
  label: LabelData;
  labelColor: string;
  logo: React.ReactNode;
}) {
  const line1 = [label.year, "POKEMON"].filter(Boolean).join(" ");

  return (
    <div
      style={{
        borderColor: labelColor,
        fontFamily: "var(--font-univers), var(--font-condensed), sans-serif",
      }}
      className="relative -mx-[3.5cqw] rounded-[1cqw] border-[0.9cqw] bg-white text-[#161616] uppercase shadow-[0_0.4cqw_1cqw_rgba(0,0,0,.12)]"
    >
      <div className="flex items-stretch gap-[2cqw] px-[2.8cqw] py-[2.6cqw]">
        {/* Identity (top) over barcode (bottom) */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-[2.4cqw]">
          <div className="flex min-w-0 flex-col font-normal leading-[1.16] tracking-[0.01em]">
            <span className="truncate text-[4cqw]">{line1}</span>
            <span className="truncate text-[4cqw]">{label.name || "—"}</span>
            {label.set ? (
              <span className="truncate text-[4cqw]">{label.set}</span>
            ) : null}
          </div>
          <span
            aria-hidden
            className="h-[3.8cqw] w-[30cqw] bg-[repeating-linear-gradient(90deg,#161616_0_0.26cqw,transparent_0.26cqw_0.64cqw)]"
          />
        </div>

        {/* Uniform right column: number / grade label / grade / cert, all
            flush to the right edge of the label. */}
        <div className="flex shrink-0 flex-col items-end justify-between text-right font-normal leading-[1.05] tracking-[0.01em]">
          <span className="text-[4cqw]">{label.number ? `#${label.number}` : "—"}</span>
          <span className="text-[4cqw]">{label.gradeLabel}</span>
          <span className="text-[4cqw]">{label.grade}</span>
          <span className="text-[4cqw]">{label.cert}</span>
        </div>
      </div>

      {/* PSA mark on a silver chip straddling the bottom trim (the "connects to
          lighthouse" cue), breaking the red border. */}
      <span className="absolute bottom-[-1.1cqw] left-1/2 flex -translate-x-1/2 items-center rounded-[0.3cqw] bg-[linear-gradient(135deg,#e9ebef,#c7ccd6)] px-[1.1cqw] py-[0.6cqw] shadow-[0_0_0.3cqw_rgba(0,0,0,0.15)] [&_img]:!block [&_img]:!h-[3.8cqw] [&_img]:!w-auto">
        {logo}
      </span>
    </div>
  );
}
