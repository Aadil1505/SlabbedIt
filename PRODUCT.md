# Product

## Register

product

## Users

TCG and sports-card collectors who have a raw, ungraded card and want to see
what it would look like sealed in a PSA slab before they pay
to submit it. They arrive with a card image in hand, are emotionally invested in
the card, and want a fast, satisfying "show me" moment they can share with other
collectors. They are hobbyists, not professionals: comfortable with card lingo
(grade, label, cert), not interested in learning a tool.

## Product Purpose

SlabbedIt is a previewer: drop in a card image, choose a grade and label
details, and get a photorealistic graded-slab render you can admire and share.
Card search covers Pokémon/TCG (via TCGdex); sports and any other card are
supported by uploading the image and typing the three verbatim label lines.
Search initializes the label fields for convenience, but the visible fields are
the source of truth after that, so manual edits are never overwritten by a
secondary helper.
The technical bet is that the entire slab (clear medical-grade polymer case,
bevel, gloss, floor shadow, protective bumpers, printed label) is built in pure
CSS/DOM, no canvas or 3D, so it stays sharp at any size and renders instantly.

Success right now is a working previewer flow: a user supplies their own card
(and label data), the slab updates to match, and the result is convincing enough
to feel like the real thing and worth screenshotting.

## Brand Personality

Premium, trustworthy, and quietly hobbyist-warm. It should feel like a real
grading service's product surface: authoritative and clean (PSA-grade
credibility), with the calm restraint of a well-made dashboard, but elevated so
the slab reads as a high-value collectible on a lit stage rather than a row in a
table. Confident, not loud. The card is the hero; the UI is the gallery around
it. Three words: premium, authoritative, collectible.

## Anti-references

- Generic SaaS dashboard chrome: dense toolbars, card-grid templates, sidebar +
  data-table layouts that bury the slab. "Clean dashboard" means restraint and
  clarity, not a CRUD admin panel.
- Over-the-top TCG kitsch: rainbow gradients everywhere, gratuitous holo on
  every surface, comic-energy that undercuts the "this looks real" credibility.
- Flat mockup-generator vibes: a slab that obviously looks like a flat PNG
  template with the card pasted in. The realism (depth, light, material) is the
  entire point and must never feel cheap.

## Design Principles

- **The slab is the product.** Every layout decision serves making the rendered
  slab the unmistakable hero. Chrome recedes; the case gets the light.
- **Realism is the pitch.** Material truth (clear-polymer depth, directional light,
  honest shadows, label print) is non-negotiable. If an effect makes it look
  more like a real graded case, it earns its place; if it looks like a filter,
  it goes.
- **Show, don't configure.** Collectors came to see their card, not fill a form.
  Inputs are minimal and the preview responds instantly and obviously.
- **Credible, not costumed.** Premium feel comes from restraint and light, the
  way grading services present slabs, not from decoration piled on top.
- **Sharp at any scale.** The pure-CSS approach is a feature: the slab must look
  right from a thumbnail to a full-screen hero, which keeps the build honest.

## Accessibility & Inclusion

No formal WCAG target for this proof-of-concept. As a craft default, keep body
and label text legible against the dark stage, and provide a static fallback
under `prefers-reduced-motion` for the cursor tilt, gloss, and light-tracking
foil so the slab still renders fully without motion. Uploaded non-holo cards
default with foil sheen off; collectors can enable it for holo or foil surfaces.
