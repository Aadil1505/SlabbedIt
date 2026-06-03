import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SlabBumper
 * ----------
 * A molded protective bumper (think GradedGuard) that wraps a graded slab.
 * It's a pure wrapper: drop a <PSASlab /> (or anything) in as children and the
 * bumper frames it. The slab is `@container`-sized, so it reflows to the
 * bumper's inner width automatically.
 *
 * Everything is sized in `cqw` relative to the bumper's own width, so the whole
 * assembly scales with its parent. The body color drives all the shading via
 * `color-mix`, so a single `color` prop restyles the entire guard.
 */

type SlabBumperProps = {
  /** Wrapped content — typically a <PSASlab />. */
  children: ReactNode;
  /** Bumper body color (any CSS color). All shading is derived from it. */
  color?: string;
  /** Surface finish: flat matte or a glossy sheen. */
  finish?: "matte" | "gloss";
  className?: string;
};

export function SlabBumper({
  children,
  color = "#d23a4d",
  finish = "matte",
  className,
}: SlabBumperProps) {
  return (
    <div
      style={{ "--bumper": color } as CSSProperties}
      className={cn("@container relative w-full", className)}
    >
      {/* Bumper body — molded TPU: light top edge → base → dark bottom edge,
          with an outer drop shadow and a beveled rim. */}
      <div
        className={cn(
          "relative rounded-[7cqw] p-[4.5cqw]",
          "bg-[linear-gradient(160deg,color-mix(in_srgb,var(--bumper),white_22%),var(--bumper)_44%,color-mix(in_srgb,var(--bumper),black_30%))]",
          "shadow-[0_2cqw_5cqw_rgba(8,11,18,0.45),inset_0_0.6cqw_0.8cqw_rgba(255,255,255,0.35),inset_0_-0.9cqw_1.2cqw_rgba(0,0,0,0.35),inset_0_0_0_0.25cqw_color-mix(in_srgb,var(--bumper),black_20%)]",
        )}
      >
        {/* Slab cavity — wraps the slab tightly so the lip overlay aligns */}
        <div className="relative">
          {children}

          {/* Lip — the bumper edge lapping over the slab's front face */}
          <div className="pointer-events-none absolute inset-0 rounded-[4cqw] shadow-[inset_0_0_0_0.5cqw_color-mix(in_srgb,var(--bumper),black_10%),inset_0_0.5cqw_0.9cqw_rgba(0,0,0,0.32),inset_0_-0.4cqw_0.7cqw_rgba(255,255,255,0.12)]" />
        </div>

        {/* Glossy surface sheen (gloss finish only) */}
        {finish === "gloss" ? (
          <div className="pointer-events-none absolute inset-0 rounded-[7cqw] bg-[linear-gradient(150deg,rgba(255,255,255,0.4)_0%,transparent_28%,transparent_72%,rgba(255,255,255,0.1)_100%)]" />
        ) : null}
      </div>
    </div>
  );
}
