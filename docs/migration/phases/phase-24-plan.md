# Phase 24 Plan — Landscape Games Wave A

## Purpose

Migrate the first five game experiences to the new landscape system while preserving each game's current reducer/session/scoring/audio/progress behavior.

Wave A covers:

1. Quiz
2. Memory
3. Missing
4. Match
5. Cards

This phase should establish the reusable landscape game-detail shell used again in Phase 25.

## Dependency

Read `docs/migration/phase-23-report.md` first.

Phase 24 may begin only when Phase 23 ends with:

`CATEGORIES READY FOR PHASE 24`

Otherwise stop as BLOCKED.

## In scope

1. Audit and, where appropriate, refactor the shared `GameShell`/game-detail chrome into the landscape design system.
2. Migrate Quiz, Memory, Missing, Match, and Cards screens to landscape composition.
3. Preserve all current game logic, scoring, completion, attempts, progression, audio/TTS, rewards, persistence, and routing.
4. Preserve category/game content selection behavior.
5. Ensure each game fits compact landscape phones and tablets without portrait fallback.
6. Add per-game visual and behavioral tests across representative landscape viewports.
7. Remove obsolete portrait-only layout branches for these games after parity is proven.

## Out of scope

- Do not migrate Sounds, Count, Bubbles, Sort, Puzzle, or Speech; Phase 25.
- Do not migrate practice activities; Phase 26.
- Do not change game rules/content to improve visual fit.
- Do not retire Capacitor.

## Shared landscape game shell

Prefer one reusable game shell with slots for:

- compact top/game title region;
- back/home/hub navigation consistent with Phase 19;
- progress/round/status indicators;
- main play area;
- answer/action region;
- feedback/toast/reward overlay host;
- done/completion state.

The shell must consume centralized landscape metrics and support compact phone/tablet classes without game-local breakpoint duplication.

## Visual direction

There is no dedicated reference screenshot for each game. Use:

- the approved Home/Games/Practice visual language;
- existing verified game artwork;
- existing domain behavior;
- the Phase 18 design primitives.

Do not invent a new unrelated aesthetic.

## Game-specific requirements

### Quiz

- Preserve prompt/question semantics and answer options.
- Keep target image/content prominent.
- Preserve correct/incorrect feedback timing and score/progress.
- Answer choices remain large enough for toddlers.

### Memory

- Preserve card-pair generation, reveal/match rules, turn timing, completion, and restart behavior.
- Ensure card grid remains legible in short landscape height.
- No card overlap or tiny targets on compact phones.

### Missing

- Preserve sequence/item disappearance logic, prompt timing, answer choices, and feedback.
- Main scene/items remain visually distinguishable.

### Match

- Preserve pair/matching logic and completion behavior.
- If drag/tap matching exists, hit targets and coordinate handling must use layout-local coordinates rather than portrait assumptions.

### Cards

- Preserve card browsing/learning behavior, audio/TTS, progression, and completion.
- Landscape composition should keep image and label/actions balanced without excessive unused width.

## Behavior preservation

For each game compare current source/tests and prove:

- same start/reset semantics;
- same round/content selection;
- same correct/incorrect behavior;
- same score/progress/reward updates;
- same audio/TTS cues;
- same done state and navigation.

Visual redesign is not permission to simplify rules.

## Tests

For every Wave A game:

- unit/reducer/domain tests remain green;
- route entry from Games hub works;
- representative happy path completes;
- wrong/correct paths where applicable;
- reset/restart/back behavior;
- no clipping at 667×375 and 844×390;
- tablet visual evidence at 1024×768 or 1280×800;
- RTL/touch target checks;
- no portrait-only branch remains active.

Capture phase screenshots for each game on at least compact phone, reference phone, and tablet.

## Acceptance criteria

- [ ] Shared landscape game-detail shell is implemented/reused where appropriate.
- [ ] Quiz is landscape-complete with behavioral parity.
- [ ] Memory is landscape-complete with behavioral parity.
- [ ] Missing is landscape-complete with behavioral parity.
- [ ] Match is landscape-complete with behavioral parity.
- [ ] Cards is landscape-complete with behavioral parity.
- [ ] No Wave B game is unintentionally redesigned.
- [ ] No game rules/content were changed merely for fit.
- [ ] Compact phone and tablet screenshots pass review.
- [ ] Full relevant regression passes.
- [ ] `docs/migration/phase-24-report.md` exists.

## Exit condition

End with exactly one of:

`GAMES WAVE A READY FOR PHASE 25`

or

`BLOCKED`

Then stop.
