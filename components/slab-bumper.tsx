"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/lib/use-tilt";
import { BumperContext } from "@/lib/bumper-context";

/**
 * SlabBumper
 * ----------
 * A molded protective bumper (think GradedGuard) that wraps a graded slab.
 * Pure wrapper: drop a <PSASlab /> in as children and the bumper frames it.
 * The slab is `@container`-sized, so it reflows to the bumper's inner width.
 *
 * Everything is sized in `cqw` relative to the bumper's own width. The body
 * color drives all shading via `color-mix`, so one `color` prop restyles the
 * whole guard. The bumper owns the cursor tilt for the whole assembly; the
 * wrapped slab reads the inherited --mx/--my for its gloss but doesn't tilt
 * itself (see BumperContext).
 */

// Embedded-glitter texture for translucent bodies: fractal-noise speckles
// thresholded down to sparse bright flecks (the feColorMatrix alpha row
// multiplies the noise hard and biases negative, so only the peaks survive).
// Tiled and screen-blended over the frosted fill, it reads as glitter
// suspended in clear plastic.
const SPARKLE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="s"><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 17 -10.5"/></filter><rect width="140" height="140" filter="url(#s)"/></svg>`,
);
const SPARKLE_URI = `url("data:image/svg+xml,${SPARKLE_SVG}")`;

type BumperPreset = { color: string; translucent?: boolean };

const BUMPER_PRESETS = {
  black: { color: "#1c2026" },
  graphite: { color: "#39404c" },
  white: { color: "#e8ebf0" },
  red: { color: "#dd3a2a" },
  blue: { color: "#2f6df0" },
  green: { color: "#1fae6b" },
  purple: { color: "#7c4dff" },
  pink: { color: "#ff5fa2" },
  gold: { color: "#d9a441" },
  clear: { color: "#cdd5e0", translucent: true },
  smoke: { color: "#39414f", translucent: true },
  glow: { color: "#a6ff5c", translucent: true },
} as const satisfies Record<string, BumperPreset>;

export type BumperColorName = keyof typeof BUMPER_PRESETS;
type BumperColor = BumperColorName | (string & {});

// `radius` is tuned so the window's inner corner (outer radius − padding)
// matches the slab's own 3cqw corner, so the frame hugs the slab with no gap.
// (the slab is the bumper's content box, so its 3cqw corner is 3·(1 − 2·pad/100)
// in bumper units; outer radius = that + pad, i.e. ≈ 3 + 0.94·pad.)
const THICKNESS = {
  slim: { pad: "p-[3cqw]", radius: "rounded-[5.8cqw]" },
  standard: { pad: "p-[4.5cqw]", radius: "rounded-[7.2cqw]" },
  chunky: { pad: "p-[6.5cqw]", radius: "rounded-[9.1cqw]" },
} as const;

type BumperThickness = keyof typeof THICKNESS;

// Gradient-border mask: fills only the padding ring, punching out the content
// box. Turns a full panel into a frame with a transparent center.
// Longhands only — the `mask` shorthand resets mask-composite back to `add`,
// which silently defeats the exclude (the hole never gets punched).
const RING_MASK =
  "[mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [mask-clip:content-box,border-box] [mask-composite:exclude] [-webkit-mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [-webkit-mask-clip:content-box,border-box] [-webkit-mask-composite:xor]";

// A single corner screw: domed metal head with a slot.
const SCREW =
  "pointer-events-none absolute z-10 h-[2.2cqw] w-[2.2cqw] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f4f6f9,#b9c0cc_55%,#828a98)] shadow-[inset_0_0_0.35cqw_rgba(0,0,0,0.45),0_0.18cqw_0.25cqw_rgba(0,0,0,0.4)]";
const SCREW_SLOT =
  "absolute left-1/2 top-1/2 h-[0.28cqw] w-[1.3cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(70,78,92,0.7)]";
const SCREW_POS = [
  "left-[1.8cqw] top-[1.8cqw]",
  "right-[1.8cqw] top-[1.8cqw]",
  "left-[1.8cqw] bottom-[1.8cqw]",
  "right-[1.8cqw] bottom-[1.8cqw]",
];

type SlabBumperProps = {
  /** Wrapped content — typically a <PSASlab />. */
  children: ReactNode;
  /** Preset name (black, red, clear, …) or any CSS color. Drives all shading. */
  color?: BumperColor;
  /** Frame width + corner mass. */
  thickness?: BumperThickness;
  /** Force a see-through material (presets like `clear`/`smoke` set this too). */
  translucent?: boolean;
  /** Surface finish: flat matte or a glossy sheen. */
  finish?: "matte" | "gloss";
  /** Show corner screw accents. */
  screws?: boolean;
  /** Cursor-follow tilt for the whole assembly. Default true. */
  interactive?: boolean;
  className?: string;
};

export function SlabBumper({
  children,
  color = "red",
  thickness = "standard",
  translucent,
  finish = "matte",
  screws = false,
  interactive = true,
  className,
}: SlabBumperProps) {
  const preset = BUMPER_PRESETS[color as BumperColorName] as
    | BumperPreset
    | undefined;
  const base = preset?.color ?? color;
  const isClear = translucent ?? preset?.translucent ?? false;

  const { ref, handlers } = useTilt<HTMLDivElement>(interactive);
  const { pad, radius } = THICKNESS[thickness];

  // Body face: the molded material, masked to a RING so it only exists around
  // the slab's edge — nothing sits behind the slab, so the slab's own acrylic
  // is untouched. Translucent swaps the gradient for a frosted see-through fill.
  const face = isClear
    ? "bg-[color-mix(in_srgb,var(--bumper)_46%,transparent)] backdrop-blur-[1.6cqw] backdrop-saturate-[1.2]"
    : "bg-[linear-gradient(160deg,color-mix(in_srgb,var(--bumper),white_22%),var(--bumper)_44%,color-mix(in_srgb,var(--bumper),black_30%))]";

  return (
    <BumperContext.Provider value={true}>
      <div
        style={{ "--bumper": base } as CSSProperties}
        className={cn("@container relative w-full", className)}
      >
        {/* Floor shadow for the whole assembly */}
        <div className="pointer-events-none absolute inset-x-[8%] bottom-[-3cqw] h-[10cqw] blur-[2cqw] bg-[radial-gradient(ellipse_at_center,rgba(8,11,18,0.55)_0%,rgba(8,11,18,0.28)_45%,transparent_72%)]" />

        {/* Bumper body — carries the tilt transform + outer drop shadow only;
            the colored face/backdrop lives on a separate layer so the
            backdrop-filter isn't on the transformed element. */}
        <div
          ref={ref}
          {...handlers}
          className={cn(
            "relative",
            pad,
            radius,
            "shadow-[0_2cqw_5cqw_rgba(8,11,18,0.45)]",
            interactive &&
              "transition-transform duration-500 ease-out will-change-transform transform-[perspective(1500px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] motion-reduce:transition-none motion-reduce:transform-none",
            "animate-in fade-in zoom-in-95 duration-700",
          )}
        >
          {/* Colored acrylic/TPU face — masked to a ring (frame only); its own
              padding sets the ring width, matching the body padding so the ring
              meets the slab edge. The center is transparent (no fill behind the
              slab). */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
              pad,
              RING_MASK,
              face,
            )}
          />

          {/* Embedded glitter (translucent bodies only) — a tiled sparkle
              texture screen-blended onto the frosted frame, masked to the same
              ring so it only sits in the plastic, not over the slab. */}
          {isClear ? (
            <div
              style={{ backgroundImage: SPARKLE_URI, backgroundSize: "13cqw 13cqw" }}
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-repeat opacity-70 mix-blend-screen",
                pad,
                RING_MASK,
              )}
            />
          ) : null}

          {/* Slab cavity — the slab sits recessed inside the frame window */}
          <div className="relative">
            {children}

            {/* Molded well. The frame is a thick piece of plastic with the slab
                dropped into a recess, lit from above:
                  · outset above the slab  → bright top lip of the frame wall
                  · outset below the slab  → the wall's own drop shadow on the frame
                  · inset from the top      → cast shadow falling onto the slab
                  · inset from the bottom   → the lower wall catches light (chamfer)
                  · inset sides             → soft side walls of the channel
                The asymmetry (dark top / lit bottom) is what reads as real depth. */}
            <div className="pointer-events-none absolute inset-0 rounded-[2.7cqw] shadow-[0_-0.45cqw_0.7cqw_-0.15cqw_color-mix(in_srgb,var(--bumper),white_55%),0_0.7cqw_0.8cqw_-0.2cqw_rgba(0,0,0,0.5),inset_0_1.1cqw_1.4cqw_-0.35cqw_rgba(0,0,0,0.55),inset_0_-0.55cqw_0.7cqw_-0.3cqw_rgba(255,255,255,0.32),inset_1cqw_0_1.3cqw_-0.55cqw_rgba(0,0,0,0.3),inset_-1cqw_0_1.3cqw_-0.55cqw_rgba(0,0,0,0.3)]" />

            {/* Bright inner lip — a thin highlight where the top chamfer of the
                frame wall catches the overhead light, just outside the slab. */}
            <div className="pointer-events-none absolute inset-[-0.5cqw] rounded-[3.2cqw] shadow-[inset_0_0.5cqw_0.35cqw_-0.3cqw_color-mix(in_srgb,var(--bumper),white_60%)]" />
          </div>

          {/* Glossy surface sheen (gloss finish only) */}
          {finish === "gloss" ? (
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(150deg,rgba(255,255,255,0.4)_0%,transparent_28%,transparent_72%,rgba(255,255,255,0.1)_100%)]" />
          ) : null}

          {/* Corner screws */}
          {screws
            ? SCREW_POS.map((pos) => (
                <span key={pos} className={cn(SCREW, pos)}>
                  <span className={SCREW_SLOT} />
                </span>
              ))
            : null}
        </div>
      </div>
    </BumperContext.Provider>
  );
}
