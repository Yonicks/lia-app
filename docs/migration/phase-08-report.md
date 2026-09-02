# Phase 8 report — Game platform and first full game (quiz)

## Summary

`apps/mobile/src/features/games/shell/` is the shared game frame: category
resolution (`resolveStartCategory` / `startGame` 2491-2495), landscape lock
through `OrientationService`, `game.levelStart` / `game.levelComplete`, the
rapid-tap session lock, chips, and the shared `DoneCard` star tiers. Quiz
is the first registered game (`gameRegistry.quiz`); every other id still
routes to the Phase 7 stub. Round state lives in `quizReducer` — nothing
transient entered Zustand. 50 viewport screenshots are committed. Native
device captures are not possible in this sandbox. 5384 vitest tests and
630 Playwright tests are green (confirmed on a clean rerun after seeding).

## Acceptance criteria

- [PASS] GameShell and useGameSession exist and quiz uses them —
  `QuizScreen` → `useGameSession` + `GameShell`; the board is the only
  quiz-owned surface.
- [PASS] Per-game state is local; nothing transient entered the global
  store — `quizReducer` / `useReducer` in `QuizPlay`. Zustand gained
  `stats` + `recordSeen` only (durable `lia:stats`, same as `learned`).
- [PASS] MIN_ITEMS gate and category fallback behave exactly as legacy,
  for every game id — `game-session.test.ts` walks `GAME_IDS` and
  `PRACTICE_LIST`.
- [PASS] startGame does NOT write lia:lastcat, asserted by test — unit
  (pure function) and `quiz.spec.ts` (seed `food`, launch animals, key
  unchanged).
- [PASS] The toast fires when no category qualifies —
  `START_GAME_TOAST` (`צריך לפחות 4 מילים בקטגוריה`) from
  `resolveStartCategory`; `GameShell` shows it via `ToastHost`.
- [PASS] game.levelStart on start, game.levelComplete on completion —
  `useGameAudio` / session epoch effect / `QuizPlay` done effect.
- [PASS] Quiz pool is min(8, items.length) via weightedPick —
  `initQuiz` + `quiz-reducer.test.ts`.
- [PASS] Exactly four options, one target and three same-category
  distractors — `setupQuizRound` + unit tests.
- [PASS] Options shuffled, proven across seeded runs — 40 seeds, more
  than one correct-slot.
- [PASS] The prompt speaks exactly once per round, proven by speechSpy —
  `quiz.spec.ts` (one call on entry; replay adds a second).
- [PASS] The replay button re-speaks the target — same test.
- [PASS] locked prevents double-scoring, proven by burst —
  session `tryLock` + reducer `locked`; `burst(quiz-option-0, 10)` scores
  once.
- [PASS] Correct increments score and streak; wrong resets streak —
  `quiz-reducer.test.ts`.
- [PASS] markSeen called correctly for both correct and wrong —
  `recordSeen(..., !ok)` on every answer.
- [PASS] celebrate() fires on the 10th learned word — `markLearned`
  return value + `STAR_STEP`; `RewardOverlay` with `"N מילים!"`.
- [PASS] Done card star tiers correct at every boundary —
  `done-card.test.ts`: 100/85 → 3, 84/50 → 2, 49/0 → 1.
- [PASS] Landscape via OrientationService; no lockAsync in game code —
  `useGameSession` calls `orientationService.applyFor('games')` /
  `unlock()`. `grep lockAsync` under `features/games` is empty.
- [FAIL] Landscape lock releases on exit, verified on device — web
  unlock is called on unmount; no real device in this sandbox.
- [PASS] Option grid fits at 1280x800 and 320x568, proven by screenshot
  — `quiz-board` capture + `toHaveScreenshot`; overflow assertion on
  `quiz-root`.
- [PASS] A full playthrough reaches the done card in Tier 2 — 8 correct
  taps → 3-star card.
- [PASS] Fully playable under degradeNativeApis — score still advances.
- [PASS] Touch-target and reachability audits clean — `quiz.spec.ts`.
- [PASS] No listener growth across ten rounds — plateau across two
  batches of replay clicks.
- [PASS] tsc --noEmit, eslint, expo-doctor clean — Gate results §1.
- [PASS] vitest run green; expo export --platform web succeeds;
  playwright green — Gate results §2–4.
- [FAIL] 50 screenshots plus two device captures committed — 50 files
  under `docs/migration/screenshots/phase-08/`. Device captures absent.
- [PASS] Only quiz was built — `gameRegistry` has a single entry;
  memory/missing/… still `StubScreen`.
- [PASS] All three legacy suites still green — Gate results §6.

## Gate results

### 1. Static checks

```
$ npx tsc --noEmit
(no output, exit 0)

$ npx eslint .
(no output, exit 0)

$ npx expo-doctor
Running 21 checks on your project...
21/21 checks passed. No issues detected!
```

### 2. Tier 1 vitest

```
$ npx vitest run
 Test Files  22 passed (22)
      Tests  5384 passed (5384)
```

### 3. Web export

```
$ npx expo export --platform web
Exported: dist
```

### 4. Tier 2 playwright

```
$ npx playwright test
  630 passed (1.1m)
```

Quiz screenshots are deterministic via `?seed=42` (and
`window.__talkiQuizSeed`). A first unseeded run compared two random
boards and failed 10 `toHaveScreenshot` assertions; after the seed and a
fresh `expo export`, a clean rerun stayed at 630.

### 5. Screenshots

PASS for the web matrix. 50 files
(`quiz-board`, `quiz-correct`, `quiz-wrong`, `quiz-done-3star`,
`quiz-done-1star` × 10 viewports). 1-star done is forced via a
test-only `__talkiQuizForceDone` hook because a real quiz playthrough
cannot finish below 100% (every advance requires a correct answer).
No device capture.

### 6. Legacy regression

```
$ BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
ALL CHECKS PASSED

$ BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
ALL INTERACTION CHECKS PASSED

$ node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

### 7. This report

PASS.

## Native coverage

Device: not applicable — same sandbox constraint as phases 1–7 (no
Android SDK, adb, emulator, or physical device).

Checks performed: none on hardware. `.maestro/quiz.yaml` is written.

Checks NOT possible: landscape lock engage/release, rotation mid-round,
audible prompt, backgrounding, toddler tap on a real touch panel.

## Files created

- `apps/mobile/src/domain/games/startGame.ts` — `resolveStartCategory`
- `apps/mobile/src/domain/games/shuffle.ts` — injected-rng shuffle
- `apps/mobile/src/domain/games/doneStars.ts` — shared star tiers
- `apps/mobile/src/features/games/shell/{types,gameRegistry,GameShell,GameChips,DoneCard,useGameSession,useGameAudio}.ts(x)`
- `apps/mobile/src/features/games/quiz/{quizReducer,setupQuizRound,quizChips,QuizOption,QuizScreen}.ts(x)`
- `apps/mobile/tests/unit/{game-session,quiz-reducer,done-card}.test.ts`
- `apps/mobile/tests/e2e/quiz.spec.ts`
- `apps/mobile/.maestro/quiz.yaml`
- `docs/migration/screenshots/phase-08/` — 50 files

## Files modified

- `apps/mobile/app/game/[id].tsx` — quiz from the registry; others stub
- `apps/mobile/src/state/progressStore.ts` — `stats` + `recordSeen`;
  `markLearned` returns `{ added, size }` for celebrate
- `apps/mobile/src/components/shell/GameHeader.tsx` — `titleTestID`
- `apps/mobile/src/testing/testIds.ts` — `game` / `quiz` ids
- `apps/mobile/tests/e2e/navigation.spec.ts` — games-menu quiz card now
  opens the real shell

## Dependencies added

none

## Deviations from the phase plan

- **Session lock is on every answer**, including wrong (legacy only
  locks on correct). The phase prompt says the lock belongs in the
  session hook and stops a second tap while feedback plays. Wrong
  unlocks after 420ms (legacy's wrong-class timeout).
- **`asked` is a ref keyed to the round index**, not a reducer flag
  flipped in an effect, so React Strict Mode cannot double-speak.
- **1-star done screenshot is forced** (`__talkiQuizForceDone`) because
  quiz cannot complete with a failing score.
- **`__talkiPlaceCorrectAt = 0`** is a test-only hook so
  `burst(quiz-option-0)` is deterministic after every ADVANCE.
- **`?seed=42` / `__talkiQuizSeed`** injects `mulberry32` so Playwright
  screenshots do not compare two random boards. Production still uses
  `Math.random`. The generator is created fresh per `init`/`ADVANCE` so
  a remount cannot consume leftover PRNG state.

## Findings and drift

- Legacy quiz cannot finish with a score below 100%: `nextQuiz` only
  runs after a correct answer. The 1-star done card is still a real
  `DoneCard` with `doneCardStars(0, 8) === 1`.
- `markSeen` in `domain/progress/selection.ts` mutates the stats object
  it is given. The store clones before calling it.
- `GameHeader` already existed in Phase 5; this phase adds `titleTestID`
  rather than a second header.

## Risks carried into the next phase

- Landscape lock is unattested on a device. Phase 9's games inherit the
  same `applyFor('games')` call.
- Puzzle (drag), bubbles (timers) and sounds (forced animals category)
  will need shell extensions — see GO / NO-GO.
- `__talkiPlaceCorrectAt` must not ship as a player-facing cheat; it
  reads `window` only.

## ARCHITECTURE GO / NO-GO

**GO**, with named extensions rather than a fork:

- **Puzzle (drag and drop)** will need a pointer/gesture slot the shell
  does not own today. Add a `Board` that can capture pan handlers;
  do not put drag state in Zustand. SFX already has
  `interaction.dragPickup` / `dragDrop`.
- **Bubbles (spawning timers)** needs a clock injected the same way
  `rnd` is injected (`now: () => number` + an interval the Board owns).
  Do not put the spawn loop in the session hook.
- **Sounds (forces its own category)** already fits
  `resolveStartCategory`: a game `init` can ignore the resolved
  category and pin `CATEGORIES.animals`, matching index.html 2521-2523.
  Document that as a per-game override, not a shell change.
- **Practice modes** share `MIN_ITEMS` and the same start gate; they
  should reuse `useGameSession` + `DoneCard` rather than invent a second
  frame.

The split (shell owns frame/lock/audio/done; game owns reducer + board)
held for quiz and is the cheapest pattern for the next ten screens.

## Commands to reproduce

```bash
cd apps/mobile
npx tsc --noEmit && npx eslint . && npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test

# from repository root
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```
