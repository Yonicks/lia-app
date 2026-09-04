# Phase 25 Agent Prompt — Landscape Games Wave B

Implement **Phase 25 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/migration/prompts/_landscape-shared.md`
5. `docs/migration/phase-24-report.md`
6. `docs/migration/phases/phase-25-plan.md`
7. current Sounds/Count/Bubbles/Sort/Puzzle/Speech implementations/tests and shared game shell

Gate: Phase 24 must end with `GAMES WAVE A READY FOR PHASE 25`.

## Pre-flight

Before editing, identify:

- current logic and layout assumptions for each Wave B game;
- all drag/motion coordinate code;
- speech-recognition/native permission seams;
- shared Phase 24 game shell;
- required native/test evidence.

## Work

Migrate only:

- Sounds
- Count
- Bubbles
- Sort
- Puzzle
- Speech

Execute every requirement in `phase-25-plan.md`.

Hard rules:

- preserve game rules/scoring/progress/audio;
- use play-area-local coordinates for motion/drag/drop;
- do not fake native Speech coverage with web-only mocks;
- do not add local breakpoint hacks;
- do not redesign practice/parent/rewards.

## Validation

Run all plan validation and game-specific geometry/native tests. Capture compact-phone/reference-phone/tablet screenshots for every Wave B game. Explicitly record Speech native coverage status.

## Report

Write `docs/migration/phase-25-report.md` with a section per game, geometry evidence for Bubbles/Sort/Puzzle, density evidence for Count, audio evidence for Sounds, speech permission/recognition evidence, exact tests, screenshots, deviations/blockers, and Phase 26 risks.

End exactly with:

`GAMES WAVE B READY FOR PHASE 26`

or

`BLOCKED`

Then STOP.
