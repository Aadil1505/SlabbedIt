# Design

Warm, premium, restrained. A single fresh leaf-green brand color mapped to the
authority/action roles on calm warm-paper neutral surfaces. Restraint over
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
- **Exception: the slab is representational, not chrome.** `psa-slab.tsx` and
  `slab-bumper.tsx` reproduce a real graded case (clear medical-grade polymer,
  holo, the bright PSA label red `#eb1d2f` / `rgb(235 29 47)`, physical bumper
  plastics). Those colors are material truth, not theme, and are intentionally
  left as literal values. The large polymer planes are kept nearly transparent
  so the case reads as clear; its hard edges, rails, and speculars define it.

## Color

OKLCH throughout. Dark (`.dark`) is the hero "gallery stage" and the default
mode (`<html class="dark">`); light (`:root`) is a clean-dashboard counterpart.
Color strategy: **committed-minimal**: warm-paper neutral surfaces, a single
leaf green as the dominant brand/authority color, red reserved for destruction.
There is no second accent hue: `accent` is a warm neutral hover/emphasis surface.

Role mapping (same across modes; values differ per mode):

| Token | Role | Hue family |
|---|---|---|
| `primary` / `ring` | Primary actions, links, focus ring | Leaf green (~148) |
| `accent` | Hover / emphasis surface | Warm neutral (~93, very low chroma) |
| `destructive` | Destructive actions | Red in dark; warm near-black in light |
| `background` / `card` / `muted` | Surfaces | Warm paper neutral (cream / stone) |
| `foreground` / `muted-foreground` | Text | Warm near-black / warm mid-grey |
| `chart-1..5` | Categorical data | green, purple, warm neutral |

Contrast (WCAG, craft default): body and muted text clear 4.5:1 on both stages,
and `primary`/`destructive` button text clears 4.5:1. `accent` is a quiet
neutral surface, so hovers read as a subtle warm tint rather than a color pop.

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

The slab's cursor-driven tilt and gloss are core to the pitch. Foil tracking is
available only when the card surface toggle is on, so matte uploads do not get a
fake holo pass. A `prefers-reduced-motion` static fallback (handled in
`lib/use-tilt.ts`) resets the slab to rest with no tilt and no gloss/foil
tracking (craft default; no formal WCAG target for this PoC).

## Layout

Single centered stage: the slab is the hero, framed by layered backdrop light
(two brand glows, a spotlight, a faded grid, an edge vignette). Chrome recedes;
the case gets the light.
