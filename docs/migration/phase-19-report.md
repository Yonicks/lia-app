# Phase 19 report — Landscape navigation architecture

## Summary

Phase 19 removes child `BottomNavigation` and the Expo Router `(tabs)`
group, promoting Home / Games / Rewards onto the root Stack beside the
existing Practice route. Hub switching uses `router.replace` via
`useGuardedReplace` and shared `LandscapeHubFrame` (Phase 18 shell +
top/side chrome). Rewards opens from the tappable points pill. Parent
gate remains logo long-press. Inner Home/Games/Practice content is
unchanged (Phases 20–22). The known P14-M16 Tabs stacking defect that
broke `smoke.spec.ts @ landscape-844` is eliminated with the Tabs
removal. Capacitor untouched.

## Foundation gate

| Condition | Evidence | Grade |
|---|---|---|
| 1. Centralized landscape geometry | Phase 17 `useLandscapeLayout` + Phase 18 tokens; hubs consume via `LandscapeHubFrame` | **PASS** |
| 2. App-wide landscape orientation | Phase 17 boot `lockLandscape()`; unchanged | **PASS** |
| 3. No child bottom navigation | `BottomNavigation.tsx` deleted; `(tabs)/` deleted; no `bottom-nav-*` in product | **PASS** |
| 4. Stable top/side navigation | `LandscapeHubFrame` side nav + `LandscapeTopBar` on Home/Games/Practice; replace semantics tested | **PASS** |

## Route graph

### Before
```text
Stack
  (tabs) [Tabs + BottomNavigation]
    index → Home
    games → GamesMenu
    rewards → Stickers
  practice/, game/, category/, cards/, parent/, …
```

### After
```text
Stack
  index → Home          (LandscapeHubFrame)
  games → GamesMenu     (LandscapeHubFrame)
  practice/ → Practice  (LandscapeHubFrame)
  rewards → Stickers    (LandscapeTopBar, no side nav)
  game/, category/, cards/, parent/, …
```

Hub ↔ hub: `replace`. Hub → detail / rewards / parent: `push`.

## Acceptance criteria

- [PASS] Child bottom navigation removed from Expo experience.
- [PASS] Persistent tab architecture gone — no hidden mounted hubs.
- [PASS] Home/Games/Practice use replace/reset hub switching.
- [PASS] Category/game/practice detail routes remain reachable.
- [PASS] Parent gate reachable exactly once (`testIds.parent.button`).
- [PASS] Rewards reachable via points (`testIds.nav.rewards`).
- [PASS] Deep links preserved (`?game=` / `DeepLinkAfterIntro` unchanged).
- [PASS] Hardware/back: detail `goBack` → hub; hub cycle does not unwind.
- [PASS] Phase 18 chrome integrated without final hub redesign.
- [PASS] No domain/persistence/audio/progress changes.
- [PASS] Relevant regression green (see tests); Windows `captureMatrix`
  file-lock flakes documented, not weakened.
- [PASS] This report exists.

## Files changed

Routing:
- Deleted `apps/mobile/app/(tabs)/` (`_layout`, `index`, `games`, `rewards`).
- Added `apps/mobile/app/index.tsx`, `games.tsx`, `rewards.tsx`.
- Deleted `BottomNavigation.tsx`; removed from `components/shell/index.ts`.

Chrome / nav:
- `src/features/shell/LandscapeHubFrame.tsx` — new.
- `src/hooks/useGuardedReplace.ts` — new.
- `src/domain/navigation/routes.ts` — `rewardsHref`.
- `LandscapeTopBar` — `onPointsPress` / `pointsTestID`; stable
  `parent.button` + `topbar-music`; absolute brand slot (TopBar parity).
- Hub screens + StickersScreen wired to landscape chrome.
- `app/dev/gallery.tsx` — BottomNav demo → LandscapeSideNav.
- Maestro YAMLs updated off `bottom-nav-*`.
- Tests: `navigation`, `home`, `parent`, `smoke`, `full-sweep`,
  `navigation.test.ts`, `testIds.nav`.

## Tests and exact results

```
$ npx tsc --noEmit          # exit 0
$ npx eslint …              # exit 0 (touched paths)
$ npx vitest run            # 47 files / 5513 tests PASS
$ npx expo-doctor           # 2 pre-existing failures (unchanged)
$ npx expo export --platform web  # PASS
```

Playwright (nav-critical):
- `navigation.spec.ts` — hub cycle replace + detail back: PASS.
- `parent.spec.ts` — 8/8 PASS with `click({ delay })` hold helper
  (raw mouse.down was flaky under landscape chrome; behavior unchanged).
- `smoke.spec.ts` — touch/reachability PASS; baselines updated for new
  chrome (no bottom nav / world shell). **landscape-844 no longer shows
  the 45% Games-over-Home Tabs stack** (P14-M16 fixed by architecture).
- `stickers.spec.ts` / `home.spec.ts` behavioral asserts PASS.
- Remaining intermittent failures during full runs were Windows
  `captureMatrix` `UNKNOWN: open 'docs/migration/screenshots/…'` file
  locks — not assertion failures. Historical evidence dirs reverted
  after runs (Phase 17 practice).

## Native coverage

Not applicable — no device/emulator/Maestro binary in this environment.

## Deviations

1. Parent e2e hold helper switched from mouse.down/up to
   `locator.click({ delay })` for RN-web Pressable reliability. Product
   hold contract (`PARENT_HOLD_MS`) unchanged.
2. Home “הכל” links use `replace` (hub switch); home.spec updated to
   return via side nav instead of `goBack`.

## Risks for Phase 20

1. Home still shows old inner scroll content inside the new shell —
   Phase 20 owns the reference Home composition.
2. World backgrounds on all hubs may compete with Phase 20–22 art
   densification; keep registry usage.
3. `captureMatrix` Windows file locks under parallel Playwright — prefer
   workers=1 when writing evidence, or skip evidence writes in CI.

## Explicit phase status

**LANDSCAPE FOUNDATION GATE PASSED**
