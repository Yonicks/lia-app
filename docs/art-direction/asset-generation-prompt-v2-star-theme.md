# Talki v2 asset generation prompt — "Star" theme

Reusable prompt for generating the illustrated asset library for Talki's new
visual direction (bright/modern star-mascot theme, replacing the forest/rabbit
storybook theme). Companion to `asset-generation-prompt.md` (the original
vocabulary-illustration prompt, which stays as-is — the vocabulary art itself
does not need to be regenerated).

## How to use

1. Attach the two reference mockup boards (Talki v2 Board 1 and Board 2) as
   style reference images — they are the single source of truth for palette,
   mascot design, and component look.
2. Copy the prompt below into the image generator, one section at a time
   (mascot first, then badges, then stickers, then category icons, then the
   journey-map set) — generating a smaller batch per pass keeps style
   consistency tighter than asking for everything in one shot.
3. Generate a **master sheet** for each section first to validate consistency
   before producing individual files.
4. Keep the exact filenames below — the app code will reference them directly.

---

# PROMPT (copy from here)

Create illustrated UI assets for **Talki – משחקים שמפתחים את הדיבור**, a
Hebrew early-speech-development app for toddlers (ages 2–5). This is a new
visual theme replacing an older forest/storybook theme — brighter, more
modern, more like a polished mobile learning app and less like a painted
storybook.

## Style reference

Match the attached mockup boards exactly for:

- color palette
- mascot design
- overall "brightness" and flatness of the illustration style
- roundedness of shapes and corners

## Color palette (use exactly these)

- Background cream: `#FFF7ED`
- Pale pink: `#FFE9F1`
- Primary purple: `#6D3BA6`
- Secondary purple/violet: `#7C4CD6`
- Mint green: `#8FD3C1`
- Peach: `#FFCDA1`
- Gold/yellow: `#FFD75A`

## Overall art direction

- bright, warm, modern children's app illustration
- semi-flat: mostly flat color fields with soft gradient shading and gentle
  highlights for dimensionality — **not** photorealistic, **not** painterly
  storybook texture (this is a deliberate departure from Talki's older
  vocabulary-art style)
- soft rounded shapes throughout, no sharp corners
- clean, confident outlines — not sketchy, not textured
- friendly and calm, appropriate for a speech-therapy context — expressive
  but never chaotic or overstimulating
- cohesive across every asset in this set: one illustrator's hand, one
  lighting model, one level of detail

### VERY IMPORTANT — avoid generic AI-illustration tells

Avoid:

- glossy 3D/Pixar-style rendering
- oversized anime eyes
- random background gradients or glow behind objects
- neon or oversaturated colors outside the palette above
- inconsistent line weight between assets
- excessive drop shadows or bevels
- clip-art styling
- text baked into any image — **all Hebrew and English text is added by the
  app in code, never by the image generator.** Do not render any words,
  numbers, or labels inside any asset, even ones shown with text in the
  reference mockups (the mockup text is a layout guide, not something to
  reproduce as pixels).

---

## Asset set 1 — Mascot: "Talki Star"

A smiling, rounded five-point star character, warm gold/yellow body, simple
friendly face (round eyes, soft blush, small smile), matching the mockups'
mascot exactly in proportion and personality. No accessories unless noted.

Generate these mood poses, each a single character, transparent background,
centered, filling ~75–85% of canvas, **1024×1024 PNG**:

| Filename | Mood / pose |
|---|---|
| `talki-star-idle.png` | neutral, standing, gentle smile, arms relaxed — default/waiting pose |
| `talki-star-happy.png` | bright open smile, one arm slightly raised |
| `talki-star-cheer.png` | both arms raised, big joyful expression, mid-bounce — used for "correct!" and celebration moments |
| `talki-star-listen.png` | head tilted, hand cupped near "ear" point, attentive expression — used while microphone is listening |
| `talki-star-think.png` | one point resting near "chin", curious/thoughtful expression |
| `talki-star-point.png` | pointing forward/at viewer with one arm, encouraging expression — used for instructional prompts |
| `talki-star-speak.png` | small speech-bubble shape implied by open mouth/expression, mid-"talking" — used when the app is narrating |
| `talki-star-sleep.png` | eyes closed, small "z" implied by pose only (no text/symbols), calm — idle/inactive state |

Keep body shape, line weight, and color identical across all eight — only
pose and expression change.

---

## Asset set 2 — Achievement badges

Circular medallion badges, flat-icon style with a bold colored ring border,
simple bold central icon, consistent size and framing across the set.
Transparent background, **512×512 PNG**. Generate the **unlocked/full-color**
version only — the app applies a grayscale + lock-icon treatment in code for
the locked state, so do not render a "locked" variant.

| Filename | Concept | Icon idea |
|---|---|---|
| `talki-badge-regular-friend.png` | חבר קבוע — visited many days | small house |
| `talki-badge-smart-learner.png` | לומד חכם — learned many words | shield with a star |
| `talki-badge-great-player.png` | משחקן טוב — completed many games | trophy |
| `talki-badge-best-friend.png` | חבר הכי טוב — talked to Talki a lot | paw print or friendly dog face |
| `talki-badge-super-tough.png` | קשה במיוחד — finished a hard challenge | cracked egg / hatching dinosaur |
| `talki-badge-streak-keeper.png` | שמר על רצף — kept a daily streak | flame |
| `talki-badge-great-listener.png` | מקשיב מצוין — completed listening drills | ear with a small star |
| `talki-badge-word-collector.png` | אספן מילים — learned words across many categories | small stack of colorful cards |

---

## Asset set 3 — Stickers (collectible rewards)

Small square sticker illustrations, rounded corners baked into the
composition (like a die-cut sticker), simple centered subject, thin soft
white edge implied by the illustration itself (not a hard UI border — the
app adds card framing in code). Transparent background outside the sticker
shape, **512×512 PNG**.

Generate a set of 24, varied and colorful, general enough to work as
rewards independent of any specific vocabulary category:

`talki-sticker-rabbit.png`, `talki-sticker-cat.png`, `talki-sticker-dog.png`,
`talki-sticker-bird.png`, `talki-sticker-elephant.png`,
`talki-sticker-butterfly.png`, `talki-sticker-apple.png`,
`talki-sticker-cake.png`, `talki-sticker-icecream.png`,
`talki-sticker-sun.png`, `talki-sticker-cloud.png`, `talki-sticker-moon.png`,
`talki-sticker-rainbow.png`, `talki-sticker-flower.png`,
`talki-sticker-tree.png`, `talki-sticker-house.png`, `talki-sticker-car.png`,
`talki-sticker-ball.png`, `talki-sticker-balloon.png`,
`talki-sticker-heart.png`, `talki-sticker-star.png`, `talki-sticker-gift.png`,
`talki-sticker-kid-boy.png`, `talki-sticker-kid-girl.png`

---

## Asset set 4 — Category icon tiles

Simple, friendly single-subject icon illustrations representing each
vocabulary category — flatter and smaller-scale than a full scene, meant to
sit inside a small rounded colored tile. Centered subject, transparent
background, **512×512 PNG**.

`talki-cat-icon-animals.png` (rabbit or fox face), `talki-cat-icon-food.png`
(apple), `talki-cat-icon-colors.png` (paint splash / palette),
`talki-cat-icon-home.png` (ball or house interior item),
`talki-cat-icon-family.png` (parent + child silhouette pair),
`talki-cat-icon-body.png` (heart or simple figure), `talki-cat-icon-actions.png`
(child mid-jump), `talki-cat-icon-numbers.png` (stack of numbered blocks),
`talki-cat-icon-outside.png` (sun), `talki-cat-icon-emotions.png` (simple
smiling face)

---

## Asset set 5 — Journey / progress map

Elements for a floating-island level-progress path, consistent style with
the rest of this set (not painterly, matches the semi-flat brand style
despite "island" subject matter). Transparent background, **1024×1024 PNG**
unless noted.

- `talki-journey-island.png` — one small floating grass/platform island,
  viewed at a slight angle, room in the center for a number badge to be
  added in code
- `talki-journey-path.png` — a short dotted/dashed connector path segment
  between islands, transparent, tileable end-to-end
- `talki-journey-cloud-01.png`, `talki-journey-cloud-02.png` — two simple
  decorative background clouds, **512×512**

---

## What NOT to generate (handled in code, not as images)

Do not generate button assets, generic UI cards/panels, or a lock icon —
those are built as real CSS/SVG components so they stay pixel-crisp and can
resize/theme dynamically. Only the illustration-heavy assets listed above
are needed from image generation.

---

# OUTPUT

For each asset set above, first produce a **master sheet** showing every item
in that set together so style consistency can be checked before finalizing.
The master sheet is a **review step only** — never a deliverable.

Every final asset must be its own **separate PNG file**, individually
cropped and saved under the exact filename given, with a fully transparent
background (except where a set's instructions say otherwise). **Do not**
deliver a combined sprite sheet, contact sheet, or grid image as a final
asset — each file must open on its own as one object with nothing else in
the canvas.

Once every file in a set is approved, **package that set's PNG files into a
single ZIP archive** (one ZIP per asset set: mascot, badges, stickers,
category icons, journey map) so they can be downloaded and dropped straight
into the app's asset folders.

Do not redesign the layouts shown in the reference mockups. Do not add
screens. This task is only the reusable illustration asset library.
