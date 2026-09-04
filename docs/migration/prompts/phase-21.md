# Phase 21 Agent Prompt — Landscape Games Hub

Implement **Phase 21 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/design/landscape/reference/games.png`
5. `docs/design/landscape/asset-manifest.md`
6. `docs/migration/prompts/_landscape-shared.md`
7. `docs/migration/phase-20-report.md`
8. `docs/migration/phases/phase-21-plan.md`
9. current games registry/menu/navigation code

Gate: Phase 20 must end with `HOME HUB READY FOR PHASE 21`.

## Pre-flight

Before editing, report:

- current registered game count/order;
- current Games menu implementation;
- verified game art paths;
- Phase 18 grid/card primitives;
- paging approach;
- test plan proving every game remains reachable.

## Work

Redesign **Games hub only** according to `games.png` and `phase-21-plan.md`.

Use a 3×2 page with page size 6 and derive pages from the live registry. Preserve every registered game and correct routing.

Hard rules:

- no game deletion;
- no screenshot cropping into cards;
- no long vertical game menu;
- no invented production art;
- no individual game redesign;
- one phone/tablet implementation using centralized metrics.

## Validation

Run all plan validation. Capture screenshots for each hub page across the active landscape viewport matrix. Prove registry count equals reachable card count.

## Report

Write `docs/migration/phase-21-report.md` with:

- exact current game count;
- page composition/order;
- reachability evidence for every game;
- PASS/FAIL/BLOCKED acceptance table;
- screenshots;
- exact tests/results;
- asset blockers/deviations;
- risks for Phase 22.

End exactly with:

`GAMES HUB READY FOR PHASE 22`

or

`BLOCKED`

Then STOP.
