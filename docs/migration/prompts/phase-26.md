# Phase 26 Agent Prompt — Landscape Practice Activities

Implement **Phase 26 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/migration/prompts/_landscape-shared.md`
5. `docs/migration/phase-25-report.md`
6. `docs/migration/phases/phase-26-plan.md`
7. current practice registry, reducers, screens, audio/TTS and tests

Gate: Phase 25 must end with `GAMES WAVE B READY FOR PHASE 26`.

## Pre-flight

Before editing, derive from current source:

- exact practice mode count and mapping;
- per-mode interaction contract;
- shared session/reducer/audio seams;
- portrait/layout assumptions;
- proposed shared landscape practice shell;
- per-mode test plan.

## Work

Execute `phase-26-plan.md` and migrate **all current practice activity screens**.

Preserve current methodology/session/content/timing/audio/progress/completion behavior. Current code/tests win over shorthand mode descriptions.

Hard rules:

- no practice mode deletion;
- no behavior simplification for layout;
- no local breakpoints;
- no long default active-practice vertical scroll;
- no Parent/Rewards/global polish work yet.

## Validation

Run all plan validation. Exercise every practice mode and capture compact-phone/reference-phone/tablet evidence.

## Report

Write `docs/migration/phase-26-report.md` with a section per mode, complete hub→detail reachability matrix, tests/screenshots, behavior parity, deviations/blockers, and explicit Child Feature Completion Gate evidence.

End exactly with:

`CHILD FEATURE COMPLETION GATE PASSED`

or

`BLOCKED`

Then STOP.
