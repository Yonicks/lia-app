# Phase 19 Agent Prompt — Landscape Navigation Architecture

Implement **Phase 19 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/design/landscape/interaction-map.md`
5. `docs/migration/prompts/_landscape-shared.md`
6. `docs/migration/phase-18-report.md`
7. `docs/migration/phases/phase-19-plan.md`
8. current Expo Router layouts, BottomNavigation, top chrome, deep-link, parent gate, and back tests

Gate: Phase 18 must end with `LANDSCAPE SHELL READY FOR PHASE 19`.

## Pre-flight

Before editing, report:

- current route graph;
- tab/persistent-mount behavior;
- deep-link contracts;
- parent/rewards entry points;
- proposed route migration;
- tests that prove no regression.

## Work

Execute `phase-19-plan.md`.

Mandatory outcomes:

- no child bottom navigation;
- no hidden persistent hub mounting that duplicates global controls;
- stable top-level Home/Games/Practice switching;
- detail push/back semantics preserved;
- parent/rewards/deep-link behavior preserved;
- shared landscape top/side chrome connected to the route architecture.

Do not redesign the inner Home/Games/Practice content yet. Do not start Phase 20.

## Validation

Run all plan validation plus navigation/deep-link/back coverage on the landscape matrix. Never weaken old behavioral tests solely to get green; update only expectations intentionally invalidated by the approved navigation architecture.

## Report

Write `docs/migration/phase-19-report.md` and explicitly grade the Foundation Gate.

Include route graph before/after, files changed, exact test results, deep-link/back evidence, phone/tablet results, deviations, and risks for Phase 20.

End exactly with:

`LANDSCAPE FOUNDATION GATE PASSED`

or

`BLOCKED`

Then STOP.
