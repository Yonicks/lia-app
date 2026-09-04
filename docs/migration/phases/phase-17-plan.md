# Phase 17 Plan — Landscape Runtime and Responsive Foundation

## Purpose

Convert the Expo application from the historical mixed responsive/route-specific orientation model to one centralized landscape runtime that correctly distinguishes phones from tablets by geometry that makes sense in landscape.

This phase changes orientation and responsive infrastructure only. It does **not** redesign Home, Games, Practice, Category, games, practice activities, Parent Center, or Rewards.

## Dependency

Read `docs/migration/phase-16-report.md` first.

Phase 17 may begin only when Phase 16 ends with:

`LANDSCAPE FOUNDATION READY FOR PHASE 17`

If the report is missing, stale, or BLOCKED, stop and report Phase 17 as BLOCKED.

## In scope

1. Make landscape the app-wide child product contract from boot.
2. Replace width-only device classification with centralized landscape geometry.
3. Provide one shared hook/API for screen metrics and safe-area-aware usable geometry.
4. Freeze the landscape web viewport matrix.
5. Update responsive/orientation unit tests and Playwright projects to the new contract.
6. Remove feature-local responsive bypasses identified by Phase 16 where they can be safely routed through the shared metrics layer without redesigning the feature.
7. Document remaining deliberate exceptions.

## Out of scope

- No visual hub redesign.
- Do not remove the bottom navigation yet; Phase 19 owns navigation architecture.
- Do not build the landscape world shell; Phase 18 owns it.
- Do not rewrite game/practice/category layouts.
- Do not retire Capacitor.
- Do not alter domain, scoring, progress, persistence, audio, TTS, recording, speech, or ad behavior.

## Required runtime model

Create or evolve a centralized landscape layout contract equivalent to:

```ts
export interface LandscapeLayout {
  width: number;
  height: number;
  shortEdge: number;
  longEdge: number;
  aspectRatio: number;
  deviceClass: 'compactPhone' | 'phone' | 'tablet' | 'largeTablet';
  safeInsets: { top: number; right: number; bottom: number; left: number };
  usableWidth: number;
  usableHeight: number;
  uiScale: number;
}
```

Exact naming may follow existing repository conventions, but there must be one canonical source.

### Provisional device classes

Validate and implement against the Phase 16 audit. Unless the audit proves a better threshold set, use short-edge classification:

- `< 390` → `compactPhone`
- `390–599` → `phone`
- `600–899` → `tablet`
- `>= 900` → `largeTablet`

The implementation must correctly treat landscape phones such as 844×390 and 932×430 as phones rather than tablets.

## Orientation contract

- Configure the Expo product to launch in landscape.
- Centralize native orientation calls in the existing orientation service seam.
- Remove route-specific child orientation policy when it conflicts with the app-wide landscape contract.
- No feature screen may directly call `expo-screen-orientation`.
- Web cannot truly lock device orientation; web tests validate landscape geometry only.
- Preserve a safe fallback if native orientation APIs are unavailable during tests/web export.

## Responsive rules

- Components consume shared landscape metrics.
- Do not add new `width > 768`, `isTablet = width >= ...`, or similar feature-local breakpoints.
- Do not create separate phone/tablet component trees.
- Safe areas must be part of usable dimensions.
- The short viewport height is the primary constraint on phones.
- `uiScale` must be bounded; do not uniformly shrink the entire app to make content fit.

## Required viewport matrix

Implement the active visual/web matrix unless Phase 16 justified a change:

- 667×375 — compact phone
- 740×360 — compact Android phone
- 844×390 — standard phone/reference
- 932×430 — large phone
- 1024×768 — small 4:3 tablet
- 1133×744 — tablet
- 1280×800 — 16:10 tablet
- 1366×1024 — large tablet

Portrait projects may remain only as explicit negative/orientation-policy tests; they must not be the primary landscape visual matrix.

## Expected implementation seams

Inspect current code before editing. Likely seams include:

- `apps/mobile/app.config.ts`
- `apps/mobile/src/services/orientation/`
- `apps/mobile/src/design-system/responsive/breakpoints.ts`
- `apps/mobile/src/design-system/responsive/useDevice.ts`
- `apps/mobile/src/design-system/responsive/useSafeLayout.ts`
- `apps/mobile/tests/e2e/viewports.ts`
- `apps/mobile/playwright.config.ts`

Do not assume these paths are unchanged; current source wins.

## Tests

Add unit coverage for:

- every boundary around device classes;
- width/height order independence;
- safe-area subtraction;
- usable geometry;
- `uiScale` bounds;
- native orientation service behavior/fallback;
- representative phone/tablet cases.

Update Playwright matrix and any intentionally-invalid old portrait expectations without weakening behavioral assertions.

## Acceptance criteria

- [ ] App-wide landscape configuration is implemented.
- [ ] No child route relies on a mixed portrait/responsive orientation policy.
- [ ] All native orientation API calls are centralized.
- [ ] One canonical landscape metrics API exists.
- [ ] 844×390 and 932×430 classify as phones.
- [ ] 1024×768 and 1280×800 classify as tablets.
- [ ] No new feature-local breakpoint logic is introduced.
- [ ] Phase 16 responsive bypass list is resolved or explicitly carried forward with justification.
- [ ] Landscape viewport matrix is active in Playwright.
- [ ] Typecheck, lint, unit tests, web export, and relevant Playwright coverage pass.
- [ ] Legacy behavior outside orientation/responsive infrastructure remains unchanged.
- [ ] `docs/migration/phase-17-report.md` exists.

## Validation

At minimum:

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx vitest run
npx expo-doctor
npx expo export --platform web
npx playwright test
```

Run applicable legacy regression from `docs/migration/validation.md`.

## Exit condition

The report ends with exactly one of:

`LANDSCAPE RUNTIME READY FOR PHASE 18`

or

`BLOCKED`

Then stop.
