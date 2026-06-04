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
  name: string;
  set: string;
  year: string;
  number: string;
  grade: string;
  gradeLabel: string;
  cert: string;
};

type PSASlabProps = {
  src?: string;
  alt?: string;
  label: LabelData;
  interactive?: boolean;
  className?: string;
};

export function PSASlab({
  src,
  alt = "Graded trading card",
  label,
  interactive = true,
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
          "relative isolate aspect-[100/162.7] w-full overflow-hidden rounded-[3.5cqw]",
          "[background:linear-gradient(104deg,rgb(255_255_255/32%),transparent_15%_82%,rgb(185_198_216/22%)),linear-gradient(164deg,rgb(250_252_255/62%),rgb(224_232_241/46%)_48%,rgb(198_209_223/50%))]",
          "shadow-[0_1.8cqw_4.8cqw_rgb(8_12_20/42%),0_0.35cqw_0.9cqw_rgb(8_12_20/28%),inset_0_0_0_0.18cqw_rgb(255_255_255/86%),inset_0.55cqw_0.7cqw_0.9cqw_-0.45cqw_rgb(255_255_255/92%),inset_-0.7cqw_-0.9cqw_1.15cqw_-0.55cqw_rgb(80_96_118/38%)]",
          selfTilt &&
            "will-change-transform transform-[perspective(1400px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] [transition:transform_500ms_ease-out] motion-reduce:transform-none motion-reduce:[transition:none]",
        )}
      >
        {/* The clear molded shell and its continuous sonic-weld perimeter. */}
        <div className="pointer-events-none absolute inset-[0.8cqw] z-[-3] rounded-[2.85cqw] [background:radial-gradient(circle_at_12%_7%,rgb(255_255_255/35%),transparent_23%),linear-gradient(150deg,rgb(255_255_255/19%),transparent_37%_72%,rgb(115_132_155/10%))] shadow-[inset_0_0.35cqw_0.45cqw_rgb(255_255_255/72%),inset_0_-0.4cqw_0.55cqw_rgb(74_90_111/22%)]" />
        <div className="pointer-events-none absolute inset-[0.65cqw] z-8 rounded-[2.95cqw] [border:0.22cqw_solid_rgb(255_255_255/64%)] shadow-[0_0.15cqw_0.2cqw_rgb(255_255_255/58%),inset_0_0_0_0.2cqw_rgb(72_88_109/17%),inset_0.55cqw_0.65cqw_0.8cqw_-0.55cqw_rgb(255_255_255/90%),inset_-0.45cqw_-0.65cqw_0.8cqw_-0.5cqw_rgb(70_86_108/34%)]" />
        <div className="pointer-events-none absolute inset-[2.45cqw] z-7 rounded-[2.05cqw] [border:0.22cqw_solid_rgb(151_166_186/19%)] shadow-[0_-0.12cqw_0.14cqw_rgb(255_255_255/62%),0_0.2cqw_0.22cqw_rgb(59_74_95/12%)]" />

        {/* Hard directional reflections reveal the thickness of clear plastic. */}
        <span className="pointer-events-none absolute z-9 block rounded-full blur-[0.04cqw] top-[1.05cqw] right-[9cqw] left-[9cqw] h-[0.42cqw] [background:linear-gradient(90deg,transparent,rgb(255_255_255/82%)_14%_86%,transparent)] shadow-[0_0.32cqw_0.42cqw_rgb(255_255_255/36%)]" />
        <span className="pointer-events-none absolute z-9 block rounded-full blur-[0.04cqw] top-[10cqw] right-[1.05cqw] bottom-[11cqw] w-[0.38cqw] [background:linear-gradient(180deg,transparent,rgb(255_255_255/62%)_12%_58%,rgb(112_130_154/22%)_88%,transparent)]" />
        <span className="pointer-events-none absolute z-9 block rounded-full blur-[0.04cqw] right-[9cqw] bottom-[1.1cqw] left-[9cqw] h-[0.38cqw] [background:linear-gradient(90deg,transparent,rgb(93_111_136/35%)_16%_84%,transparent)]" />
        <span className="pointer-events-none absolute z-9 block rounded-full blur-[0.04cqw] top-[10cqw] bottom-[11cqw] left-[1.05cqw] w-[0.38cqw] [background:linear-gradient(180deg,transparent,rgb(255_255_255/75%)_12%_74%,transparent)] shadow-[0.25cqw_0_0.48cqw_rgb(255_255_255/28%)]" />

        {/* The flip sits in a shallow, separately molded header pocket. */}
        <div className="absolute z-12 top-[6.25cqw] right-[6.6cqw] left-[6.6cqw] flex h-[28.8cqw] items-center rounded-[0.85cqw] p-[1.25cqw] bg-[rgb(231_237_245/9%)] shadow-[0_-0.2cqw_0.24cqw_rgb(255_255_255/62%),0_0.28cqw_0.34cqw_rgb(55_70_92/16%),inset_0_0.42cqw_0.5cqw_-0.24cqw_rgb(42_56_75/28%),inset_0_-0.28cqw_0.34cqw_-0.18cqw_rgb(255_255_255/58%)]">
          <AccurateLabel label={label} />
        </div>

        {/* One lower cavity wall and four interrupted card-retention ledges. */}
        <div className="absolute z-2 top-[38.8cqw] right-[3.5cqw] bottom-[3.8cqw] left-[3.5cqw] rounded-[0.95cqw] bg-[rgb(231_237_245/7%)] shadow-[0_-0.22cqw_0.26cqw_rgb(255_255_255/62%),0_0.3cqw_0.36cqw_rgb(52_67_89/12%),inset_0_0.5cqw_0.58cqw_-0.28cqw_rgb(43_57_77/20%),inset_0_-0.38cqw_0.46cqw_-0.25cqw_rgb(255_255_255/54%),inset_0.4cqw_0_0.48cqw_-0.25cqw_rgb(43_57_77/14%),inset_-0.4cqw_0_0.48cqw_-0.25cqw_rgb(255_255_255/31%)]">
          <div className="absolute top-[6.5cqw] right-[8.25cqw] bottom-[6.5cqw] left-[8.25cqw] rounded-[1.25cqw]">
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
              className="relative z-1 block h-full w-full rounded-[0.68cqw] object-contain select-none shadow-[0_0.18cqw_0.24cqw_rgb(28_37_51/22%)]"
            />

            {/* Short clear retention ledges stop before the rounded corners. */}
            <span className="pointer-events-none absolute z-4 block rounded-full bg-[rgb(255_255_255/35%)] right-[16%] left-[16%] h-[0.26cqw] top-[-1.55cqw] shadow-[0_-0.12cqw_0.14cqw_rgb(255_255_255/68%),0_0.18cqw_0.18cqw_rgb(54_68_88/22%)]" />
            <span className="pointer-events-none absolute z-4 block rounded-full bg-[rgb(255_255_255/35%)] top-[15%] bottom-[15%] w-[0.26cqw] right-[-1.55cqw] shadow-[-0.12cqw_0_0.14cqw_rgb(255_255_255/58%),0.18cqw_0_0.18cqw_rgb(54_68_88/18%)]" />
            <span className="pointer-events-none absolute z-4 block rounded-full bg-[rgb(255_255_255/35%)] right-[16%] left-[16%] h-[0.26cqw] bottom-[-1.55cqw] shadow-[0_-0.12cqw_0.14cqw_rgb(255_255_255/58%),0_0.18cqw_0.18cqw_rgb(54_68_88/18%)]" />
            <span className="pointer-events-none absolute z-4 block rounded-full bg-[rgb(255_255_255/35%)] top-[15%] bottom-[15%] w-[0.26cqw] left-[-1.55cqw] shadow-[-0.12cqw_0_0.14cqw_rgb(255_255_255/58%),0.18cqw_0_0.18cqw_rgb(54_68_88/18%)]" />
          </div>

          <span
            className="pointer-events-none absolute right-[2.2cqw] bottom-[1.5cqw] text-[2.7cqw] font-extrabold leading-none tracking-[-0.08em] text-[rgb(255_255_255/28%)] [font-family:var(--font-geist-sans),sans-serif] [text-shadow:0_-0.12cqw_0_rgb(255_255_255/42%),0_0.14cqw_0_rgb(66_82_104/18%)]"
            aria-hidden
          >
            PSA
          </span>
        </div>

        {/* Subtle shell reflections. These stay restrained so the case reads
            as clear plastic, not frosted glass or a metallic panel. */}
        <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] [background:linear-gradient(108deg,transparent_0_17%,rgb(255_255_255/14%)_21%,transparent_28%_68%,rgb(255_255_255/7%)_75%,transparent_81%),radial-gradient(ellipse_at_14%_4%,rgb(255_255_255/25%),transparent_25%),radial-gradient(ellipse_at_88%_97%,rgb(113_133_159/11%),transparent_31%)]" />
        <div className="pointer-events-none absolute inset-0 z-11 rounded-[inherit] [background:radial-gradient(circle_at_var(--mx,50%)_var(--my,24%),rgb(255_255_255/16%),transparent_42%)]" />
      </div>
    </div>
  );
}

function AccurateLabel({ label }: { label: LabelData }) {
  const line1 = [label.year, "POKEMON"].filter(Boolean).join(" ");

  return (
    <div className="relative aspect-1928/575 h-auto w-full flex-none overflow-visible uppercase text-[#17191d] [font-family:var(--font-geist-sans),Arial,sans-serif] [font-synthesis:none] [text-rendering:geometricPrecision] [-webkit-font-smoothing:antialiased]">
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
          extra padding keeps the type optically centered inside the red trim. */}
      <div className="relative z-1 grid h-full items-stretch grid-cols-[minmax(0,1fr)_max-content] gap-y-[1.8cqw] gap-x-[5%] p-[3.5cqw_4.8cqw_3.1cqw]">
        <div className="grid grid-rows-4 min-w-0 items-center gap-0">
          <div className="contents text-[3.65cqw] font-normal leading-[1.08] tracking-[-0.015em]">
            <span className="self-center overflow-hidden leading-none text-ellipsis whitespace-nowrap">
              {line1}
            </span>
            <span className="self-center overflow-hidden leading-none text-ellipsis whitespace-nowrap">
              {label.name || "—"}
            </span>
            {label.set ? (
              <span className="self-center overflow-hidden leading-none text-ellipsis whitespace-nowrap">
                {label.set}
              </span>
            ) : null}
          </div>
          <Barcode />
        </div>

        <div className="grid grid-rows-4 items-center justify-items-end gap-0 text-[3.65cqw] font-normal leading-[1.08] tracking-[-0.015em] text-right whitespace-nowrap [font-variant-numeric:tabular-nums]">
          <div className="contents">
            <span className="self-center leading-none">
              {label.number ? `#${label.number}` : "—"}
            </span>
            <span className="self-center leading-none">{label.gradeLabel}</span>
            <span className="self-center leading-none">{label.grade}</span>
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
      className="flex h-[3.75cqw] w-[24cqw] items-stretch gap-[0.23cqw] self-center row-4"
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
