# Design

Minimal Pokémon. The iconic trio (cobalt blue, electric yellow, Poké Ball red)
mapped to semantic roles on calm, navy-tinted neutral surfaces. Restraint over
spectacle: the rendered slab is the only thing allowed to shout.

## Source of truth

`app/globals.css` is the single source of truth for color. Every color in the
app must resolve to one of the existing shadcn token variables defined there.

- Do **not** hardcode colors in components (`bg-black`, `text-amber-400`,
  raw hex/rgb) and do **not** add custom CSS variables. Retune the existing
  variables instead, and consume them through their utilities
  (`bg-background`, `text-accent`, `border-border`, ...).
- Decorative tints (backdrop glows, grid, vignette) are mixed from tokens with
  `color-mix(in oklch, var(--token) N%, transparent)` so they track the theme.
- **Exception — the slab is representational, not chrome.** `psa-slab.tsx` and
  `slab-bumper.tsx` reproduce a real graded case (acrylic, holo, the PSA red
  label `#cf1f2e`, physical bumper plastics). Those colors are material truth,
  not theme, and are intentionally left as literal values.

## Color

OKLCH throughout. Dark (`.dark`) is the hero "gallery stage" and the default
mode (`<html class="dark">`); light (`:root`) is a clean-dashboard counterpart.
Color strategy: **committed-minimal** — neutral surfaces, blue as the dominant
brand/authority color, yellow as the single electric pop, red reserved for
destruction.

Role mapping (same across modes; values differ per mode):

| Token | Role | Hue family |
|---|---|---|
| `primary` | Primary actions, links, focus ring | Pokémon cobalt blue (~252) |
| `accent` | The single pop: eyebrows, emphasis, hover | Pokémon yellow (~92) |
| `destructive` | Destructive actions | Poké Ball red (~27) |
| `background` / `card` / `muted` | Surfaces | Faint navy-tinted neutral (~245–252) |
| `foreground` / `muted-foreground` | Text | Deep navy / mid slate-blue |
| `chart-1..5` | Categorical data | blue, yellow, red, sky, green |

Contrast verified (WCAG): body and muted text clear 4.5:1 on both stages;
`primary`/`destructive` button text and `accent` foreground clear 4.5:1.
`accent` doubles as the shadcn hover/focus background, so hovers carry a yellow
tint by design — if that ever reads as too loud, dial `accent` toward a softer
butter-yellow rather than introducing a new token.

## Typography

Two families, contrast on the pixel/vector axis. Departure Mono carries
identity; Geist Sans runs everything functional. Keep the bitmap face off
small, dense panel text where it turns rough.

- **Identity / display:** Departure Mono (local, `public/fonts`), mapped to
  `--font-heading` / `--font-display` / `--font-mono`. Use `font-heading` for
  the wordmark, panel section headers, the "proof of concept" tag, and the
  on-slab grade label. Pixel/retro, evokes the Game Boy-era Pokémon games.
- **Functional text:** Geist Sans (`--font-sans`) for body copy, control
  labels, hints, and value readouts. `--font-sans` resolves to
  `var(--font-geist-sans)` (the old self-referential mapping was a bug).
- Eyebrows / tags: short, `text-accent`, used sparingly.

## Motion

The slab's cursor-driven tilt and gloss, plus glitter, are core to the pitch.
Provide a `prefers-reduced-motion` static fallback so the slab still renders
fully without motion (craft default; no formal WCAG target for this PoC).

## Layout

Single centered stage: the slab is the hero, framed by layered backdrop light
(two brand glows, a spotlight, a faded grid, an edge vignette). Chrome recedes;
the case gets the light.
