# Phase 20 Plan — Landscape Home Hub

## Purpose

Implement the approved landscape Home experience using the committed `docs/design/landscape/reference/home.png` as visual truth while preserving all current Home behavior, progress, category reachability, audio/music controls, parent access, and rewards state.

Phase 20 is the first full production screen redesign in the landscape program.

## Dependency

Read `docs/migration/phase-19-report.md` first.

Phase 20 may begin only when Phase 19 ends with:

`LANDSCAPE FOUNDATION GATE PASSED`

Otherwise stop as BLOCKED.

## Visual source of truth

Primary visual reference:

`docs/design/landscape/reference/home.png`

Also obey:

- `docs/design/landscape/README.md`
- `screen-map.md`
- `interaction-map.md`
- `asset-manifest.md`

Do not bake the screenshot into the app.

## In scope

1. Replace the old vertically-scrolling Home composition with the approved landscape hub.
2. Use the Phase 18 world shell and shared landscape primitives.
3. Implement the welcome/progress hero composition shown by the mock.
4. Preserve real progress data and current resume/continue semantics.
5. Implement the landscape category strip while keeping every category reachable.
6. Preserve music/audio control behavior.
7. Preserve parent/profile and reward/star behavior from the shared top chrome.
8. Preserve Home-to-Games/Home-to-Practice navigation through the Phase 19 architecture.
9. Remove old Home-only portrait/vertical layout code that is no longer reachable, when safe.
10. Add visual and behavioral coverage across the full landscape matrix.

## Out of scope

- Do not redesign Games hub; Phase 21.
- Do not redesign Practice hub; Phase 22.
- Do not redesign Category detail; Phase 23.
- Do not alter game/practice logic.
- Do not modify ad policy beyond ensuring current ads do not accidentally overlap the new Home; Phase 28 owns final ad policy.
- Do not retire Capacitor.

## Required composition

The exact implementation should follow the reference hierarchy rather than literal screenshot coordinates:

- full-screen painted/fantasy world background using verified production art;
- shared top utility chrome;
- Talki branding/logo placement;
- prominent central/upper welcome and progress panel;
- star mascot/character art where verified production asset exists;
- real progress text/bar/state;
- one-row child-friendly category strip near the lower content region;
- side navigation to Games and Practice;
- no bottom nav;
- no long vertical Home scroll.

## Category preservation

The reference shows fewer category cards than the current domain.

Requirements:

- all current built-in categories remain reachable;
- synthetic/custom/my-words behavior remains reachable where currently applicable;
- at the reference phone size, show the intended first visible group without deleting the rest;
- additional categories use horizontal paging/scrolling or another child-friendly landscape mechanism consistent with the design contract;
- no category is removed merely to match `home.png`.

## Compact phone strategy

Height is the limiting dimension.

On compact phones, reduce in this order before changing content reachability:

1. outer gaps;
2. panel padding;
3. title/logo scale within allowed tokens;
4. card size within minimum target/content legibility;
5. decorative spacing.

Do not add a vertical page scroll as the default fix.

## Tablet strategy

- Keep the composition centered/balanced.
- Use max widths/card sizes.
- Increase breathing room rather than scaling everything proportionally.
- Preserve the same information hierarchy and interaction model as phone.

## Assets

Use only verified production assets.

If required background/mascot/category artwork is missing:

- update `asset-manifest.md`;
- mark the affected acceptance item DESIGN-BLOCKED/BLOCKED as appropriate;
- do not use the reference screenshot or invented art as a shortcut.

## Behavior that must remain

- current progress source/state;
- resume/continue behavior;
- category selection;
- music toggle;
- reward/star count;
- parent gate entry;
- navigation to Games/Practice;
- persistence across relaunch where already implemented.

## Tests

Cover:

- Home renders without vertical overflow at every landscape viewport;
- top controls remain reachable and >=48×48;
- all categories can be reached;
- category press opens the correct category;
- progress state renders from real data;
- Games/Practice side navigation works;
- parent/rewards/music controls work;
- RTL ordering remains correct;
- no old bottom nav appears.

Capture screenshots at all active landscape viewports, with special review of 667×375, 844×390, 1024×768, and 1280×800.

## Acceptance criteria

- [ ] Home visually follows `home.png` and the design contract.
- [ ] Production UI is composed of real RN components, not a screenshot.
- [ ] No default vertical Home scrolling is required.
- [ ] All categories remain reachable.
- [ ] Real progress state is preserved.
- [ ] Music, parent, rewards, Games, and Practice navigation work.
- [ ] Compact phones fit without clipping critical UI.
- [ ] Tablet composition is balanced and not merely giant phone scaling.
- [ ] RTL and >=48×48 targets are verified.
- [ ] No production behavior outside Home is intentionally changed.
- [ ] Required visual screenshots are committed/evidenced.
- [ ] `docs/migration/phase-20-report.md` exists.

## Validation

Run full applicable mobile validation and Playwright across the active landscape matrix, plus relevant Home behavioral tests and legacy regression.

## Exit condition

End with exactly one of:

`HOME HUB READY FOR PHASE 21`

or

`BLOCKED`

Then stop.
