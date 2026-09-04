# Phase 18 Plan — Landscape Design System and World Shell

## Purpose

Build the reusable visual foundation for the new landscape-only Talki experience before individual hubs are redesigned.

Phase 18 creates the shared shell, world/background treatment, top chrome, side navigation surfaces, card primitives, spacing/scale tokens, and responsive composition helpers needed by Phases 19–28.

It must not turn the three reference screenshots into baked production UI.

## Dependency

Read `docs/migration/phase-17-report.md` first.

Phase 18 may begin only when Phase 17 ends with:

`LANDSCAPE RUNTIME READY FOR PHASE 18`

Otherwise stop as BLOCKED.

## In scope

1. Create the landscape design-system namespace/components.
2. Create a world-shell abstraction with background, safe areas, top utility slots, title/logo slots, side-navigation slots, and content slot.
3. Create reusable child-facing activity/category card primitives.
4. Create shared layout helpers for 3×2 grids, category strips, hero/progress panels, title treatment, and page indicators.
5. Define responsive size tokens driven only by the Phase 17 metrics layer.
6. Define background crop/focal-point behavior for phone/tablet.
7. Add visual/unit test fixtures proving the shell can represent the Home, Games, and Practice reference compositions without shipping those fixtures as product screens.
8. Update asset manifest with concrete production-art requirements discovered during implementation.

## Out of scope

- Do not redesign Home/Games/Practice production screens yet.
- Do not remove/replace the current routing model yet; Phase 19 owns navigation architecture.
- Do not create new game/practice business behavior.
- Do not generate arbitrary replacement artwork.
- Do not use `home.png`, `games.png`, or `practice.png` as runtime backgrounds.
- Do not retire Capacitor.

## Required component family

Exact names may follow repository conventions, but provide reusable equivalents for:

```text
LandscapeScreen
LandscapeWorldShell
LandscapeTopBar
LandscapeSideNav
LandscapeActivityCard
LandscapeActivityGrid
LandscapeCategoryCard
LandscapeCategoryStrip
LandscapeHeroPanel
LandscapeProgress
LandscapeTitle
LandscapePageIndicator
landscape visual tokens / background registry
```

Reuse existing design-system primitives where they are still appropriate instead of duplicating them.

## Shell contract

The shell must own:

- world/background layer;
- safe-area padding;
- stable top utility region;
- optional logo/title placements;
- optional left/right side-nav regions;
- main content bounds;
- optional bottom/edge auxiliary region;
- overflow policy.

The shell must support different placements shown by Home, Games, and Practice without hard-coding one screen's coordinates.

## Background rules

- Background artwork uses cover/crop, never stretching.
- Support a focal point or alignment strategy so important world elements survive aspect-ratio changes.
- Phone and tablet may use different verified crops from the same production art family.
- Reference screenshots are visual truth, not production images.
- Missing production background/character art is recorded as `DESIGN-BLOCKED` or `NEEDED` in the asset manifest.

## Responsive behavior

Use Phase 17 centralized metrics only.

Compact phones should reduce gaps, padding, title size, and card dimensions before removing content.

Tablets should gain spacing/gutters/max card sizes rather than uniformly scaling the phone UI to giant proportions.

The common 3×2 hub grid must remain visually balanced across phone/tablet classes.

## RTL and accessibility

- Use logical start/end semantics.
- Hebrew text must render RTL correctly.
- Child touch targets remain at least 48×48 effective points.
- Cards/buttons must expose accessible labels/roles.
- Reduce-motion hooks/tokens should be supported where animation primitives are introduced, even if full global polish is Phase 28.

## Visual verification fixture

Create non-production test/demo fixtures that render representative:

- Home composition frame;
- Games 3×2 frame;
- Practice 3×2 frame.

They may use labeled neutral test blocks or verified existing assets, but must not invent production artwork.

Capture them across at least compact phone, reference phone, 4:3 tablet, and 16:10 tablet to validate shell geometry.

## Acceptance criteria

- [ ] Shared landscape shell exists and consumes only centralized Phase 17 metrics.
- [ ] Shell supports Home/Games/Practice composition variants without duplicated shells.
- [ ] Reusable activity/category/grid/hero/progress/title/page-indicator primitives exist where needed.
- [ ] No reference screenshot is embedded as production UI.
- [ ] Background behavior never stretches raster art.
- [ ] Phone/tablet spacing strategy is tokenized and centralized.
- [ ] RTL/logical positioning is verified.
- [ ] Child interactive primitives meet 48×48 minimum effective target.
- [ ] Test fixtures render correctly at required representative landscape viewports.
- [ ] Asset manifest is updated with missing/verified production art.
- [ ] Existing product behavior is not redesigned in this phase.
- [ ] `docs/migration/phase-18-report.md` exists.

## Validation

Run:

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx vitest run
npx expo-doctor
npx expo export --platform web
npx playwright test
```

Also capture the phase visual fixtures/screenshots required by the repository validation rules.

## Exit condition

End with exactly one of:

`LANDSCAPE SHELL READY FOR PHASE 19`

or

`BLOCKED`

Then stop.
