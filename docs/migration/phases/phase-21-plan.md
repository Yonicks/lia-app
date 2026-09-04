# Phase 21 Plan — Landscape Games Hub

## Purpose

Implement the approved landscape Games hub using `docs/design/landscape/reference/games.png` as visual truth while preserving access to every currently registered game.

The reference shows six cards, but the current product has more games. The hub must therefore preserve the 3×2 reference composition through child-friendly paging/horizontal navigation rather than dropping content.

## Dependency

Read `docs/migration/phase-20-report.md` first.

Phase 21 may begin only when Phase 20 ends with:

`HOME HUB READY FOR PHASE 21`

Otherwise stop as BLOCKED.

## In scope

1. Replace the old Games menu with the approved landscape world-screen composition.
2. Use the Phase 18 shell/card/grid/page-indicator primitives.
3. Render a 3-column × 2-row page on supported phone/tablet landscape viewports.
4. Preserve every game from the current game registry.
5. Provide intentional page navigation for games beyond the first six.
6. Preserve game titles, availability rules, entry behavior, progress/locks if present, and game routing.
7. Preserve shared top controls and side navigation.
8. Add visual and interaction tests across the landscape matrix.

## Out of scope

- Do not redesign individual games; Phases 24–25.
- Do not redesign Practice hub; Phase 22.
- Do not alter game reducers/scoring/session logic.
- Do not change registry membership just to fit the mock.
- Do not invent art.
- Do not retire Capacitor.

## Visual source of truth

Primary reference:

`docs/design/landscape/reference/games.png`

Required hierarchy:

- world/fantasy background from verified production art;
- shared top utility chrome and Talki branding;
- landscape title treatment;
- six large rounded activity cards per page;
- artwork area plus readable white/footer label treatment consistent with the reference;
- side navigation to Home/Practice as defined by the shared navigation model;
- child-friendly page indicator/control when more than one page exists;
- no bottom navigation;
- no long vertical scrolling list.

## Complete game coverage

The implementation must read the current registry at runtime/source and preserve all registered games.

The Phase 16 baseline expected 11 games, but current code at execution time is authoritative.

For 11 games, the intended layout is:

- page 1: 6 games;
- page 2: 5 games with balanced layout/empty-slot treatment that does not look broken.

Do not hard-code exactly 11 if the current registry differs. Paging should derive from the registry.

## Paging behavior

- page size: 6;
- swiping/horizontal paging is acceptable;
- large child-friendly previous/next controls may supplement swipe;
- page indicator must make multiple pages discoverable;
- paging must be keyboard/test accessible on web without becoming desktop-looking product UI;
- avoid accidental horizontal scroll of the entire shell.

## Card behavior

Each game card must:

- use verified game artwork where available;
- contain real Hebrew label text;
- expose an accessible label/role;
- provide >=48×48 effective press target;
- route to the correct registered game;
- preserve any current lock/disabled/progress state.

Missing art is tracked in the asset manifest; do not crop the reference screenshot into game cards.

## Responsive behavior

- compact phones retain 3×2 by tightening approved spacing/card dimensions;
- tablets use max card widths and larger gutters rather than giant proportional scale;
- no critical label clipping;
- page controls remain inside safe areas;
- no vertical page scroll should be required for the hub.

## Tests

Cover at minimum:

- registry count equals reachable game count;
- every registered game appears on exactly one page;
- first page has up to six items;
- second/subsequent pages are reachable;
- pressing every card opens the correct game route;
- page state/indicator works;
- Home/Practice side navigation works;
- no bottom nav;
- RTL and touch targets;
- no clipping at all active viewports.

Capture Games hub screenshots at every active landscape viewport and both pages where multiple pages exist.

## Acceptance criteria

- [ ] Games hub visually follows `games.png` and the design contract.
- [ ] 3×2 composition is preserved at supported landscape sizes.
- [ ] Every current registered game is reachable.
- [ ] No game is removed because it is absent from the reference.
- [ ] Paging is obvious and child-friendly.
- [ ] Cards use real interactive RN components and real labels.
- [ ] Verified artwork is used; missing art is recorded rather than invented.
- [ ] Navigation to every game works.
- [ ] Compact phone and tablet layouts pass visual review.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-21-report.md` exists.

## Exit condition

End with exactly one of:

`GAMES HUB READY FOR PHASE 22`

or

`BLOCKED`

Then stop.
