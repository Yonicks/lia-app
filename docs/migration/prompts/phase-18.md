# Phase 18 Agent Prompt — Landscape Design System and World Shell

Implement **Phase 18 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/design/landscape/asset-manifest.md`
5. all committed landscape reference images
6. `docs/migration/prompts/_landscape-shared.md`
7. `docs/migration/phase-17-report.md`
8. `docs/migration/phases/phase-18-plan.md`
9. current design-system/responsive files

Gate: Phase 17 must end with `LANDSCAPE RUNTIME READY FOR PHASE 18`.

## Pre-flight

Before editing, identify:

- reusable existing design-system primitives;
- the finalized Phase 17 metrics API;
- current top bar/navigation/card components;
- verified production assets and missing art;
- proposed shared landscape component tree;
- visual test strategy.

## Work

Execute `phase-18-plan.md` exactly.

Build reusable landscape visual primitives and the world shell. Prove the shell can represent Home, Games, and Practice compositions in test fixtures, but do **not** redesign those product screens yet.

Hard rules:

- never render the reference screenshots as product UI;
- never stretch raster art;
- never invent production artwork to unblock the phase;
- no local breakpoints outside the centralized metrics layer;
- one shell architecture for phones and tablets;
- preserve RTL and >=48×48 child targets.

Update `docs/design/landscape/asset-manifest.md` when implementation exposes real asset gaps.

## Validation

Run all plan validation, Playwright, and representative landscape fixture screenshots. Record exact results.

## Report

Write `docs/migration/phase-18-report.md` with:

- acceptance PASS/FAIL/BLOCKED;
- component/files added;
- shell API summary;
- phone/tablet visual evidence;
- asset blockers;
- exact tests/results;
- deviations;
- risks for Phase 19;
- explicit status.

End exactly with:

`LANDSCAPE SHELL READY FOR PHASE 19`

or

`BLOCKED`

Then STOP.
