# Phase 24 Agent Prompt — Landscape Games Wave A

Implement **Phase 24 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/migration/prompts/_landscape-shared.md`
5. `docs/migration/phase-23-report.md`
6. `docs/migration/phases/phase-24-plan.md`
7. current `GameShell`, game registry, and Quiz/Memory/Missing/Match/Cards implementations/tests

Gate: Phase 23 must end with `CATEGORIES READY FOR PHASE 24`.

## Pre-flight

Before editing, summarize:

- current shared game shell/chrome;
- reducer/session seams for the five Wave A games;
- portrait/layout assumptions;
- verified art/assets;
- planned shared landscape shell changes;
- per-game test strategy.

## Work

Execute `phase-24-plan.md`.

Migrate only:

- Quiz
- Memory
- Missing
- Match
- Cards

Preserve each game's existing rules, scoring, progress, audio/TTS, completion, reset, and routing behavior.

Hard rules:

- do not rewrite business logic merely for layout convenience;
- do not touch Wave B screens except shared shell changes required by architecture;
- no local breakpoint hacks;
- no invented art;
- use one landscape game shell where practical.

## Validation

Run all plan validation plus representative completion paths for every Wave A game. Capture compact-phone/reference-phone/tablet screenshots for each.

## Report

Write `docs/migration/phase-24-report.md` with a section per game covering behavioral parity, screenshots, tests, deviations, asset blockers, and Phase 25 risks.

End exactly with:

`GAMES WAVE A READY FOR PHASE 25`

or

`BLOCKED`

Then STOP.
