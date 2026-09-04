# Phase 27 Agent Prompt — Landscape Rewards and Parent Center

Implement **Phase 27 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/migration/prompts/_landscape-shared.md`
5. `docs/migration/phase-26-report.md`
6. `docs/migration/phases/phase-27-plan.md`
7. current rewards, parent gate, Parent Center, custom words, recording, image-picker, backup, settings, and report code/tests

Gate: Phase 26 must end with `CHILD FEATURE COMPLETION GATE PASSED`.

## Pre-flight

Before editing, derive from current source:

- exact Rewards surfaces/state;
- exact Parent Center tabs/features;
- parent-gate contract;
- custom-word CRUD/data flow into child vocabulary;
- native recording/image/backup seams;
- keyboard-sensitive screens;
- test/native evidence plan.

## Work

Execute `phase-27-plan.md`.

Migrate Rewards, Parent Gate, and every current Parent Center feature to landscape while preserving behavior/data formats.

Hard rules:

- do not drop parent features because they are absent from child mocks;
- do not fake native recording/image/backup evidence with web mocks;
- do not change data schemas/reward economics/gate rules for visual convenience;
- adult forms may scroll when necessary, but must remain usable with landscape keyboard;
- do not start Phase 28 global polish.

## Validation

Run all plan validation, representative native flows where available, and landscape keyboard checks. Capture compact-phone/tablet screenshots for Rewards, gate, and every Parent Center tab.

## Report

Write `docs/migration/phase-27-report.md` with feature inventory, PASS/FAIL/BLOCKED table, custom-word end-to-end evidence, native permissions/recording/image/backup status, keyboard results, screenshots, tests, deviations/blockers, and Phase 28 risks.

End exactly with:

`REWARDS AND PARENT READY FOR PHASE 28`

or

`BLOCKED`

Then STOP.
