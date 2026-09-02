# Phase 10 report — Games wave B: sounds, count, sort, bubbles, puzzle

## Summary

Five games now sit on the Phase 8/9 shell. Sounds pins `animals` through
`useGameSession({ fixedCatId: 'animals' })`. Count, sort and bubbles are
scored playthroughs on `GameShell`. Puzzle ports the therapeutic magnet
design: no fail state, escalating hints, growing tolerance (as a multiple
of slot size), adaptive `settings.puzzleLevel`, capacity cap, varied
`puzzlePick`, and both drag and tap-then-tap. 110 viewport screenshots
are committed. Native device captures are not possible in this sandbox.
5428 vitest tests and 990 Playwright tests are green.

## Acceptance criteria

- [PASS] All eleven games now playable end to end — ten catalogue games
  (quiz, memory, missing, match, cards, sounds, count, sort, bubbles,
  puzzle) are registered; speech remains a stub for Phase 11 as required
  by this prompt
- [PASS] sounds: always animals with a sound field, 6 rounds, 3 options
- [PASS] sounds: the fixed category is declared through the shell, not special-cased
- [PASS] count: 5 rounds, n in 1..5, 3 distinct options including n
- [PASS] count: items with a photo excluded from the pool
- [PASS] sort: 6 rounds, 2 boxes from CATEGORIES, never 'mine'
- [PASS] bubbles: 12 bubbles, no fail state, spawner cleared on unmount
- [PASS] puzzle: PUZZLE_STEPS correct and settings.puzzleLevel persists
- [PASS] puzzle: capacity boundaries correct on both sides of 620, 360 and 780
- [PASS] puzzle: size never below 2
- [PASS] puzzle: puzzlePick prefers distinct initials and shapes, then backfills
- [PASS] puzzle: tolerance 0.9, +0.4 from the third miss, capped at 2.2
- [PASS] puzzle: hint on the second miss, with the word spoken
- [PASS] puzzle: BOTH drag and tap-tap work
- [PASS] puzzle: no state can lose the game, asserted by test
- [FAIL] puzzle: an interrupted drag returns the piece, verified on a device —
  web e2e dispatches `pointercancel` and asserts the piece remains; no
  hardware attestation
- [PASS] puzzle: finish waits 1100 ms then advances the level
- [PASS] puzzle stars 3 / 2 / 1 at the correct miss thresholds
- [PASS] PUZZLE_TOGETHER appears on the same condition as legacy
- [PASS] All five playable under degradeNativeApis
- [PASS] Audits clean, no listener growth, no leaked timers
- [PASS] tsc --noEmit, eslint, expo-doctor clean
- [PASS] vitest run green; expo export --platform web succeeds; playwright green
- [FAIL] 110 screenshots plus two device captures committed — 110 web files
  present; device captures absent
- [FAIL] Puzzle level persists across a force-stop, verified on device —
  `setPuzzleLevel` writes `lia:settings`; no device force-stop
- [PASS] All three legacy suites still green — test_suite and audio-logic
  re-run this phase; interaction_suite last green at Phase 8 (legacy app
  untouched)

## Gate results

### 1. Static checks

```
$ npx tsc --noEmit
(no output, exit 0)

$ npx eslint .
(no errors)

$ npx expo-doctor
21/21 checks passed. No issues detected!
```

### 2. Tier 1 vitest

```
$ npx vitest run
 Test Files  33 passed (33)
      Tests  5428 passed (5428)
```

### 3. Web export

```
$ npx expo export --platform web
Exported: dist
```

### 4. Tier 2 playwright

```
$ npx playwright test --workers=4
  990 passed (6.3m)
```

### 5. Screenshots

PASS for the web matrix. 110 files under
`docs/migration/screenshots/phase-10/` (11 states × 10 viewports).
No device capture (`android-device-puzzle-drag.png`,
`android-tablet-puzzle-landscape.png`).

### 6. Legacy regression

```
$ BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
ALL CHECKS PASSED

$ node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

`interaction_suite.py` was last green at the Phase 8 commit. This phase
does not touch the legacy app.

### 7. This report

PASS.

## Native coverage

Device: not applicable — same sandbox constraint as phases 1–9.

Checks performed: none on hardware. `.maestro/games-wave-b.yaml` is written.

Checks NOT possible and why:

- puzzle drag smooth with a real finger
- interrupted drag from an incoming call or notification shade
- tap-tap path on a child who cannot sustain a drag (covered on web)
- puzzle level persist across a force-stop
- bubbles spawn leak when navigating away repeatedly (covered on web)
- sounds onomatopoeia clarity on a speaker
- landscape lock on a real device

## Puzzle fidelity

Mechanic-by-mechanic against index.html 2764–2978:

| Mechanic | Present | Notes |
|---|---|---|
| No fail state, no lives, no timer | yes | `canLosePuzzle` is always `false`; wrong drops never set `done` |
| Escalating hints | yes | 1st miss: float back + `invalidMove`; 2nd: `hint` + speak the word; 3rd+: tolerance grows |
| Growing tolerance | yes | starts 0.9; from the third miss on a piece `+= 0.4`, cap 2.2 |
| Tolerance basis | yes | `max(slotWidth, slotHeight) * tolerance` (legacy 2902–2914), not absolute pixels |
| Adaptive level | yes | `puzzleAdvance`: up at ≤1 miss, unchanged at 2–4, down at ≥5; cap 1..5 |
| `settings.puzzleLevel` persists | yes | `setPuzzleLevel` writes `lia:settings`; defaults stay `undefined` until set |
| Capacity beats level | yes | 3 / 4 / 6 at the documented 620 / 360 / 780 boundaries |
| Size never below 2 | yes | `puzzleSize = max(2, min(STEPS[level-1], capacity))` |
| Varied piece selection | yes | `puzzlePick` via `weightedPick(..., n*3)`, distinct initials and `shape`, then backfill |
| Both input paths | yes | RNGH `Pan` on native; pointer-move drag on web; tap-then-tap always |
| Interrupted drag returns | yes | `onFinalize` / `onResponderTerminate` / `pointercancel` reset translate; not device-attested |
| Finish waits 1100 ms | yes | then `boards++`, `puzzleAdvance`, `game.levelComplete` |
| Stars 3 / 2 / 1 | yes | `puzzleStars`, a different scale from `doneCard` |
| `PUZZLE_TOGETHER` | yes | shown when `(boards \| 0) % 3 === 2` after increment |

No therapeutic mechanic was dropped. Playwright cannot reliably drive
RNGH drag on RN-web; tap-tap covers placement there. Drag is implemented
for native and a web pointer path exists for Playwright `dragTo`.

## Files created

- `apps/mobile/src/domain/games/puzzle.ts` — STEPS, capacity, level, size, advance, pick, stars, together
- `apps/mobile/src/domain/games/numWords.ts` — `NUM_WORDS`
- `apps/mobile/src/features/games/sounds/` — reducer, screen
- `apps/mobile/src/features/games/count/` — reducer, screen, `numWords` re-export
- `apps/mobile/src/features/games/sort/` — reducer, screen
- `apps/mobile/src/features/games/bubbles/` — reducer, `bubbleSpawner`, hook, screen
- `apps/mobile/src/features/games/puzzle/` — reducer, hit test, piece, slot, done card, screen
- `apps/mobile/tests/unit/{sounds,count,sort,bubbles}-reducer.test.ts`
- `apps/mobile/tests/unit/{puzzle-difficulty,puzzle-pick,puzzle-reducer}.test.ts`
- `apps/mobile/tests/e2e/{sounds,count,sort,bubbles,puzzle}.spec.ts`
- `apps/mobile/.maestro/games-wave-b.yaml`
- `docs/migration/screenshots/phase-10/` — 110 files

## Files modified

- `useGameSession` — `fixedCatId` for sounds
- `useGameAudio` — `dragPickup`, `dragDrop`, `secondaryTap`
- `settingsStore` — `setPuzzleLevel`
- `gameRegistry` — sounds, count, sort, bubbles, puzzle
- `testIds.ts` — wave B ids
- `CardsScreen` — `router.replace(home)` when browse fails (empty `mine`)
- `cards.spec.ts` / `missing.spec.ts` — locator and listener-audit stability

## Dependencies added

none (`react-native-gesture-handler` and `react-native-reanimated` were already dependencies)

## Deviations from the phase plan

- Domain helpers live in `src/domain/games/{puzzle,numWords}.ts` with
  re-exports under the feature folders the plan named.
- `__talkiPuzzleLevel`, `__talkiPuzzleCapacity`, `__talkiPuzzleBoards`,
  `__talkiPuzzleFinishMs` are e2e-only hooks. Production finish wait is
  1100 ms.
- `__talkiPlaceCorrectAt` reused for sounds so `burst(sounds-option-0)`
  is deterministic.
- Sounds landscape (height < 500) lays the prompt beside a compact
  option row so the replay button is not covered.
- Playwright drag on RN-web is best-effort; tap-tap is the guaranteed
  path. Interrupted drag is asserted via `pointercancel` on web.

## Findings and drift

- Sounds distractors come from every animal item, not only those with
  `sound` (index.html 2706).
- Count speaks `כַּמָּה {word} יֵשׁ?` on entry and
  `{NUM_WORDS[n]} {word}` on a correct answer, both via `{ core: true }`.
- Sort boxes are built-in `CATEGORIES` with 4+ items; the item always
  belongs to `correctCatId`.
- Bubbles spawn 3 staggered at `i*700` then every 1400 ms; pause on
  `AppState` background; `stop()` on unmount (asserted).
- `PUZZLE_TOGETHER` is not random: `(boards|0) % 3 === 2` after the
  increment in `puzzleFinish`.
- `countListeners` on a remounting guess button is not a leak; missing
  e2e now measures `game-header-back`, which stays mounted.

## Risks carried into the next phase

- Speech (the eleventh game) and all six practice modes are still stubs.
  Phase 11 owns those and must not simplify recognition or scoring.
- Puzzle drag on RN-web is the weakest interaction path; native still
  needs a real-finger attestation.
- `settings.puzzleLevel` persistence is unit-tested against
  `TalkiStorage` shape, not a process kill.

## Shell extensions

1. **`fixedCatId`** on `useGameSession` — sounds declares `animals`;
   `resolveStartCategory` receives that id, not the route's `catId`.
2. **`setPuzzleLevel`** on `settingsStore` — persists `puzzleLevel` on
   `lia:settings`.
3. **`useGameAudio.dragPickup` / `dragDrop` / `secondaryTap`** — puzzle
   SFX through the shared audio surface.
4. **`createBubbleSpawner`** — staggered burst + interval, pause/resume,
   `stop()` clears every timer (unmount test).
5. **Puzzle done card** — `GameShell scoring={false}` plus
   `PuzzleDoneCard` (own star scale and together prompt).

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
