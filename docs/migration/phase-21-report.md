# Phase 21 report — Landscape Games hub

## Summary

Phase 21 redesigns the Games hub to the approved landscape 3×2 composition
inside `LandscapeHubFrame`: world background + top chrome + side nav
(Phase 18/19), `LandscapeTitle` with the reference subtitle, category chips
preserved for launch context, `LandscapeActivityGrid` + `LandscapeActivityCard`
pages derived from the live `GAMES` catalog (page size 6), and
`LandscapePageIndicator` for the second page. All eleven registered games
remain reachable. Match/bubbles/sort/speech card art is registered in
`gameCardAssets`. Capacitor untouched. Domain/reducers/scoring unchanged.
Practice hub and individual games left for Phases 22 / 24–25.

## Pre-flight inventory (recorded before edits)

- **Current tree:** `GamesMenuScreen` → ScrollView of heading + chips +
  wrap grid of `GameArtCard` / plain `TalkiCard` inside `LandscapeHubFrame`.
- **Catalog:** `GAMES` (11) / `gameRegistry` (11) — order quiz, memory,
  missing, cards, sounds, count, puzzle, match, bubbles, sort, speech.
- **Reusable seams:** `LandscapeHubFrame`, `LandscapeTitle`,
  `LandscapeActivityGrid` / `Card`, `LandscapePageIndicator`,
  `landscapeTokens`, `gameCardImage`, `GameCatChipRow`.
- **Assets:** Games world BG EXISTING; 7 cards already registered; 4 files
  on disk under `apps/mobile/assets/v2/game-menu/` not yet registered
  (match/bubbles/sort/speech) — Phase 21 job.
- **Paging:** page size 6 → page 1 (6) + page 2 (5 with empty-slot pad).
- **Expected edits:** `GamesMenuScreen`, `assets.ts` / `gameCards.ts`,
  hub frame title/auxiliary slots, tests, phase-21 evidence.
- **Risks:** height with chips + title + 3×2 on 667×375; stacked-hub
  duplicate testIDs when using router `push`; Windows captureMatrix noise.
- **Validation:** tsc, eslint, vitest, expo-doctor (pre-existing), expo
  export, Playwright games + navigation.

## Gate

Phase 20 report ends with `HOME HUB READY FOR PHASE 21` — confirmed.

## Game count and page composition

| Metric | Value |
|---|---|
| Registered games | **11** (`GAMES` / `GAME_IDS`) |
| Page size | 6 |
| Page 1 | quiz, memory, missing, cards, sounds, count |
| Page 2 | puzzle, match, bubbles, sort, speech (5 + empty pad) |
| Card art | 11/11 via `gameCardAssets` |

Reachability: unit test proves catalog ↔ pages 1:1; e2e opens every card
and asserts `game.shellRoot`, then returns to the hub.

## Acceptance criteria

- [PASS] Games hub visually follows `games.png` and the design contract
  (title + 3×2 art cards + chrome + side nav + page dots; world BG;
  no bottom nav).
- [PASS] 3×2 composition preserved at supported landscape sizes
  (`LandscapeActivityGrid` columns=3 rows=2).
- [PASS] Every current registered game is reachable (11/11 e2e).
- [PASS] No game removed because absent from the reference.
- [PASS] Paging is obvious and child-friendly (`LandscapePageIndicator`
  ≥48 hit targets; dots select pages).
- [PASS] Cards use real interactive RN components and real Hebrew labels.
- [PASS] Verified artwork used for all 11; no invented art; no reference
  screenshot cropping.
- [PASS] Navigation to every game works; chips + Home/Practice side nav
  preserved.
- [PASS] Compact phone and tablet layouts pass visual review (phase-21
  matrix + touch/reachability audits).
- [PASS] Full relevant regression passes (tsc/eslint/vitest/export/
  Playwright games + navigation).
- [PASS] This report exists.

## Files changed

Production:
- `apps/mobile/src/features/games/GamesMenuScreen.tsx` — landscape 3×2
  paged hub.
- `apps/mobile/src/features/shell/LandscapeHubFrame.tsx` — optional
  `titleSlot` / `auxiliary`.
- `apps/mobile/src/features/games/GameCatChipRow.tsx` — optional `nowrap`
  for hub strip.
- `apps/mobile/src/design-system/assets.ts` — register match/bubbles/sort/
  speech card art.
- `apps/mobile/src/domain/games/gameCards.ts` — all-eleven art lookup.
- `apps/mobile/src/domain/games/gameHubPages.ts` — pure page chunking.
- Deleted `apps/mobile/src/features/home/GameArtCard.tsx` (replaced by
  `LandscapeActivityCard` on the hub).
- `apps/mobile/src/testing/testIds.ts` — games title/grid/page/indicator.

Docs:
- `docs/design/landscape/asset-manifest.md` — four cards marked registered.
- `docs/migration/phase-21-report.md` — this file.
- `docs/migration/CURSOR-RUN-LOG.md` — Phase 21 status.
- `docs/migration/screenshots/phase-21/` — matrix evidence (both pages).

Tests:
- `apps/mobile/tests/unit/games-hub.test.ts` — count/pages/art.
- `apps/mobile/tests/e2e/games.spec.ts` — composition, reachability,
  chips/side nav, audits, `captureMatrix(..., '21', ...)`.
- `apps/mobile/tests/e2e/navigation.spec.ts` — stop rewriting phase-07
  games/practice capture noise; keep route reachability assertions.

## Screenshot index

Under `docs/migration/screenshots/phase-21/` (8 viewports × 2 pages):

- `{W}x{H}-games.png` — page 1 (6 cards)
- `{W}x{H}-games-page-2.png` — page 2 (5 cards)

Viewports: 667×375, 740×360, 844×390, 932×430, 1024×768, 1133×744,
1280×800, 1366×1024.

Historical `phase-07` practice/games capture dirt from this run was
reverted.

## Compact / phone / tablet notes

- Compact (667×375 / 740×360): 3×2 retained via tokens; chips are a
  single-row horizontal strip; page indicator in auxiliary slot.
- Modern phones (844 / 932): reference-like breathing room.
- Tablets: max card heights / gutters from `landscapeTokens`, not uniform
  phone scale-up.

## Native coverage

Expo web Playwright matrix only for this phase (same as Phase 20). Native
device QA remains a later release-gate item. Capacitor not modified.

## Assets still missing

None for Games hub card art (11/11 EXISTING and registered). Parent/profile
icon wiring decision from the asset manifest remains open and out of scope.

## Deviations

1. Category chips remain on the hub (not in `games.png`) so game launch
   category context is preserved — compact horizontal strip, not a wrap
   stack that would force vertical hub scroll.
2. Active page only mounts cards (page indicator switches pages) rather
   than a swipe `ScrollView` keeping off-page cards in the DOM — avoids
   hit-test ghosts and keeps the hub viewport-bound; dots remain the
   child-friendly discovery control required by the plan.
3. Page-1 card set follows live `GAMES` order, not the exact six titles
   illustrated in the reference crop (behavioral catalog truth).

## Risks carried forward (Phase 22)

1. Practice hub still uses the pre-landscape list inside `LandscapeHubFrame`.
2. Practice card art files exist on disk but are not registered/wired yet.
3. Stacked router `push('/games')` can leave a prior hub mounted in the DOM
   under Expo web — prefer side-nav replace in e2e when asserting unique
   side-nav testIDs.

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint .                     # exit 0
$ npx vitest run                   # 48 files / 5517 tests PASS
$ npx expo-doctor                  # exit 1 (pre-existing: app.json vs
                                   # app.config.ts; 4 patch version skews)
$ npx expo export --platform web   # exit 0
$ npx playwright test tests/e2e/games.spec.ts \
    tests/e2e/navigation.spec.ts --workers=1 --update-snapshots
  # 96 passed (2.2m)
```

## Explicit phase status

**GAMES HUB READY FOR PHASE 22**
