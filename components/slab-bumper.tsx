"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/lib/use-tilt";
import { BumperContext } from "@/lib/bumper-context";

/**
 * SlabBumper
 * ----------
 * A molded protective bumper (think GradedGuard) that wraps a graded slab.
 * Pure wrapper: drop a <PSASlab /> in as children and the bumper frames it.
 * The wrapped slab keeps its own width while bumper material grows outward.
 *
 * Everything is sized in `cqw` relative to the slab's fixed width. The body
 * color drives all shading via `color-mix`, so one `color` prop restyles the
 * whole guard. The bumper owns the cursor tilt for the whole assembly; the
 * wrapped slab reads the inherited --mx/--my for its gloss but doesn't tilt
 * itself (see BumperContext).
 */

type BumperPreset = { color: string; translucent?: boolean };

export const BUMPER_PRESETS = {
  black: { color: "#1c2026" },
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

// Padding is applied to absolutely positioned ring layers outside the slab,
// never to the slab's layout box. Switching thickness therefore changes only
// the bumper's outer dimensions.
const THICKNESS = {
  slim: { pad: "3cqw" },
  standard: { pad: "4.5cqw" },
  chunky: { pad: "6.5cqw" },
} as const;

type BumperThickness = keyof typeof THICKNESS;

type SlabBumperProps = {
  /** Wrapped content — typically a <PSASlab />. */
  children: ReactNode;
  /** Preset name (black, red, clear, …) or any CSS color. Drives all shading. */
  color?: BumperColor;
  /** Frame width + corner mass. */
  thickness?: BumperThickness;
  /** Outer corner radius in slab-relative cqw units. */
  radius?: number;
  /** Force a see-through material (presets like `clear`/`smoke` set this too). */
  translucent?: boolean;
  /** Surface finish: flat matte or a glossy sheen. */
  finish?: "matte" | "gloss";
  /** Cursor-follow tilt for the whole assembly. Default true. */
  interactive?: boolean;
  className?: string;
};

export function SlabBumper({
  children,
  color = "red",
  thickness = "standard",
  radius = 7.2,
  translucent,
  finish = "matte",
  interactive = true,
  className,
}: SlabBumperProps) {
  const preset = BUMPER_PRESETS[color as BumperColorName] as
    | BumperPreset
    | undefined;
  const base = preset?.color ?? color;
  const isClear = translucent ?? preset?.translucent ?? false;
  const id = useId().replaceAll(":", "");
  const faceGradientId = `bumper-face-${id}`;
  const glossGradientId = `bumper-gloss-${id}`;

  const { ref, handlers } = useTilt<HTMLDivElement>(interactive);
  const { pad } = THICKNESS[thickness];

  return (
    <BumperContext.Provider value={true}>
      <div
        style={
          {
            "--bumper": base,
            "--bumper-pad": pad,
            "--bumper-radius": `${radius}cqw`,
          } as CSSProperties
        }
        className={cn("@container relative w-full", className)}
      >
        {/* Floor shadow for the whole assembly */}
        <div className="pointer-events-none absolute inset-x-[8%] bottom-[-3cqw] h-[10cqw] blur-[2cqw] bg-[radial-gradient(ellipse_at_center,rgba(8,11,18,0.55)_0%,rgba(8,11,18,0.28)_45%,transparent_72%)]" />

        {/* Bumper body — carries the tilt transform. The colored face is a
            separate SVG ring so its center stays genuinely transparent. */}
        <div
          ref={ref}
          {...handlers}
          className={cn(
            "relative isolate",
            interactive &&
              "transition-transform duration-500 ease-out will-change-transform transform-[perspective(1500px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] motion-reduce:transition-none motion-reduce:transform-none",
          )}
        >
          {/* A real stroked ring keeps the center physically empty. CSS mask
              subtraction looks right live but is dropped by foreignObject
              rasterizers, which made exported slabs inherit the bumper color. */}
          <svg
            aria-hidden
            className="pointer-events-none absolute top-[calc(-1*var(--bumper-pad))] left-[calc(-1*var(--bumper-pad))] -z-10 size-[calc(100%+2*var(--bumper-pad))] overflow-visible drop-shadow-[0_2cqw_5cqw_rgba(8,11,18,0.45)]"
          >
            <defs>
              <linearGradient
                id={faceGradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={`color-mix(in srgb, ${base}, white 22%)`}
                  stopOpacity={isClear ? 0.68 : 1}
                />
                <stop
                  offset="44%"
                  stopColor={base}
                  stopOpacity={isClear ? 0.46 : 1}
                />
                <stop
                  offset="100%"
                  stopColor={`color-mix(in srgb, ${base}, black 30%)`}
                  stopOpacity={isClear ? 0.62 : 1}
                />
              </linearGradient>
              <linearGradient
                id={glossGradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="white" stopOpacity="0.48" />
                <stop offset="30%" stopColor="white" stopOpacity="0" />
                <stop offset="72%" stopColor="white" stopOpacity="0" />
                <stop offset="100%" stopColor="white" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            <rect
              x="calc(var(--bumper-pad) / 2)"
              y="calc(var(--bumper-pad) / 2)"
              width="calc(100% - var(--bumper-pad))"
              height="calc(100% - var(--bumper-pad))"
              rx="calc(var(--bumper-radius) - var(--bumper-pad) / 2)"
              fill="none"
              stroke={`url(#${faceGradientId})`}
              strokeWidth="var(--bumper-pad)"
            />
            {finish === "gloss" ? (
              <rect
                x="calc(var(--bumper-pad) / 2)"
                y="calc(var(--bumper-pad) / 2)"
                width="calc(100% - var(--bumper-pad))"
                height="calc(100% - var(--bumper-pad))"
                rx="calc(var(--bumper-radius) - var(--bumper-pad) / 2)"
                fill="none"
                stroke={`url(#${glossGradientId})`}
                strokeWidth="var(--bumper-pad)"
              />
            ) : null}
          </svg>

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

        </div>
      </div>
    </BumperContext.Provider>
  );
}
