# Phase 17 Agent Prompt — Landscape Runtime and Responsive Foundation

Implement **Phase 17 only**.

## Required reading

Read in this order:

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/migration/README.md`
4. `docs/design/landscape/README.md`
5. `docs/migration/prompts/_landscape-shared.md`
6. `docs/migration/phase-16-audit.md`
7. `docs/migration/phase-16-report.md`
8. `docs/migration/phases/phase-17-plan.md`
9. Current responsive/orientation/test files identified by Phase 16

Gate: Phase 16 must end with `LANDSCAPE FOUNDATION READY FOR PHASE 17`. Otherwise write a BLOCKED Phase 17 report and stop.

## Pre-flight

Before editing, output a short pre-flight naming:

- current orientation/config implementation;
- current responsive helpers and bypasses;
- current viewport matrix;
- files to change;
- behavior that must not regress;
- test plan.

## Work

Execute every requirement in `phase-17-plan.md`.

Mandatory outcomes:

- app-wide landscape orientation contract;
- centralized orientation API usage;
- centralized landscape geometry based primarily on short edge;
- correct phone/tablet classification in landscape;
- safe-area-aware usable metrics;
- active landscape Playwright viewport matrix;
- unit tests for geometry and orientation behavior.

Do **not** redesign screens, remove bottom navigation, implement world-shell visuals, modify domain behavior, or touch cutover/Capacitor retirement.

Do not solve fit issues by adding screen-specific width checks.

## Validation

Run the exact validation required by the plan and applicable legacy regression. Do not skip or weaken failures.

## Report

Write `docs/migration/phase-17-report.md` with:

- summary;
- PASS/FAIL/BLOCKED per acceptance item;
- files changed;
- exact test commands/results;
- device-class examples including 844×390, 932×430, 1024×768, 1280×800;
- remaining responsive exceptions;
- native orientation coverage;
- risks for Phase 18;
- explicit status.

End with exactly:

`LANDSCAPE RUNTIME READY FOR PHASE 18`

or

`BLOCKED`

Then STOP. Do not start Phase 18.
