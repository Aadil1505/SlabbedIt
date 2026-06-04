"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/lib/use-tilt";
import { useInsideBumper } from "@/lib/bumper-context";
import styles from "./psa-slab.module.css";

/**
 * A front-facing, pure DOM/CSS model of a current PSA-style standard card
 * holder. The case is built as separate molded planes so its clear plastic
 * reads from the hard edges and rails instead of an opaque acrylic fill.
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
  logo?: ReactNode;
  labelColor?: string;
  label: LabelData;
  /**
   * Optional flip artwork. When set, the label chrome (red border, security
   * watermark, PSA mark) comes from this image and only the editable text is
   * overlaid on top — the shibadev "tag template" technique. When omitted, the
   * label is drawn entirely in CSS.
   * NOTE: the bundled /psa-label-template.png is a temporary prototype asset and
   * must be replaced with our own artwork before shipping.
   */
  labelImage?: string;
  interactive?: boolean;
  className?: string;
};

function DefaultMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/psa.png" alt="PSA" draggable={false} />
  );
}

export function PSASlab({
  src,
  alt = "Graded trading card",
  logo = <DefaultMark />,
  labelColor = "#cf1f2e",
  label,
  labelImage,
  interactive = true,
  className,
}: PSASlabProps) {
  const bumped = useInsideBumper();
  const selfTilt = interactive && !bumped;
  const { ref, handlers } = useTilt<HTMLDivElement>(selfTilt);

  return (
    <div className={cn(styles.container, className)}>
      {!bumped ? <div className={styles.floorShadow} /> : null}

      <div
        ref={ref}
        {...handlers}
        className={cn(
          styles.slab,
          selfTilt && styles.interactive,
          "animate-in fade-in zoom-in-95 duration-700 motion-reduce:animate-none",
        )}
      >
        {/* The clear molded shell and its continuous sonic-weld perimeter. */}
        <div className={styles.shellFace} />
        <div className={styles.outerEdge} />
        <div className={styles.weldRail} />

        {/* Hard directional reflections reveal the thickness of clear plastic. */}
        <span className={cn(styles.edgeFacet, styles.edgeFacetTop)} />
        <span className={cn(styles.edgeFacet, styles.edgeFacetRight)} />
        <span className={cn(styles.edgeFacet, styles.edgeFacetBottom)} />
        <span className={cn(styles.edgeFacet, styles.edgeFacetLeft)} />

        {/* The flip sits in a shallow, separately molded header pocket. */}
        <div className={styles.labelPocket}>
          <AccurateLabel
            label={label}
            labelColor={labelColor}
            logo={logo}
            labelImage={labelImage}
          />
        </div>

        {/* One lower cavity wall and four interrupted card-retention ledges. */}
        <div className={styles.cardTray}>
          <div className={styles.cardChannel}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src || PLACEHOLDER_SRC}
              alt={alt}
              draggable={false}
              onError={(event) => {
                event.currentTarget.src = PLACEHOLDER_SRC;
              }}
              className={styles.cardImage}
            />

            {/* Short clear retention ledges stop before the rounded corners. */}
            <span className={cn(styles.cardStop, styles.cardStopTop)} />
            <span className={cn(styles.cardStop, styles.cardStopRight)} />
            <span className={cn(styles.cardStop, styles.cardStopBottom)} />
            <span className={cn(styles.cardStop, styles.cardStopLeft)} />
          </div>

          <span className={styles.embossedMark} aria-hidden>
            PSA
          </span>
        </div>

        {/* Subtle shell reflections. These stay restrained so the case reads
            as clear plastic, not frosted glass or a metallic panel. */}
        <div className={styles.fixedReflections} />
        <div className={styles.cursorReflection} />
      </div>
    </div>
  );
}

function AccurateLabel({
  label,
  labelColor,
  logo,
  labelImage,
}: {
  label: LabelData;
  labelColor: string;
  logo: ReactNode;
  labelImage?: string;
}) {
  const line1 = [label.year, "POKEMON"].filter(Boolean).join(" ");
  const imageBacked = Boolean(labelImage);

  return (
    <div
      style={
        {
          "--label-color": labelColor,
          fontFamily: imageBacked
            ? "var(--font-geist-sans), Arial, sans-serif"
            : "var(--font-univers), var(--font-condensed), sans-serif",
        } as CSSProperties
      }
      className={cn(styles.label, imageBacked && styles.labelImaged)}
    >
      {imageBacked ? (
        // The flip artwork supplies the border, watermark and PSA mark; only the
        // editable text below is overlaid on top of it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={labelImage}
          alt=""
          aria-hidden
          draggable={false}
          className={styles.labelImage}
        />
      ) : (
        <div className={styles.labelSecurityPattern} />
      )}

      <div className={styles.labelContent}>
        <div className={styles.identityBlock}>
          <div className={styles.identityText}>
            <span>{line1}</span>
            <span>{label.name || "—"}</span>
            {label.set ? <span>{label.set}</span> : null}
          </div>
          <Barcode />
        </div>

        <div className={styles.gradeBlock}>
          <div className={styles.gradeText}>
            <span>{label.number ? `#${label.number}` : "—"}</span>
            <span>{label.gradeLabel}</span>
            <span>{label.grade}</span>
          </div>
          <span>{label.cert}</span>
        </div>
      </div>

      {/* CSS mark only — when image-backed, the PSA mark is baked into the art. */}
      {imageBacked ? null : <span className={styles.labelBridge}>{logo}</span>}
    </div>
  );
}

function Barcode() {
  return (
    <span className={styles.barcode} aria-hidden>
      {BARCODE_BARS.map((width, index) => (
        <span key={`${width}-${index}`} style={{ flexGrow: width }} />
      ))}
    </span>
  );
}
