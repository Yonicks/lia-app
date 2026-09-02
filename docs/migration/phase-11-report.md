# Phase 11 report — Speech practice and speech recognition

## Summary

Six evidence-based practice modes now sit on the shared game shell, plus
the speech game. Focus, cloze, temptation, receptive, pairs and combine
follow the clinical numbers in `index.html` with no timing or threshold
changed. The Phase 4 he-IL POC was never executed on a device, so the
speech game is behind `SPEECH_GAME_ENABLED_DEFAULT = false` and shows the
explicit unsupported screen; temptation stays fully usable via its
manual open. 140 viewport screenshots are committed. Native device
captures and recognition attestation are not possible in this sandbox.

## Acceptance criteria

- [PASS] All six practice modes work end to end
- [PASS] The speech game works, or is flagged off with a recorded reason —
  flagged off (`SPEECH_GAME_ENABLED_DEFAULT = false`) because Phase 4
  never attested he-IL recognition; the route still renders the explicit
  unsupported screen and does not crash; e2e can force the board on
- [PASS] cloze wait is EXACTLY 5000 ms, asserted by test
- [PASS] cloze models in the order answer, phrase, answer
- [PASS] cloze scoring is parent-driven, never recognition-driven
- [PASS] cloze clears its timer and stops TTS on leaving
- [PASS] temptation opens on ANY sound, asserted with an arbitrary stub result
- [PASS] temptation's manual open always works
- [PASS] temptation timeout is 8000 ms and does not fail the round
- [PASS] NO practice mode has a reachable failure state, asserted by test
- [PASS] receptive: 8 rounds, adaptive level matching legacy in both directions
- [PASS] receptive column rule 2 / 3 / 2 correct
- [PASS] focus: CARRIERS.length steps and the BESPOKE done card, not doneCard
- [PASS] pairs: 6 pairs, random target, shuffled display
- [PASS] combine: 6 rounds, modifier plus picture builds the phrase
- [PASS] speech: Levenshtein <= 1 on the plain form
- [PASS] speech: skip always available
- [PASS] speech: an explicit unsupported screen, not a crash
- [PASS] Every mode speaks its prompt exactly once on entry, proven by speechSpy
- [PASS] Every mode works under degradeNativeApis
- [PASS] speechOrListeningTask music and the listening duck engage while listening
- [FAIL] Microphone permission denial leaves every mode usable — no device
  to deny the permission; web paths stay usable without a mic
- [PASS] Audits clean, no listener growth, no leaked timers
- [PASS] tsc --noEmit, eslint, expo-doctor clean
- [PASS] vitest run green; expo export --platform web succeeds; playwright green
- [FAIL] 140 screenshots plus two device captures committed — 140 web files
  present; device captures absent
- [FAIL] Recognition attested on a real device, or its absence recorded —
  absence recorded: no Android SDK / adb / device in this sandbox
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
 Test Files  41 passed (41)
      Tests  5459 passed (5459)
```

### 3. Web export

```
$ npx expo export --platform web
Exported: dist
```

### 4. Tier 2 playwright

Phase 11 specs (all ten viewports):

```
$ npx playwright test tests/e2e/practice-*.spec.ts tests/e2e/speech.spec.ts tests/e2e/navigation.spec.ts --workers=4
  310 passed (1.8m)
```

```
$ npx playwright test --workers=4
  1240 passed (7.8m)
```

### 5. Screenshots

PASS for the web matrix. 140 files under
`docs/migration/screenshots/phase-11/` (14 states × 10 viewports).
No device capture (`android-device-temptation-listening.png`,
`android-device-speech-listening.png`).

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

Device: not applicable — same sandbox constraint as phases 1–10.

Checks performed: none on hardware. `.maestro/practice.yaml` is written.

Checks NOT possible and why:

- he-IL recognition of a single word on Android
- he-IL recognition on iOS
- temptation jar opening on a real child-like vocalisation such as "ba"
- microphone permission denial
- cloze five-second pause felt on a device speaker
- music duck while the microphone is open
- landscape lock on a real device

## Clinical fidelity

Timings and thresholds, one by one, against `index.html`:

| Parameter | Legacy | Port | Notes |
|---|---|---|---|
| Cloze wait | 5000 ms (3110) | `CLOZE_WAIT_MS = 5000` | The intervention. E2E may skip the preceding TTS wait; production still speaks then waits |
| Cloze pool | 6 | `CLOZE_POOL = 6` | `shuffle(CLOZE).slice(0, 6)` |
| Cloze model | `answer + '. ' + phrase + ' ' + answer` | `clozeModelSpeech` | Parent scores via `היא אמרה!` |
| Temptation listen | 8000 ms (3915) | `TEMPTATION_LISTEN_MS = 8000` | Timeout stops listening; does not fail |
| Temptation pool | 6 | `TEMPTATION_POOL = 6` | Any recognition result opens; manual `לפתוח` always present |
| Receptive rounds | 8 | `RECEPTIVE_ROUNDS = 8` | `i` increments only on a correct answer |
| Receptive start level | 2 | `RECEPTIVE_START_LEVEL = 2` | Options = level |
| Receptive run-up | `run>=3 && level<4` | `RECEPTIVE_RUN_UP = 3`, max 4 | Exact |
| Receptive miss-down | `miss>=2 && level>2` | `RECEPTIVE_MISS_DOWN = 2`, min 2 | Does not increment `i` |
| Receptive columns | `<=2 → 2`, `===3 → 3`, else 2 | `receptiveColumns` | Exact |
| Focus steps | `CARRIERS.length` (8) | `total: CARRIERS.length` | Bespoke done card, not `doneCard` |
| Pairs pool | 6 | `PAIRS_POOL = 6` | Random member is the target |
| Combine rounds | 6 | `COMBINE_ROUNDS = 6` | Finish waits 2600 ms |
| Speech match | Levenshtein ≤ 1 on plain | `SPEECH_LEVENSHTEIN_MAX = 1` | Plus includes/contained |
| Failure state | none | `canFail*` always `false` | Everything counts as an attempt |

No practice mode can be failed.

## FEATURE PARITY GATE

Every child-facing play and practice surface now exists: Home, category
grid, eleven games, six practice modes, and the speech game (flagged
off on web until recognition is attested).

What remains before parity can be declared:

- Parent centre (gate, settings, custom words, recordings)
- Rewards / sticker album
- Native he-IL recognition attested on a named device
- Device-attested microphone, orientation lock, and process-kill persistence
- The speech game turned on after that attestation

Those are Phase 12 (parent centre, custom words, rewards) and later
device/parity phases.

## Files created

- `apps/mobile/src/features/practice/practiceTimings.ts` — isolated clinical constants
- `apps/mobile/src/features/practice/PracticeGate.tsx` — category gate + `speechOrListeningTask`
- `apps/mobile/src/features/practice/practiceRegistry.ts` — six mode screens
- `apps/mobile/src/features/practice/focus/` — focused stimulation
- `apps/mobile/src/features/practice/cloze/` — cloze + expectant pause
- `apps/mobile/src/features/practice/temptation/` — communication temptation
- `apps/mobile/src/features/practice/receptive/` — adaptive receptive ID
- `apps/mobile/src/features/practice/pairs/` — minimal pairs
- `apps/mobile/src/features/practice/combine/` — two-word combinations
- `apps/mobile/src/features/practice/speech/speechReducer.ts` — speech game reducer
- `apps/mobile/src/features/games/speech/` — speech screen + feature flag
- `apps/mobile/src/domain/speech/levenshtein.ts` — legacy 3877–3883
- `apps/mobile/src/services/speech/expoSpeechRecognition.ts` — documented unsupported stub
- `apps/mobile/tests/unit/practice-timings.test.ts` and the six reducer + levenshtein specs
- `apps/mobile/tests/e2e/practice-*.spec.ts`, `speech.spec.ts`
- `apps/mobile/.maestro/practice.yaml`
- `docs/migration/screenshots/phase-11/` — 140 web files

## Dependencies added

none

## Deviations from the phase plan

- Clinical constants live in `practiceTimings.ts` rather than
  `clozeTimings.ts`, so every mode shares one module.
- Speech reducer lives under `features/practice/speech/`; the screen
  lives under `features/games/speech/` because `speech` is a `GameId`.
- Speech game defaults off (`SPEECH_GAME_ENABLED_DEFAULT = false`) per
  the plan's "recognition may be unviable" default. The unsupported
  screen still ships. E2E forces the flag on to capture `speech-board`.
- `expoSpeechRecognition.ts` is a documented stub (`isSupported() ===
  false`) plus window hooks for Playwright. The Phase 4 POC remains
  unimported by app code.

## Findings and drift

- `WordVoiceService.say` waits up to a 6000 ms safety net when web TTS
  never fires `onDone`. Cloze e2e therefore has `__talkiClozeSkipSay`
  so the 5000 ms wait can be measured without sitting behind that net.
  Production still speaks, then waits 5000 ms.
- Phase 4 recorded that the he-IL POC was never executed. That is the
  reason the speech game is flagged off.

## Risks carried into the next phase

- Recognition is unproven. Phase 12 must not assume a working
  microphone or `he-IL` result.
- Parent centre, custom words and rewards are still stubs.

## Commands to reproduce

```
cd apps/mobile
npx tsc --noEmit && npx eslint . && npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test --workers=4
cd ../..
node tools/dev-server.js &
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
node --test tests/audio-logic.test.js
```
