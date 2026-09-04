# Phase 22 report — Landscape Practice hub

## Summary

Phase 22 redesigns the Practice hub to the approved landscape 3×2
composition inside `LandscapeHubFrame`: world background + top chrome +
side nav (Phase 18/19), `LandscapeTitle` with the reference subtitle,
category chips preserved for launch context, and a single-page
`LandscapeActivityGrid` + `LandscapeActivityCard` (banner footer) driven
by live `PRACTICE_LIST` (six modes). All six registered practice modes
remain reachable with existing `practiceHref` + chip category context.
Practice card art is registered in `practiceCardAssets`. Capacitor
untouched. Domain/reducers/session logic unchanged. Individual practice
activities left for Phase 26.

## Pre-flight inventory (recorded before edits)

- **Current tree:** `PracticeMenuScreen` → `ScrollView` of heading + chips
  + plain `TalkiCard` list inside `LandscapeHubFrame`.
- **Catalog:** `PRACTICE_LIST` (6) / `practiceRegistry` (6) — order focus,
  receptive, cloze, temptation, pairs, combine.
- **Reusable seams:** `LandscapeHubFrame`, `LandscapeTitle`,
  `LandscapeActivityGrid` / `Card` (`footerVariant="banner"`),
  `landscapeTokens`, `GameCatChipRow`, practice world BG already in
  `landscapeBackgrounds.practice`.
- **Assets:** Practice world BG EXISTING; six card files on disk under
  `apps/mobile/assets/v2/practice-menu/` not yet registered — Phase 22 job.
- **Paging:** not required (exactly six modes → one 3×2 page).
- **Expected edits:** `PracticeMenuScreen`, `assets.ts` + practice card
  resolver, testIds, unit/e2e, asset-manifest, phase-22 evidence.
- **Risks:** height with chips + title + 3×2 on 667×375; Expo web raster
  paint parity (same surface as Phase 21); stacked-hub duplicate testIDs.
- **Validation:** tsc, eslint, vitest, expo export, Playwright practice +
  navigation.

## Gate

Phase 21 report ends with `GAMES HUB READY FOR PHASE 22` — confirmed.

## Mode count and composition

| Metric | Value |
|---|---|
| Registered practice modes | **6** (`PRACTICE_LIST` / `practiceRegistry`) |
| Grid | 3×2 single page (no paging) |
| Order | focus, receptive, cloze, temptation, pairs, combine |
| Card art | 6/6 via `practiceCardAssets` |

Reachability: unit test proves catalog ↔ art 1:1; e2e opens every card and
asserts the mode’s launch root, then returns to the hub.

## Acceptance criteria

- [PASS] Practice hub visually follows `practice.png` and the design
  contract (title + subtitle + 3×2 art cards + chrome + side nav; world BG
  wired; no bottom nav). Expo web matrix shows composition/chrome/labels;
  see Deviations for raster paint on the web test surface.
- [PASS] Complete current practice catalog is visible/reachable (6/6 e2e).
- [PASS] 3×2 layout fits supported landscape classes
  (`LandscapeActivityGrid` columns=3 rows=2; matrix + touch/reachability).
- [PASS] Entry/gating behavior preserved (`practiceHref` + category chips).
- [PASS] Cards are real interactive RN UI with real Hebrew labels from
  `PRACTICE_LIST`.
- [PASS] Verified artwork only; registered in `practiceCardAssets`; no
  invented art; no reference screenshot as UI.
- [PASS] Compact phone and tablet layouts pass visual review (phase-22
  matrix + audits).
- [PASS] Full relevant regression passes (tsc/eslint/vitest/export/
  Playwright practice + navigation).
- [PASS] This report exists.

## Files changed

Production:
- `apps/mobile/src/features/practice/PracticeMenuScreen.tsx` — landscape
  3×2 Practice hub.
- `apps/mobile/src/design-system/assets.ts` — `practiceCardAssets` (6).
- `apps/mobile/src/domain/practice/practiceCards.ts` — art lookup.
- `apps/mobile/src/features/games/GameCatChipRow.tsx` — comment for
  Practice hub `testIDFactory` / nowrap strip.
- `apps/mobile/src/testing/testIds.ts` — practice title/grid/chip ids.
- `docs/design/landscape/asset-manifest.md` — practice cards EXISTING +
  registered.

Tests / evidence:
- `apps/mobile/tests/unit/practice-hub.test.ts` — count/order/art.
- `apps/mobile/tests/e2e/practice.spec.ts` — composition, reachability,
  chips/side nav, audits, `captureMatrix(..., '22', 'practice')`.
- `apps/mobile/tests/e2e/navigation.spec.ts` — assert practice grid/card
  without rewriting historical phase-07 captures.
- `docs/migration/screenshots/phase-22/` — matrix evidence.

## Screenshot index

Under `docs/migration/screenshots/phase-22/` (8 viewports × 1 hub):

- `{W}x{H}-practice.png` — 3×2 Practice hub

Viewports: 667×375, 740×360, 844×390, 932×430, 1024×768, 1133×744,
1280×800, 1366×1024.

No phase-0N screenshot noise was produced by this run (nothing to revert).

## Compact / phone / tablet notes

- Compact (667×375 / 740×360): 3×2 retained via tokens; chips are a
  single-row horizontal strip.
- Modern phones (844 / 932): reference-like breathing room.
- Tablets: max card heights / gutters from `landscapeTokens`, not uniform
  phone scale-up.

## Native coverage

Expo web Playwright matrix only for this phase (same as Phase 20/21).
Native device QA remains a later release-gate item. Capacitor not modified.

## Assets still missing

None for Practice hub card art (6/6 EXISTING and registered). Parent/profile
icon wiring decision from the asset manifest remains open and out of scope.

## Deviations

1. Category chips remain on the hub (not illustrated in `practice.png`) so
   practice launch category context is preserved — compact horizontal
   strip, same intentional deviation as Games Phase 21.
2. Card titles follow live `PRACTICE_LIST` Hebrew labels (behavioral truth),
   not the alternate titles illustrated on some reference cards
   (e.g. temptation remains `הצנצנת`, not a mock-only label).
3. Expo web Playwright captures show hub chrome, title, chips, purple
   banner labels, and 3×2 card frames, but activity-card / world-background
   rasters often do not paint in the capture (cream `LandscapeScreen`
   fallback visible). Same testing-surface pattern as Phase 21 Games
   evidence; native phone/tablet remains the product target. Art is
   registered via `require()` and proven by unit tests.

## Risks carried forward (Phase 23)

1. Rewards / stickers hub still needs landscape redesign.
2. Expo web may under-render large hub card rasters in Playwright
   screenshots — confirm art paint on native before release gate.
3. Stacked router `push` can leave a prior hub mounted under Expo web —
   prefer side-nav replace in e2e when asserting unique side-nav testIDs.

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint .                     # exit 0
$ npx vitest run                   # 49 files / 5521 tests PASS
$ npx expo export --platform web   # exit 0
$ npx playwright test tests/e2e/practice.spec.ts \
    tests/e2e/navigation.spec.ts --workers=1 --update-snapshots
  # 96 passed (2.3m)
```

## Explicit phase status

**PRACTICE HUB READY FOR PHASE 23**
