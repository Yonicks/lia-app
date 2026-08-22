# Talki Home redesign — missing assets

Assets referenced by the approved mockup (`docs/design/talki-home-approved.png`)
that do not yet exist in `assets/v2/`. Until generated, the affected controls use
inline SVG placeholders (real vector icons, not emoji) so functionality and
visual polish aren't blocked on asset production.

## Phase 2 — Top header

### talki-ui-icon-music.png — High priority
- **Used by**: `#musicBtn` in `.topbar` (background music on/off toggle)
- **Current placeholder**: inline SVG music note (outline, `currentColor` stroke)
- **Spec**: flat line-art icon, 24x24 viewport, ~1.8px stroke, transparent
  background, single colour (matches `--talki-purple-700 #6D3BA6` at rest).
  Style should match the existing `talki-ui-icon-*` set (gift, star, home,
  games, settings) — soft rounded line-art, no gradients/shadows baked in.
- **States**: needs no separate "muted" variant — mute state is conveyed by
  the button dimming to 50% opacity (see `syncMusicIcon()`), so a single
  music-note glyph is sufficient.

### talki-ui-icon-speech-rate.png — High priority
- **Used by**: `#speedBtn` in `.topbar` (cycles speech rate: slow → normal → fast)
- **Current placeholder**: inline SVG speedometer (arc + needle), needle
  rotates -40deg/0deg/40deg to reflect slow/normal/fast via `syncSpeedIcon()`
- **Spec**: if replaced with a static PNG per rate instead of a rotating
  needle, provide 3 variants (slow/normal/fast) at 24x24, same line-art style
  as above. If keeping the rotating-needle approach, an SVG source (not PNG)
  should be provided so the needle can still be transformed by JS.
