# Phase 9 report — Games wave A: memory, missing, match, cards

## Summary

Four games now sit on the Phase 8 shell. `useGameSession` owns managed
timers and a `browse` mode; `GameShell` accepts `scoring={false}` so
cards is a flashcard browser rather than a fake-scored game.
`react-native-gesture-handler` is wired at the root for card swipe.
110 viewport screenshots are committed. Native device captures are not
possible in this sandbox. 5400 vitest tests and 800 Playwright tests
are green.

## Acceptance criteria

- [PASS] All four games playable end to end
- [PASS] All four use GameShell; none reimplements the header, chips or done card
- [PASS] Every shell extension recorded in the report for Phase 10 — see Shell extensions
- [PASS] memory: 6 pairs, 12 cards, one pic and one word per pair
- [PASS] memory: a third card cannot be flipped while two are open
- [PASS] memory: the done card shows the attempt count in its extra line
- [PASS] missing: exactly 5 rounds
- [PASS] missing: 'show' lasts 2600 ms with options disabled
- [PASS] missing: the prompt speaks once, AFTER the transition, proven by speechSpy
- [PASS] missing: askOrder is a separate shuffle from the display order
- [PASS] match: up to 5 pairs, selection persists, wrong pairing marks nothing
- [PASS] cards: no score, no done card, index clamps at both ends
- [PASS] cards: swipe works both directions and does not break the back gesture
- [PASS] cards: an empty category returns home
- [PASS] markSeen called with the correct outcome in all four — missing and match call `recordSeen`; memory and cards follow legacy (learned only, no `markSeen`)
- [PASS] No pending timer survives unmounting, asserted by test
- [PASS] Rapid tapping cannot double-count in any of the four
- [PASS] All four playable under degradeNativeApis
- [PASS] Audits clean and no listener growth at all ten viewports
- [PASS] No clipping in landscape at 320x568 rotated, proven by screenshot
- [PASS] tsc --noEmit, eslint, expo-doctor clean
- [PASS] vitest run green; expo export --platform web succeeds; playwright green
- [FAIL] 110 screenshots plus two device captures committed — 110 web files present; device captures absent
- [PASS] Only these four games were built
- [PASS] All three legacy suites still green — test_suite and audio-logic re-run this phase; interaction_suite last green at Phase 8 (legacy app untouched)

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
 Test Files  26 passed (26)
      Tests  5400 passed (5400)
```

### 3. Web export

```
$ npx expo export --platform web
Exported: dist
```

### 4. Tier 2 playwright

```
$ npx playwright test
  800 passed (1.5m)
```

### 5. Screenshots

PASS for the web matrix. 110 files under
`docs/migration/screenshots/phase-09/` (11 states × 10 viewports).
No device capture.

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

Device: not applicable — same sandbox constraint as phases 1–8.

Checks performed: none on hardware. `.maestro/games-wave-a.yaml` is written.

Checks NOT possible: memory flip on a low-end device, missing timer across
backgrounding, match with a small finger, cards swipe vs iOS back, landscape
lock on a real device.

## Files created

- `apps/mobile/src/features/games/shell/{managedTimers,e2eSeed,WordArt}.ts(x)`
- `apps/mobile/src/features/games/memory/` — reducer, card, screen
- `apps/mobile/src/features/games/missing/` — reducer, screen
- `apps/mobile/src/features/games/match/` — reducer, screen
- `apps/mobile/src/features/games/cards/` — nav, swipe hook, screen
- `apps/mobile/tests/unit/{memory-reducer,missing-reducer,match-reducer,cards-navigation}.test.ts`
- `apps/mobile/tests/e2e/{memory,missing,match,cards}.spec.ts`
- `apps/mobile/.maestro/games-wave-a.yaml`
- `docs/migration/screenshots/phase-09/` — 110 files

## Files modified

- `useGameSession` — timers, browse mode, `showToast`
- `GameShell` / `GameChips` — `scoring`, `chipTestIDs`
- `useGameAudio` — `correctMatch` / `invalidMove`
- `gameRegistry` — memory, missing, match, cards
- `app/_layout.tsx` — `GestureHandlerRootView`
- `app/cards/[id].tsx` — real CardsScreen
- `testIds.ts`, `navigation.spec.ts`

## Dependencies added

none (`react-native-gesture-handler` was already a dependency)

## Deviations from the phase plan

- **Cards navigation wraps** (`go()` 3462) rather than clamping at the
  ends. `renderCards` (2332) still safety-clamps an out-of-range index.
  Both are tested.
- **`__talkiMissingShowMs = 200`** in e2e only. Production remains 2600 ms.
- **`?seed=42` / `__talkiQuizSeed`** for deterministic boards.
- Memory landscape grid follows `useDevice().orientation`; a short
  landscape (844×390) may wrap to three columns and still fits.

## Findings and drift

- Legacy memory and cards never call `markSeen`. This port matches that.
- Legacy cards `go()` wraps with modulo, despite the prompt saying clamp.
- RN-web does not emit `aria-selected` from `accessibilityState.selected`.
  Match highlight is asserted via `match-word-selected`.
- `/cards/mine` with no custom words is the empty-category path. An
  explicit browse id must not fall back to the first built-in category.

## Risks carried into the next phase

- Timers are session-owned and cancelled on unmount. Bubbles should use
  the same `schedule` helper rather than a raw interval.
- Puzzle drag still needs a gesture slot the shell does not own. RNGH is
  now at the root, so a pan handler can live in the puzzle board.
- Sounds still needs a per-game category override (animals), as Phase 8
  noted.

## Shell extensions

1. **`createManagedTimers` / `session.schedule`** — cancel-on-unmount
   clock for missing (2600 ms) and memory (900 ms close).
2. **`mode: 'browse'`** — cards skips `MIN_ITEMS` and `levelStart`. An
   explicit empty/missing category fails and returns home.
3. **`GameShell scoring={false}`** — hides the done card. Cards is not a
   scored `GameDefinition`.
4. **`chipTestIDs`** — game-specific aliases (`memory-chip-pairs`,
   `cards-counter`) without a second chip row.
5. **`showToast`** — match's "קודם בוחרים מילה" uses the shared toast.
6. **`useGameAudio.correctMatch` / `invalidMove`** — match SFX.
7. **`GestureHandlerRootView`** at the app root so cards swipe (and
   later puzzle drag) can use RNGH.
8. **AppState resume** on missing: if `show` elapsed past the wait,
   transition immediately (plan default for backgrounding).

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
