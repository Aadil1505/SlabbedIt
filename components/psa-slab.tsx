"use client";

import { cn } from "@/lib/utils";
import { useTilt } from "@/lib/use-tilt";
import { useInsideBumper } from "@/lib/bumper-context";

/**
 * A front-facing, pure DOM/CSS model of a current PSA-style standard card
 * holder. The case is built as separate molded planes so its clear plastic
 * reads from the hard edges and rails instead of an opaque acrylic fill.
 *
 * Styling is inline Tailwind. Because the slab is representational material it
 * is exempt from the shadcn token system, and every dimension is expressed in
 * container-query units (`cqw`) so the case scales as one piece at any width.
 */

// Shining Fates Charizard VMAX (SV107) from TCGdex's high-res assets. Used by
// the studio as the initial / "reset" card.
export const SAMPLE_CARD_SRC =
  "https://assets.tcgdex.net/en/swsh/swsh4.5/SV107/high.png";

// Shown whenever no card source is supplied (or one fails to load). An inline
// SVG (no network) sized to a trading-card aspect so it fills the tray.
const PLACEHOLDER_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">` +
      `<rect width="600" height="840" fill="#dfe3ea"/>` +
      `<text x="300" y="392" text-anchor="middle" font-family="sans-serif" font-size="62" font-weight="600" fill="#9aa1ac">` +
      `<tspan x="300">Select a</tspan>` +
      `<tspan x="300" dy="1.15em">Card</tspan>` +
      `</text>` +
      `</svg>`,
  );

// Uneven bar widths make the printed code read like a real Code 128 barcode
// rather than a decorative striped rectangle.
const BARCODE_BARS = [
  1, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 2, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 2,
  1, 2, 2, 1, 1, 3, 1, 2, 1, 2, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1,
] as const;

export type LabelData = {
  // Three verbatim left-side lines, rendered exactly as typed (casing
  // preserved). A current PSA label uses lines like "2026 POKEMON ASC EN",
  // "PIKACHU ex", "SPECIAL ILLUSTRATION RARE", so the model can't hard-code
  // POKEMON or force uppercase. Sports labels work the same way, typed by hand.
  line1: string;
  line2: string;
  line3: string;
  number: string;
  grade: string; // "10", "8.5", etc. or "" when authentic
  gradeLabel: string; // Printed label, e.g. "GEM MT", "NM - MT+", "AUTHENTIC"
  qualifier: string; // "OC" | "ST" | etc. | "" (whole grades only)
  cert: string; // 9 digits, illustrative only
  authentic: boolean; // Authentic encapsulation: no numeric grade
};

type PSASlabProps = {
  src?: string;
  alt?: string;
  label: LabelData;
  interactive?: boolean;
  cardFit?: "contain" | "cover";
  holoFoil?: boolean;
  className?: string;
};

export function PSASlab({
  src,
  alt = "Graded trading card",
  label,
  interactive = true,
  cardFit = "contain",
  holoFoil = false,
  className,
}: PSASlabProps) {
  const bumped = useInsideBumper();
  const selfTilt = interactive && !bumped;
  const { ref, handlers } = useTilt<HTMLDivElement>(selfTilt);

  return (
    <div className={cn("@container relative w-full", className)}>
      {!bumped ? (
        <div className="pointer-events-none absolute right-[7%] bottom-[-3.3cqw] left-[7%] h-[10cqw] blur-[2.2cqw] [background:radial-gradient(ellipse_at_center,rgb(5_8_13/62%)_0%,rgb(5_8_13/30%)_48%,transparent_73%)]" />
      ) : null}

      <div
        ref={ref}
        {...handlers}
        className={cn(
          "relative isolate aspect-[100/168] w-full overflow-hidden rounded-[3.55cqw]",
          // Clear molded polymer: the broad body fill is only a whisper of
          // tint so the stage shows through; the hard edges, rails, welds, and
          // specular highlights below are what read as plastic.
          "[background:linear-gradient(104deg,rgb(255_255_255/12%),transparent_14%_80%,rgb(185_198_216/5%)),linear-gradient(164deg,rgb(250_252_255/3.5%),rgb(224_232_241/1.5%)_48%,rgb(198_209_223/3%))]",
          "shadow-[0_1.8cqw_4.8cqw_rgb(8_12_20/42%),0_0.35cqw_0.9cqw_rgb(8_12_20/28%),inset_0_0_0_0.18cqw_rgb(255_255_255/86%),inset_0.55cqw_0.7cqw_0.9cqw_-0.45cqw_rgb(255_255_255/92%),inset_-0.7cqw_-0.9cqw_1.15cqw_-0.55cqw_rgb(80_96_118/35%)]",
          selfTilt &&
            "will-change-transform transform-[perspective(1400px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] [transition:transform_500ms_ease-out] motion-reduce:transform-none motion-reduce:[transition:none]",
        )}
      >
        {/* The clear molded shell and its continuous sonic-weld perimeter. */}
        <div className="pointer-events-none absolute inset-[0.8cqw] z-[-3] rounded-[2.85cqw] [background:radial-gradient(circle_at_12%_7%,rgb(255_255_255/22%),transparent_23%),linear-gradient(150deg,rgb(255_255_255/5%),transparent_37%_72%,rgb(115_132_155/3%))] shadow-[inset_0_0.35cqw_0.45cqw_rgb(255_255_255/54%),inset_0_-0.4cqw_0.55cqw_rgb(74_90_111/14%)]" />
        <div className="pointer-events-none absolute inset-[0.65cqw] z-8 rounded-[2.95cqw] [border:0.22cqw_solid_rgb(255_255_255/64%)] shadow-[0_0.15cqw_0.2cqw_rgb(255_255_255/58%),inset_0_0_0_0.2cqw_rgb(72_88_109/17%),inset_0.55cqw_0.65cqw_0.8cqw_-0.55cqw_rgb(255_255_255/90%),inset_-0.45cqw_-0.65cqw_0.8cqw_-0.5cqw_rgb(70_86_108/34%)]" />
        <div className="pointer-events-none absolute inset-[1.32cqw] z-8 rounded-[2.5cqw] [border:0.1cqw_solid_rgb(255_255_255/22%)] shadow-[0_-0.07cqw_0.1cqw_rgb(255_255_255/34%),inset_0_0.07cqw_0.14cqw_rgb(54_68_88/9%)]" />
        <div className="pointer-events-none absolute inset-[2.45cqw] z-7 rounded-[2.05cqw] [border:0.16cqw_solid_rgb(151_166_186/14%)] shadow-[0_-0.1cqw_0.12cqw_rgb(255_255_255/46%),0_0.16cqw_0.18cqw_rgb(59_74_95/8%)]" />

        {/* Hard directional reflections reveal the thickness of clear plastic.
            Each edge's opacity tracks the light position (--lx/--ly), so the lit
            edges brighten together with the gloss and card foil instead of
            staying fixed. Falls back to the rest light position for export and
            reduced motion. */}
        <span
          style={{ opacity: "calc(0.55 + 0.45 * (1 - var(--ly, 0.26)))" }}
          className="pointer-events-none absolute z-9 block rounded-full blur-[0.02cqw] top-[1.05cqw] right-[9cqw] left-[9cqw] h-[0.42cqw] [background:linear-gradient(90deg,transparent,rgb(255_255_255/82%)_14%_86%,transparent)] shadow-[0_0.32cqw_0.42cqw_rgb(255_255_255/36%)]"
        />
        <span
          style={{ opacity: "calc(0.45 + 0.5 * var(--lx, 0.5))" }}
          className="pointer-events-none absolute z-9 block rounded-full blur-[0.02cqw] top-[10cqw] right-[1.05cqw] bottom-[5.2cqw] w-[0.38cqw] [background:linear-gradient(180deg,transparent,rgb(255_255_255/62%)_12%_62%,rgb(112_130_154/20%)_90%,transparent)]"
        />
        <span
          style={{ opacity: "calc(0.55 + 0.45 * (1 - var(--lx, 0.5)))" }}
          className="pointer-events-none absolute z-9 block rounded-full blur-[0.02cqw] top-[10cqw] bottom-[5.2cqw] left-[1.05cqw] w-[0.38cqw] [background:linear-gradient(180deg,transparent,rgb(255_255_255/75%)_12%_78%,transparent)] shadow-[0.25cqw_0_0.48cqw_rgb(255_255_255/28%)]"
        />
        <span
          style={{ opacity: "calc(0.28 + 0.34 * var(--ly, 0.26))" }}
          className="pointer-events-none absolute z-9 block rounded-full blur-[0.012cqw] right-[7.6cqw] bottom-[1.08cqw] left-[7.6cqw] h-[0.22cqw] [background:linear-gradient(90deg,transparent,rgb(255_255_255/38%)_13%_48%,rgb(94_111_136/18%)_84%,transparent)]"
        />

        {/* The flip sits in a shallow, separately molded header pocket. */}
        <div className="absolute z-12 top-[6.45cqw] right-[6.5cqw] left-[6.5cqw] flex h-[28.8cqw] items-center rounded-[0.85cqw] p-[1.25cqw] bg-[rgb(231_237_245/3.5%)] shadow-[0_-0.18cqw_0.22cqw_rgb(255_255_255/58%),0_0.24cqw_0.3cqw_rgb(55_70_92/10%),inset_0_0.38cqw_0.46cqw_-0.24cqw_rgb(42_56_75/18%),inset_0_-0.24cqw_0.3cqw_-0.18cqw_rgb(255_255_255/48%)] backdrop-blur-[0.015cqw]">
          <AccurateLabel label={label} />
        </div>

        {/* One lower cavity wall with a closed tub rail and short retention ledges. */}
        <div className="absolute z-2 top-[39.7cqw] right-[2.8cqw] bottom-[4.35cqw] left-[2.8cqw] rounded-[1.05cqw] bg-[rgb(231_237_245/1.2%)] shadow-[0_-0.18cqw_0.22cqw_rgb(255_255_255/42%),0_0.18cqw_0.24cqw_rgb(52_67_89/4%),inset_0_0.32cqw_0.42cqw_-0.28cqw_rgb(43_57_77/8%),inset_0_-0.18cqw_0.22cqw_-0.14cqw_rgb(255_255_255/22%),inset_0.22cqw_0_0.28cqw_-0.22cqw_rgb(43_57_77/7%),inset_-0.22cqw_0_0.28cqw_-0.22cqw_rgb(255_255_255/16%)] backdrop-blur-[0.006cqw]">
          <div className="pointer-events-none absolute inset-[1.1cqw] rounded-[0.76cqw] [border:0.1cqw_solid_rgb(255_255_255/16%)] shadow-[0_-0.07cqw_0.08cqw_rgb(255_255_255/18%),0_0.1cqw_0.12cqw_rgb(48_62_82/7%),inset_0_0.07cqw_0.1cqw_rgb(48_62_82/8%)]" />
          <div className="pointer-events-none absolute top-[1.08cqw] right-[1.82cqw] left-[1.82cqw] h-[0.1cqw] rounded-full [background:linear-gradient(90deg,transparent,rgb(255_255_255/22%)_12%_88%,transparent)] shadow-[0_-0.06cqw_0.08cqw_rgb(255_255_255/24%)]" />
          <div className="pointer-events-none absolute right-[1.82cqw] bottom-[1.08cqw] left-[1.82cqw] h-[0.1cqw] rounded-full [background:linear-gradient(90deg,transparent,rgb(255_255_255/24%)_12%_58%,rgb(68_84_106/13%)_88%,transparent)] shadow-[0_-0.05cqw_0.07cqw_rgb(255_255_255/18%)]" />
          <div className="absolute top-[5.9cqw] right-[6.7cqw] bottom-[7.2cqw] left-[6.7cqw] rounded-[1.25cqw]">
            <div className="pointer-events-none absolute inset-[-1.45cqw] z-0 rounded-[1.08cqw] [border:0.1cqw_solid_rgb(255_255_255/14%)] shadow-[0_-0.08cqw_0.1cqw_rgb(255_255_255/18%),0_0.12cqw_0.14cqw_rgb(42_55_74/8%),inset_0_0.08cqw_0.12cqw_rgb(42_55_74/7%)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src || PLACEHOLDER_SRC}
              alt={alt}
              draggable={false}
              onError={(event) => {
                // Fall back once; the flag prevents an infinite reload loop if
                // the placeholder itself ever fails.
                const img = event.currentTarget;
                if (img.dataset.fallback) return;
                img.dataset.fallback = "1";
                img.src = PLACEHOLDER_SRC;
              }}
              className={cn(
                "relative z-1 block h-full w-full rounded-[0.68cqw] select-none shadow-[0_0.18cqw_0.24cqw_rgb(28_37_51/22%)]",
                cardFit === "cover" ? "object-cover" : "object-contain",
              )}
            />

            {/* Holo/foil sheen. It reads the same inherited light coords as the
                shell gloss, so the card catches light as the slab tilts. Sits
                static at the rest position under reduced motion (no handlers
                fire). Export-safe: plain gradient + opacity, no blend mode. */}
            {holoFoil ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-2 rounded-[0.68cqw] [background:radial-gradient(115%_90%_at_var(--mx,50%)_var(--my,24%),rgb(255_255_255/18%),rgb(255_255_255/4%)_40%,transparent_62%)]"
              />
            ) : null}

            {/* Short clear retention ledges, kept subtle like molded plastic tabs. */}
            <span className="pointer-events-none absolute z-4 block rounded-full bg-[rgb(255_255_255/26%)] right-[28%] left-[28%] h-[0.18cqw] top-[-1.35cqw] shadow-[0_-0.08cqw_0.1cqw_rgb(255_255_255/42%),0_0.12cqw_0.12cqw_rgb(54_68_88/14%)]" />
            <span className="pointer-events-none absolute z-4 block rounded-full bg-[rgb(255_255_255/18%)] right-[30%] left-[30%] h-[0.16cqw] bottom-[-1.25cqw] shadow-[0_-0.06cqw_0.08cqw_rgb(255_255_255/26%),0_0.1cqw_0.1cqw_rgb(54_68_88/10%)]" />
          </div>

          <span
            className="pointer-events-none absolute right-[2.2cqw] bottom-[1.5cqw] text-[2.7cqw] font-extrabold leading-none tracking-[-0.08em] text-[rgb(255_255_255/25%)] [font-family:var(--font-geist-sans),sans-serif] [text-shadow:0_-0.12cqw_0_rgb(255_255_255/36%),0_0.14cqw_0_rgb(66_82_104/16%)]"
            aria-hidden
          >
            PSA
          </span>
          <span
            className="pointer-events-none absolute bottom-[1.82cqw] left-[2.2cqw] text-[0.9cqw] font-semibold uppercase leading-none tracking-[0.22em] text-[rgb(255_255_255/18%)] [font-family:var(--font-geist-sans),sans-serif] [text-shadow:0_-0.06cqw_0_rgb(255_255_255/24%)]"
            aria-hidden
          >
            SlabbedIt Preview
          </span>
        </div>

        {/* Subtle shell reflections. These stay restrained so the case reads
            as clear plastic, not frosted glass or a metallic panel. */}
        <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] [background:linear-gradient(108deg,transparent_0_17%,rgb(255_255_255/12%)_21%,transparent_28%_68%,rgb(255_255_255/5%)_75%,transparent_81%),radial-gradient(ellipse_at_14%_4%,rgb(255_255_255/19%),transparent_25%),radial-gradient(ellipse_at_88%_97%,rgb(113_133_159/6%),transparent_31%)]" />
        <div className="pointer-events-none absolute inset-0 z-11 rounded-[inherit] [background:radial-gradient(circle_at_var(--mx,50%)_var(--my,24%),rgb(255_255_255/12%),transparent_42%)]" />
      </div>
    </div>
  );
}

function AccurateLabel({ label }: { label: LabelData }) {
  // The grade number drops out for Authentic encapsulation; a qualifier
  // (whole grades only) prints beside the number, e.g. "8 OC".
  const gradeLine = label.authentic
    ? ""
    : [label.grade, label.qualifier].filter(Boolean).join(" ");

  return (
    <div className="relative aspect-1928/575 h-auto w-full flex-none overflow-visible text-[#17191d] [font-family:var(--font-geist-sans),Arial,sans-serif] [font-synthesis:none] [text-rendering:geometricPrecision] [-webkit-font-smoothing:antialiased]">
      {/* The PSA flip artwork supplies the border, watermark, and center mark. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/psa-label-template.png"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill select-none"
      />

      {/* The printable white field begins around 3%/10% and ends near 97%/90%;
          extra padding keeps the type optically centered inside the red trim.
          The three left lines are rendered verbatim, casing is preserved. */}
      <div className="relative z-1 grid h-full items-stretch grid-cols-[minmax(0,1fr)_max-content] gap-y-[1.8cqw] gap-x-[5%] p-[3.5cqw_4.8cqw_3.1cqw]">
        <div className="grid grid-rows-4 min-w-0 items-center gap-0">
          <div className="contents text-[3.34cqw] font-medium leading-[1.04] tracking-[-0.004em]">
            <span className="self-center overflow-hidden leading-none text-ellipsis whitespace-nowrap">
              {label.line1 || "—"}
            </span>
            <span className="self-center overflow-hidden leading-none text-ellipsis whitespace-nowrap">
              {label.line2 || "—"}
            </span>
            {label.line3 ? (
              <span className="self-center overflow-hidden leading-none text-ellipsis whitespace-nowrap">
                {label.line3}
              </span>
            ) : null}
          </div>
          <Barcode />
        </div>

        <div className="grid grid-rows-4 items-center justify-items-end gap-0 text-[3.34cqw] font-medium leading-[1.04] tracking-[-0.004em] text-right whitespace-nowrap [font-variant-numeric:tabular-nums]">
          <div className="contents">
            <span className="self-center leading-none">
              {label.number ? `#${label.number}` : "—"}
            </span>
            <span className="self-center leading-none">{label.gradeLabel}</span>
            <span className="self-center leading-none">{gradeLine}</span>
          </div>
          <span className="self-center leading-none">{label.cert}</span>
        </div>
      </div>
    </div>
  );
}

function Barcode() {
  return (
    <span
      className="flex h-[3.55cqw] w-[23.2cqw] items-stretch gap-[0.2cqw] self-center row-4"
      aria-hidden
    >
      {BARCODE_BARS.map((width, index) => (
        <span
          key={`${width}-${index}`}
          className="min-w-[0.13cqw] bg-[#17191d]"
          style={{ flexGrow: width }}
        />
      ))}
    </span>
  );
}
