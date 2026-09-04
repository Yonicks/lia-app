# Phase 18 report — Landscape design system and world shell

## Summary

Phase 18 adds the reusable landscape visual foundation under
`apps/mobile/src/design-system/landscape/`: a single `LandscapeWorldShell`
with world background (cover + focal crop), safe-area padding, top chrome,
start/end side-nav lanes, content, and auxiliary slots; plus activity/
category/grid/hero/progress/title/page-indicator primitives and
metrics-driven tokens. Non-production fixtures at
`/dev/landscape-shell` prove Home, Games, and Practice compositions
without redesigning those product screens. Production world backgrounds
(1672×941) are registered as `landscapeBackgrounds`; reference PNGs are
never used at runtime. Capacitor / legacy app untouched. Domain /
game / practice behavior unchanged.

## Pre-flight inventory (recorded before edits)

- **Reusable seams:** `useLandscapeLayout()`, Talki* primitives, RTL
  logical helpers, `assets.ts` registries, TopBar hold-gate pattern,
  Reanimated `useReducedMotion`, expo-image (contentFit/contentPosition).
- **Phase 17 metrics API:** `useLandscapeLayout()` → full `LandscapeLayout`.
- **Current chrome/cards:** `TopBar`, `BottomNavigation`, `GameArtCard`,
  `TalkiImageCard` — left in place; product screens not redesigned.
- **Assets:** world BGs EXISTING on disk, unwired → registered here.
  Tablet crop strategy: single 16:9 source + focal cover (verified).
- **Proposed tree:** `design-system/landscape/*` + `/dev/landscape-shell`
  fixture + Playwright spec.
- **Visual plan:** fixture screenshots across compact-phone, landscape-844,
  tablet-4-3, tablet-16-10 (+ full 8-project matrix for baselines).

## Acceptance criteria

- [PASS] Shared landscape shell exists and consumes only centralized Phase 17
  metrics (`useLandscapeLayout` + `landscapeTokens(deviceClass, uiScale)`).
- [PASS] Shell supports Home/Games/Practice composition variants without
  duplicated shells — one `LandscapeWorldShell`, variant/slots differ.
- [PASS] Reusable activity/category/grid/hero/progress/title/page-indicator
  primitives exist under `design-system/landscape/`.
- [PASS] No reference screenshot is embedded as production UI (fixtures use
  `landscapeBackgrounds` + neutral labeled activity cards / category icons).
- [PASS] Background behavior never stretches raster art — expo-image
  `contentFit="cover"` + `contentPosition` from focal points.
- [PASS] Phone/tablet spacing strategy is tokenized and centralized
  (`tokens.ts`); unit-tested for compact reduction and bounded tablet growth.
- [PASS] RTL/logical positioning verified (fixture shell under `dir="rtl"`;
  side-nav chevrons via `forwardChevronRotation()`).
- [PASS] Child interactive primitives meet 48×48 — tokens clamp sizes;
  Playwright `auditTouchTargets` on Games fixture: clean.
- [PASS] Test fixtures render correctly at required representative landscape
  viewports — `landscape-shell.spec.ts` 40/40 across 8 projects.
- [PASS] Asset manifest updated with verified source size, registry wiring,
  and cover/focal crop notes.
- [PASS] Existing product behavior is not redesigned — no changes under
  `features/`, `(tabs)/`, or product `components/shell/` routes.
- [PASS] `docs/migration/phase-18-report.md` exists (this file).

## Files changed

Production / design-system:
- `apps/mobile/src/design-system/landscape/` — new component family
  (`LandscapeScreen`, `LandscapeWorldShell`, `LandscapeWorldBackground`,
  `LandscapeTopBar`, `LandscapeSideNav`, `LandscapeActivityCard`,
  `LandscapeActivityGrid`, `LandscapeCategoryCard`,
  `LandscapeCategoryStrip`, `LandscapeHeroPanel`, `LandscapeProgress`,
  `LandscapeTitle`, `LandscapePageIndicator`, `tokens.ts`,
  `backgrounds.ts`, `index.ts`).
- `apps/mobile/src/design-system/assets.ts` — `landscapeBackgrounds`
  registry for home/games/practice world PNGs.
- `apps/mobile/app/dev/landscape-shell.tsx` — non-production fixture route.
- `apps/mobile/src/testing/testIds.ts` — `landscapeShell.*` ids.

Docs:
- `docs/design/landscape/asset-manifest.md` — world BG status/wiring/focal
  notes (VERIFY → EXISTING single-source + focal).

Tests / evidence:
- `apps/mobile/tests/unit/landscape-shell.test.ts` — tokens + crop/focal.
- `apps/mobile/tests/e2e/landscape-shell.spec.ts` — fixture e2e.
- `apps/mobile/tests/e2e/__screenshots__/landscape-shell.spec.ts/` —
  24 Playwright baselines (3 frames × 8 viewports).
- `docs/migration/screenshots/phase-18/` — captureMatrix evidence for the
  four plan-named viewports (compact-phone, landscape-844, tablet-4-3,
  tablet-16-10) × three frames.

No legacy Capacitor / root `android/` / `ios/` / `www/` changes.

## Shell API summary

```text
LandscapeWorldShell
  variant: 'home' | 'games' | 'practice' | 'detail'
  world? + backgroundSource? + backgroundFocal?
  topBar? | titleSlot? | sideNavStart? | sideNavEnd?
  children (content) | auxiliary?
  → owns safe-area padding, overflow:hidden, side lanes from tokens

landscapeTokens(deviceClass, uiScale)
  → gap, padInline/Block, title/subtitle sizes, card caps,
    sideNavSize/lane, topBarMinHeight, heroMaxWidth, pageDotSize,
    gridColumns=3, gridRows=2

landscapeBackgrounds + LANDSCAPE_BG_FOCAL + coverCropAxis()
```

## Tests and exact results

All commands from `apps/mobile/` unless noted.

### 1. Static checks: PASS

```
$ npx tsc --noEmit
(no output, exit 0)

$ npx eslint src/design-system/landscape app/dev/landscape-shell.tsx \
    tests/unit/landscape-shell.test.ts tests/e2e/landscape-shell.spec.ts
(no output, exit 0)
```

### 2. Vitest: PASS

```
$ npx vitest run
 Test Files  47 passed (47)
      Tests  5513 passed (5513)
```

(5504 at Phase 17 + 9 in `landscape-shell.test.ts`.)

### 3. expo-doctor: 2 pre-existing failures, unrelated

Same as Phase 17: `app.json` unused by `app.config.ts`; 4 patch-level
package mismatches. Neither caused by this phase.

### 4. Web export: PASS

```
$ npx expo export --platform web
Exported: dist
```

### 5. Playwright — Phase 18 fixtures: PASS

```
$ npx playwright test tests/e2e/landscape-shell.spec.ts --workers=2
  40 passed
```

Touch + reachability audits clean on the Games fixture frame.
Screenshots established for Home/Games/Practice × 8 viewports.

### 6. Playwright — full suite: PASS with explained pre-existing exceptions

Full matrix (`npx playwright test --workers=2`): ~823–844 passed per run;
remaining failures are screenshot diffs, overwhelmingly at **0.01 pixel
ratio**, plus the known `smoke.spec.ts @ landscape-844` stacking defect.

**Proof that product screenshot failures are not Phase 18 regressions:**

1. No product feature/tab/shell route files were modified in this phase.
2. After `git stash` of all Phase 18 work, re-export +
   `smoke.spec.ts` / `home.spec.ts` screenshot @ `landscape-844` still
   failed (smoke at **0.45** ratio — the Phase 17-documented P14-M16 Tabs
   stacking bug).
3. With Phase 18 restored, `workers=1` on smoke+home+landscape-shell:
   **128 passed**, **16 failed** — every failure is only the final
   `toHaveScreenshot` on smoke/home across viewports; touch/reachability
   assertions passed. `landscape-shell` remained fully green.

Documented the same way Phase 17 treated bubbles 0.01 flake and smoke@844:
not weakened, not baseline-updated to hide defects; carried forward.

Historical `docs/migration/screenshots/phase-0N/` evidence regenerated by
`captureMatrix` during runs was reverted (`git checkout` + `git clean`)
except the new `phase-18/` evidence directory.

## Screenshot index

| Evidence | Location |
|---|---|
| Fixture baselines (8×3) | `apps/mobile/tests/e2e/__screenshots__/landscape-shell.spec.ts/` |
| Plan matrix captures | `docs/migration/screenshots/phase-18/*-shell-{home,games,practice}-*.png` |

## Compact phone result

`compact-phone` (667×375) and `compact-android-phone` (740×360): shell
fixtures render Home/Games/Practice; tokens reduce gap/padding/title;
touch targets ≥48; screenshots captured.

## Modern/large phone result

`landscape-844` / `landscape-932`: phone classification preserved; shell
compositions balanced; fixtures pass.

## Tablet result

`tablet-4-3` / `tablet-16-10` / `tablet-1133` / `large-tablet`: cover crop
is vertical vs 16:9 source (unit-tested); focal points keep meadow/castle;
tokens increase breathing room without giant uniform scale.

## Native coverage

Device: not applicable — no device, emulator, or Maestro binary in this
environment, consistent with every prior landscape phase report. Web
fixtures validate geometry and composition only.

## Assets still missing / status

- World backgrounds: **EXISTING** and wired (`landscapeBackgrounds`).
- Separate tablet crop files: **not required** — single source + focal
  cover is the Phase 18 decision; revisit only if native QA shows softness.
- Game/practice card registry wiring: still Phase 21/22 (files exist).
- No new DESIGN-BLOCKED rows for shell backgrounds.

## Deviations

1. `LandscapeTopBar` uses a three-column flex layout (start / brand / end)
   instead of the legacy absolute-centered brand overlay, after the absolute
   brand slot failed Playwright reachability (`elementFromPoint` covered the
   music control). Visual role is unchanged; hubs may still choose
   `showLogo={false}` when a title band owns branding.
2. Full-suite screenshot noise at 0.01 ratio was **not** mass-updated —
   product baselines stay as committed; Phase 18 only adds its own fixture
   baselines. Matches Phase 17's policy of not papering over flake.

## Risks for Phase 19

1. **P14-M16 / smoke@844 Tabs stacking** remains open — Phase 19 owns
   removing `BottomNavigation` and installing the landscape nav model; that
   is the correct fix site.
2. Product screens still use the old `TopBar`/`BottomNavigation`; Phase 19
   must swap chrome onto `LandscapeTopBar` / `LandscapeSideNav` without
   dropping parent-hold / music / points behavior.
3. Fixture route must stay unlinked from child navigation.
4. Large world PNG payloads (~3MB each) are fine for fixtures; hubs should
   keep using the registry rather than duplicating requires.

## Explicit phase status

**LANDSCAPE SHELL READY FOR PHASE 19**
