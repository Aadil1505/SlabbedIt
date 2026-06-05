# Roadmap: to be implemented

Tracked work that's intentionally deferred. Roughly priority-ordered.

## Before public launch

- [x] **`prefers-reduced-motion` fallback.** Done. `lib/use-tilt.ts` checks the
      media query and returns no pointer handlers when reduced, so both the slab and
      the bumper freeze at their rest state (no tilt, no gloss/foil tracking).
- [ ] **True physical slab mode.** Add front/back view, optional card-back upload,
      reverse label approximation, side thickness, and stackable rear geometry.
      Keep reverse QR/barcode/security elements clearly illustrative and
      non-functional.
- [ ] **Analytics.** Add `@vercel/analytics` so we don't deploy blind.
- [ ] **Dark PWA manifest colors.** `app/manifest.json` has white `theme_color` /
      `background_color`; the app is dark-default, so the installed-PWA splash flashes
      white. Match the dark stage (≈ `#1a2030`).

## Export options

- [ ] **Pure cutout option.** The default export includes the stage because the
      translucent slab materials depend on it for their exact studio appearance.
      Optionally offer a separate opaque-material, transparent-background cutout.

## Product scope

- [ ] **Sports search, other graders, glitter.** Sports cards now work via upload +
      the verbatim manual label (and `PRODUCT.md` reflects that). Still deferred: a
      sports-card **search** source, other graders (BGS/CGC/SGC), and a glitter
      material.

## Nice to have

- [ ] Real social links in the header/footer (currently GitHub only).
- [ ] More label templates / grading-company styles.
