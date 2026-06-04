# Roadmap — to be implemented

Tracked work that's intentionally deferred. Roughly priority-ordered.

## Before public launch

- [ ] **`prefers-reduced-motion` fallback.** `PRODUCT.md` requires a static fallback
      for the cursor tilt, gloss tracking, and glitter. Currently unmet — honor the
      media query in `lib/use-tilt.ts` (skip pointer-driven transforms) and gate the
      slab/bumper entrance animations.
- [ ] **Analytics.** Add `@vercel/analytics` so we don't deploy blind.
- [ ] **Dark PWA manifest colors.** `app/manifest.json` has white `theme_color` /
      `background_color`; the app is dark-default, so the installed-PWA splash flashes
      white. Match the dark stage (≈ `#1a2030`).

## Export options

- [ ] **Pure cutout option.** The default export includes the stage because the
      translucent slab materials depend on it for their exact studio appearance.
      Optionally offer a separate opaque-material, transparent-background cutout.

## Product scope

- [ ] **Match `PRODUCT.md` or trim it.** Doc promises TCG **and sports** cards plus a
      glitter material; the app is currently PSA + Pokémon only. Either build (sports
      cards, other graders like BGS/CGC/SGC, glitter) or scope the doc to v1.

## Nice to have

- [ ] Real social links in the header/footer (currently GitHub only).
- [ ] More label templates / grading-company styles.
