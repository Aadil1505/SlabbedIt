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

## Export realism (works, but not physically accurate)

- [ ] **Slab translucency.** The export bakes an opaque light base into the slab body
      (foreignObject capture can't render `backdrop-filter`), so the "clear acrylic"
      areas aren't see-through — a dark background doesn't show through like real
      plastic. Preferred fix: keep the card area opaque, make only the outer bevel/
      edges genuinely translucent, and tone down the bumper's inner-rim tint so it
      doesn't wash the interior. See `components/psa-slab.tsx` (`EXPORT_SLAB_BG`).
- [ ] **Translucent bumper glow.** Translucent presets (clear/smoke/glow) lose their
      `backdrop-blur` halo on export; currently substituted with a flat frosted fill.
- [ ] **Pure cutout option.** Optionally exclude the slab's floor/drop shadow from the
      export for a clean no-shadow cutout.

## Product scope

- [ ] **Match `PRODUCT.md` or trim it.** Doc promises TCG **and sports** cards plus a
      glitter material; the app is currently PSA + Pokémon only. Either build (sports
      cards, other graders like BGS/CGC/SGC, glitter) or scope the doc to v1.

## Nice to have

- [ ] Real social links in the header/footer (currently GitHub only).
- [ ] More label templates / grading-company styles.
