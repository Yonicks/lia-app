# Phase 20 report — Landscape Home hub

## Summary

Phase 20 redesigns the Home hub to the approved landscape composition inside
`LandscapeHubFrame`: world background + top chrome + side nav (Phase 18/19),
welcome/progress hero via `LandscapeHeroPanel` / `ContinueLearningHero`, and a
one-row `LandscapeCategoryStrip` that keeps every category (including `mine`)
reachable by horizontal scroll. The old vertically scrolling Home
(category grid + practice row + games row) is removed. Featured practice/game
shortcuts formerly on Home fold into Phase 19 side-nav hub entry — documented
below as intentional UX invention. Capacitor untouched. Domain/progress/
audio/persistence unchanged.

## Pre-flight inventory (recorded before edits)

- **Current tree:** `HomeScreen` → ScrollView of `ContinueLearningHero`,
  `CategoryGrid`, `HomePracticeRow`, `HomeGamesRow` inside `LandscapeHubFrame`.
- **Data:** `useHomeData` → `currentCategory` / `catLearned` / `allCats` /
  progress + settings stores (unchanged).
- **Reusable seams:** `LandscapeHeroPanel`, `LandscapeCategoryStrip`,
  `LandscapeCategoryCard`, `landscapeTokens`, `homeAssets.heroStar`,
  `categoryArt` / `categoryIcons`, `LandscapeHubFrame` side nav.
- **Assets:** Home world BG EXISTING; mascot `homeAssets.heroStar` EXISTING;
  category art EXISTING for 10 built-ins; `mine` fallback `brand.starMark`.
- **Expected edits:** `HomeScreen`, hero rewrite, new strip component, delete
  portrait-only Home rows/grid, e2e updates, evidence under phase-20.
- **Risks:** Height on 667×375; practice/games reachability after row removal;
  Windows `captureMatrix` locks on historical evidence dirs.
- **Validation:** tsc, eslint, vitest, expo export, Playwright home +
  navigation + smoke (update snapshots).

## Gate

Phase 19 report ends with `LANDSCAPE FOUNDATION GATE PASSED` — confirmed.

## Acceptance criteria

- [PASS] Home visually follows `home.png` and the design contract
  (hero + strip + chrome + side nav; world BG; no bottom nav).
- [PASS] Production UI is real RN components, not a screenshot.
- [PASS] No default vertical Home scrolling — `overflow:hidden` shell +
  flex column body (`justifyContent: 'space-between'`).
- [PASS] All categories remain reachable — strip includes all 11 from
  `allCats()`; e2e opens `mine` after `scrollIntoViewIfNeeded`.
- [PASS] Real progress state preserved — `currentCategory` / fresh vs
  returning hero / `learned/total` / words-to-next-star.
- [PASS] Music, parent, rewards, Games, Practice navigation work
  (top chrome + side nav; e2e coverage).
- [PASS] Compact phones fit without clipping critical UI (667×375 /
  compact-phone baselines reviewed).
- [PASS] Tablet composition uses tokens (breathing room / max widths),
  not giant uniform phone scaling.
- [PASS] RTL and ≥48×48 targets verified (`auditTouchTargets` clean;
  RTL row/logical layout).
- [PASS] No intentional behavior change outside Home (Games/Practice hubs
  still Phase 21/22; domain untouched).
- [PASS] Required visual screenshots evidenced (`phase-20/` + Playwright
  baselines).
- [PASS] This report exists.

## UX invention (practice / games)

Portrait Home exposed three practice modes + three games + “הכל” links.
The landscape reference and height contract do not include those rows.

**Decision:** fold featured Home practice/games rows into Phase 19 side-nav
hub switching:

- Side start → Practice hub (all six modes, including former Home three).
- Side end → Games hub (all eleven games, including former Home three).

Reachability is preserved; one-tap Home shortcuts are intentionally moved
to hubs so Home stays a single landscape viewport. E2e updated to assert
hub routing instead of Home-row testIDs (coverage not weakened).

## Files changed

Production:
- `apps/mobile/src/features/home/HomeScreen.tsx` — landscape composition.
- `apps/mobile/src/features/home/ContinueLearningHero.tsx` — uses
  `LandscapeHeroPanel` + `homeAssets.heroStar`.
- `apps/mobile/src/features/home/HomeCategoryStrip.tsx` — new.
- `apps/mobile/src/features/home/useHomeData.ts` — drop unused Home row
  re-exports.
- Deleted portrait-only: `CategoryGrid.tsx`, `HomeCategoryCard.tsx`,
  `HomePracticeRow.tsx`, `HomeGamesRow.tsx` (`GameArtCard` kept for Games menu).
- `apps/mobile/src/design-system/landscape/LandscapeHeroPanel.tsx` —
  `ctaTestID`, compact padding/mascot scale.
- `apps/mobile/src/testing/testIds.ts` — Home comment update.

Docs:
- `docs/design/landscape/asset-manifest.md` — mascot choice recorded.
- `docs/migration/phase-20-report.md` — this file.
- `docs/migration/CURSOR-RUN-LOG.md` — Phase 20 status.

Tests / evidence:
- `apps/mobile/tests/e2e/home.spec.ts` — landscape composition + category
  reachability + side-nav hub access; `captureMatrix(..., '20', ...)`.
- `apps/mobile/tests/e2e/navigation.spec.ts` — game/practice via hubs.
- `apps/mobile/tests/e2e/full-sweep.spec.ts` — quiz via Games hub.
- `apps/mobile/tests/unit/home-data.test.ts` — category strip wording.
- Playwright baselines under
  `apps/mobile/tests/e2e/__screenshots__/home.spec.ts/` and smoke.
- `docs/migration/screenshots/phase-20/` — full matrix × home / home-empty /
  home-progressed.

Historical `docs/migration/screenshots/phase-01` / `phase-07` dirtied by
parallel `captureMatrix` were reverted (`git checkout`) per phase practice.

## Visual comparison notes

| Viewport | Notes |
|---|---|
| 667×375 / compact-phone | Hero + strip fit; gaps/padding reduced via tokens; no vertical page scroll. |
| 844×390 | Closest to reference: mascot + white progress panel + CTA + strip + side nav. |
| 932×430 | Same hierarchy; more breathing room. |
| 1024×768 / tablet-4-3 | Balanced; tokens raise gutters/card max without giant scaling. |
| 1280×800 / tablet-16-10 | Same composition; more world BG visible. |

Differences vs `home.png` (acceptable): category count exceeds mock (scroll);
progress uses live data (e.g. חיות 1/26) not mock 8/10 רגשות; parent control
remains logo long-press (Phase 19), not a separate profile chip.

## All-category reachability evidence

- Strip renders every `allCats()` id (10 built-ins + `mine`).
- Playwright: `all categories including mine remain reachable` attaches all
  cards and opens `mine`.
- Animals open + burst + back covered; no category dropped to match mock.

## Progress / navigation / control behavior

- Hero fresh (`learned.size === 0`) vs returning from `currentCategory()`.
- CTA opens hero category; category cards push `categoryHref(id)`.
- Music: `topbar-music`; parent: brand long-press; rewards: points pill.
- Games/Practice: side nav `replace` to hubs.

## Screenshot index

Playwright (`home.spec.ts` baselines, 8 projects):

- `Phase-7-20-Home-captures-the-Home-baseline-screenshot-1-*.png`

Evidence matrix (`docs/migration/screenshots/phase-20/`):

- `{667x375,740x360,844x390,932x430,1024x768,1133x744,1280x800,1366x1024}-home.png`
- same sizes for `home-empty` and `home-progressed`

Smoke baselines updated for the new Home chrome/content.

## Compact phone result

PASS — critical UI visible; touch audit clean; no default vertical Home scroll.

## Modern / large phone result

PASS — 844×390 / 932×430 match reference hierarchy.

## Tablet result

PASS — same information hierarchy; tokenized breathing room.

## Native coverage

Not applicable — no device/emulator/Maestro binary in this environment.

## Assets still missing

None required for Home visual completion. Mascot choice: `homeAssets.heroStar`.
`mine` continues to use `brand.starMark` fallback (EXISTING).

## Deviations

1. Practice/games Home rows folded into side-nav hubs (see UX invention).
2. Parent entry remains logo long-press (not separate profile icon from mock).
3. Navigation `captureMatrix` still writes phase-07 games/practice menus;
   those historical dirs were reverted after the run to avoid dirty evidence.

## Risks carried forward (Phase 21)

1. Games hub still uses pre-landscape menu layout inside `LandscapeHubFrame`.
2. Featured Home game shortcuts now require an extra hub hop — Phase 21
   should keep memory/quiz/missing (and all games) first-class on the hub.
3. Parallel Playwright + `captureMatrix` can lock historical screenshot dirs
   on Windows — prefer workers=1 when writing evidence, or revert dirtied dirs.

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint .                     # exit 0
$ npx vitest run                   # 47 files / 5513 tests PASS
$ npx expo export --platform web   # exit 0
$ npx playwright test tests/e2e/home.spec.ts \
    tests/e2e/navigation.spec.ts tests/e2e/smoke.spec.ts \
    --workers=2 --update-snapshots
  # 160 passed (2.0m)
```

## Explicit phase status

**HOME HUB READY FOR PHASE 21**
