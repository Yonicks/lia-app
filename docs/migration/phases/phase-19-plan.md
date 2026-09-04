# Phase 19 Plan — Landscape Navigation Architecture

## Purpose

Replace the historical persistent child bottom-tab navigation with the approved landscape navigation model while preserving route reachability, deep links, guarded parent access, back behavior, and feature state.

Phase 19 completes the landscape foundation gate. It changes navigation architecture, not the final visual design of Home/Games/Practice hubs.

## Dependency

Read `docs/migration/phase-18-report.md` first.

Phase 19 may begin only when Phase 18 ends with:

`LANDSCAPE SHELL READY FOR PHASE 19`

Otherwise stop as BLOCKED.

## Locked navigation direction

The redesigned child app has:

- no persistent bottom navigation;
- shared landscape top utility chrome;
- contextual left/right side navigation for Home/Games/Practice switching;
- direct routes for detail screens;
- one parent/profile entry;
- reward/star entry from shared chrome where appropriate.

Exact route filenames may adapt to Expo Router constraints, but behavior must follow this contract.

## In scope

1. Remove the child `BottomNavigation` from the new Expo experience.
2. Remove/replace persistent Tabs architecture where it causes hidden mounted screens or duplicate global controls.
3. Establish explicit top-level routes for Home, Games, Practice, Rewards, Category, Game, Practice detail, and Parent surfaces.
4. Integrate the Phase 18 shell/top/side navigation at the architecture level.
5. Define top-level navigation semantics (`replace`/reset where appropriate) so switching hubs does not create an ever-growing back stack.
6. Preserve push semantics for detail screens.
7. Preserve/de-risk hardware back behavior.
8. Preserve game deep links and intro/deep-link handoff behavior.
9. Ensure only one global parent/profile entry and one shared top chrome are mounted.
10. Add navigation regression tests.

## Out of scope

- Do not perform final Home/Games/Practice visual redesign; Phases 20–22 own that.
- Do not redesign Category, game detail, practice activities, Rewards, or Parent surfaces.
- Do not alter domain/business behavior.
- Do not retire Capacitor.

## Target route behavior

Prefer a stack-oriented top-level architecture equivalent to:

```text
/home
/games
/practice
/rewards
/category/:id
/game/:id
/practice/:id
/parent
```

Use repository-appropriate Expo Router paths rather than forcing literal names if migration would break current contracts.

### Hub switching

- Home ↔ Games ↔ Practice uses replace/reset-like semantics.
- Repeated hub switching must not leave dozens of history entries.
- Side navigation visually indicates/omits the current destination as defined by the design contract.

### Detail navigation

- Hub → game/category/practice detail uses push semantics.
- Back returns to the logical originating hub/detail parent.
- Completion/done flows preserve current behavior unless a navigation defect requires an explicit fix.

### Parent/rewards

- Parent access remains guarded by the existing parent gate contract.
- Rewards remain reachable from the star/reward control or explicit route.
- No duplicate parent gate or hidden tab screen may remain mounted behind the active route.

### Deep links

Preserve current supported deep links, especially game deep-link handling after intro. If route paths change, provide compatibility mapping and tests.

## Transitional visual requirement

The production Home/Games/Practice surfaces may still contain old inner content during this phase, but must live within the new landscape route/chrome architecture without the old bottom navigation.

Do not pretend Phase 20–22 visual work is complete.

## Tests

Cover at minimum:

- app launch → Home;
- Home → Games → Practice → Home without stack explosion;
- Home/Games → detail → back;
- parent gate entry exactly once;
- rewards entry;
- hardware back from hub/detail/parent;
- supported deep-link entry;
- intro → deep-link destination;
- no duplicate global controls from mounted hidden tabs.

## Acceptance criteria

- [ ] Child bottom navigation is removed from the new landscape Expo experience.
- [ ] Persistent tab architecture no longer causes hidden mounted child hubs/global controls.
- [ ] Home/Games/Practice top-level switching uses stable replace/reset semantics.
- [ ] Category/game/practice detail routes remain reachable.
- [ ] Parent gate and Parent Center remain reachable exactly once.
- [ ] Rewards remain reachable.
- [ ] Deep links remain compatible.
- [ ] Hardware back behavior is explicit and tested.
- [ ] Shared Phase 18 top/side chrome is integrated without final hub redesign.
- [ ] No domain/persistence/audio/progress behavior is changed.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-19-report.md` exists.

## Foundation gate

The report must explicitly prove all four foundation-gate conditions:

1. centralized landscape geometry;
2. app-wide landscape orientation;
3. no child bottom navigation;
4. stable top/side navigation architecture across phone/tablet.

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

Also run relevant deep-link/back/native navigation tests and applicable legacy regression.

## Exit condition

End with exactly one of:

`LANDSCAPE FOUNDATION GATE PASSED`

or

`BLOCKED`

Then stop.
