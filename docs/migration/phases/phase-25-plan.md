# Phase 25 Plan — Landscape Games Wave B

## Purpose

Migrate the remaining game experiences to the shared landscape game-detail system while preserving all game logic and high-risk native/gesture behavior.

Wave B covers:

1. Sounds
2. Count
3. Bubbles
4. Sort
5. Puzzle
6. Speech

## Dependency

Read `docs/migration/phase-24-report.md` first.

Phase 25 may begin only when Phase 24 ends with:

`GAMES WAVE A READY FOR PHASE 25`

Otherwise stop as BLOCKED.

## In scope

1. Reuse/evolve the shared landscape `GameShell` established in Phase 24.
2. Migrate Sounds, Count, Bubbles, Sort, Puzzle, and Speech to landscape.
3. Preserve reducers/session/scoring/content/audio/progress/reward behavior.
4. Correct portrait-coordinate/layout assumptions for drag/drop, moving objects, and recognition overlays.
5. Add native-aware coverage for microphone/speech recognition where feasible.
6. Add visual/behavioral evidence on compact phone, reference phone, and tablet.

## Out of scope

- Do not redesign practice activities; Phase 26.
- Do not redesign Rewards/Parent; Phase 27.
- Do not change game rules/content merely for fit.
- Do not fake native speech coverage with web-only evidence.
- Do not retire Capacitor.

## Game-specific requirements

### Sounds

- Preserve sound identification/playback behavior and choice logic.
- Keep audio controls/choices large and visually clear.
- Verify rapid answer/audio transitions do not overlap incorrectly.

### Count

- Preserve quantity generation, answer validation, scoring, and progression.
- Maintain readable object density without shrinking targets below child-safe size.
- Large counts must not overflow the play area.

### Bubbles

- Preserve spawn/motion/pop/scoring/session behavior.
- Recalculate bounds from the actual landscape play-area rectangle, not global portrait dimensions.
- No bubble may spawn outside safe/playable bounds.
- Touch hitboxes must track rendered positions.

### Sort

- Preserve bucket/category rules, item generation, drag/drop/tap semantics, correctness, and completion.
- Drop zones and item positions must use layout-local coordinates.
- Verify both phone and tablet coordinate transforms.

### Puzzle

- Preserve piece generation, drag/placement/snap/completion semantics.
- Use local layout coordinates and stable scaling so piece hitboxes match visuals.
- Test reset/reorientation/re-entry behavior.

### Speech

- Preserve microphone permission, recording/listening state, speech-recognition flow, prompts, success/failure/retry, progress, and fallback behavior.
- Native speech recognition must be verified on a real/supported native environment when available.
- Web mocks/tests are useful but do not count as native attestation.
- No microphone UI may be clipped by safe areas.

## Shared behavior preservation

For every Wave B game prove:

- same entry/reset semantics;
- same content/round generation;
- same correct/incorrect/scoring behavior;
- same progress/reward updates;
- same audio/TTS/recognition semantics;
- same done/back/navigation behavior.

## Responsive/gesture rules

- All moving/dragged coordinates are relative to measured play areas.
- Do not use hard-coded portrait screen dimensions.
- No new feature-local device-class breakpoints.
- Touch targets remain >=48×48 where an explicit control exists.
- Dynamic game objects must remain reachable within safe bounds.

## Tests

For every game:

- current unit/reducer/domain tests stay green;
- route from Games hub works;
- representative happy path completes;
- reset/restart/back works;
- compact phone/reference phone/tablet screenshots;
- game-specific geometry tests.

Additional required tests:

- Bubbles spawn/hit bounds;
- Sort drag/drop coordinate correctness;
- Puzzle piece hitbox/snap correctness;
- Count density/overflow cases;
- Sounds audio choice behavior;
- Speech permission/listening/retry states plus native evidence if available.

## Acceptance criteria

- [ ] Sounds is landscape-complete with behavioral parity.
- [ ] Count is landscape-complete with behavioral parity.
- [ ] Bubbles is landscape-complete and bound-safe.
- [ ] Sort is landscape-complete with correct drop geometry.
- [ ] Puzzle is landscape-complete with correct drag/snap geometry.
- [ ] Speech is landscape-complete and native coverage is explicitly reported.
- [ ] No game rules/content were changed merely for fit.
- [ ] No portrait-coordinate assumptions remain active in migrated games.
- [ ] Compact phone and tablet evidence passes.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-25-report.md` exists.

## Exit condition

End with exactly one of:

`GAMES WAVE B READY FOR PHASE 26`

or

`BLOCKED`

Then stop.
