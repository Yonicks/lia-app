# Phase 22 Plan — Landscape Practice Hub

## Purpose

Implement the approved landscape Practice hub using `docs/design/landscape/reference/practice.png` as visual truth while preserving all six current practice modes and their entry/gating behavior.

## Dependency

Read `docs/migration/phase-21-report.md` first.

Phase 22 may begin only when Phase 21 ends with:

`GAMES HUB READY FOR PHASE 22`

Otherwise stop as BLOCKED.

## In scope

1. Replace the old Practice menu with the approved landscape world-screen composition.
2. Render the complete practice catalog as one 3-column × 2-row grid.
3. Preserve current mode order/labels/availability unless current source proves a different canonical order.
4. Preserve practice routing, gating, progress/session entry semantics, and audio behavior.
5. Use shared shell/grid/card/title/navigation primitives.
6. Add visual/interaction tests across the full landscape matrix.

## Out of scope

- Do not redesign the six practice activity screens; Phase 26.
- Do not alter practice reducers/content/session logic.
- Do not redesign category/game/rewards/parent surfaces.
- Do not invent production art.
- Do not retire Capacitor.

## Visual source of truth

Primary reference:

`docs/design/landscape/reference/practice.png`

Required hierarchy:

- world/fantasy background using verified production asset;
- shared top chrome and Talki branding;
- landscape title treatment;
- exactly six large child-facing cards in a balanced 3×2 composition;
- real Hebrew labels;
- side navigation to Home/Games;
- no bottom nav;
- no long vertical scrolling list.

## Mode preservation

Current baseline modes are expected to include:

- focus;
- receptive;
- cloze;
- temptation;
- pairs;
- combine.

Current source is authoritative. The hub must derive from the current practice registry/domain rather than duplicating a stale static list if a registry already exists.

Every mode must remain reachable exactly once.

## Card behavior

Each card must:

- use verified existing artwork where available;
- expose real Hebrew label text and accessible role/label;
- preserve current disabled/gated behavior;
- route to the correct practice activity;
- meet >=48×48 effective target.

Missing art is recorded in `asset-manifest.md`, not faked.

## Responsive behavior

- maintain 3×2 on compact/reference phones and tablets;
- compact phone adjusts gaps/padding/card size via centralized tokens;
- tablet uses max card sizes/gutters;
- labels remain readable and untruncated;
- no vertical scroll required for the hub.

## Tests

Cover:

- current practice registry count equals reachable cards;
- six expected modes are present if source still has six;
- every card routes correctly;
- gating/disabled states remain correct;
- Home/Games side navigation works;
- no bottom nav;
- RTL/touch target compliance;
- no clipping/overflow across all active landscape viewports.

Capture screenshots at every active landscape viewport.

## Acceptance criteria

- [ ] Practice hub visually follows `practice.png` and design contract.
- [ ] Complete current practice catalog is visible/reachable.
- [ ] 3×2 layout fits all supported landscape classes.
- [ ] Entry/gating behavior is preserved.
- [ ] Cards are real interactive RN UI with real labels.
- [ ] Verified art only; missing art tracked.
- [ ] Compact phone/tablet visual checks pass.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-22-report.md` exists.

## Exit condition

End with exactly one of:

`PRACTICE HUB READY FOR PHASE 23`

or

`BLOCKED`

Then stop.
