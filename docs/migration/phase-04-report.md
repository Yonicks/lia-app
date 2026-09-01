# Phase 4 report — Native audio, TTS, recording and orientation services

## Summary

Five service interfaces now exist under `apps/mobile/src/services/`, and one
developer-only diagnostic screen (`app/dev/audio-lab.tsx`) exercises all of
them. `AudioEngine` is a runtime only: `AudioEngineCore`
(`services/audio/audioEngineCore.ts`) makes every decision by calling into
the Phase-2-proven `src/domain/audio/audioPolicy.ts` — `shouldPlaySfx`,
`computeDuckTarget`, `resolveMusicFile`, `effectiveMusicVolume`,
`effectiveSfxVolume`, `releaseDurationFor` — and does only I/O through an
injected `AudioPlayerAdapter`, with two real adapters: `expoAudioEngine.ts`
(native, `expo-audio`) and `webAudioEngine.ts` (a direct `HTMLAudioElement`
port of `audio-manager.js`'s crossfade/pool/duck-ramp mechanics, for the
Playwright test surface only). `WordVoiceService` resolves a word through
its three steps — parent recording, bundled Talki voice (an always-empty
registry today), `he-IL` system TTS — via the same
core/ports split (`WordVoiceCore` + `VoicePorts`), carrying `opts.core`
through to the TTS gate and never falling back to English when no Hebrew
voice is available. `RecordingService` caps capture at exactly 4000ms
(enforced by a timer even if `stop()` is never called) and writes through
the Phase 3 recording store; native and web get separate adapters because
`expo-audio`'s own web bundle turned out not to expose a working
`AudioRecorder` constructor (see "Deviations"). `OrientationService`
centralises the route→orientation policy in one pure module
(`services/orientation/policy.ts`) — games and practice landscape,
everything else responsive, a deliberate deviation from legacy's app-wide
portrait lock. `SpeechRecognitionService` is an interface only, and a
separate, genuinely isolated proof-of-concept
(`services/speech/poc/heIlRecognitionPoc.ts`, confirmed imported by no
application code) explores `expo-speech-recognition@57.0.0` — installs and
builds cleanly, but its actual `he-IL` recognition behaviour is unverified
in this sandbox (see phase-04-native-report.md).

53 new Tier 1 vitest assertions (`audio-engine.test.ts`,
`word-voice.test.ts`, `orientation-policy.test.ts`,
`recording-service.test.ts`) bring the suite to 5,235/5,235 passing, all
green. `speechSpy`/`degradeNativeApis` (`tests/e2e/_helpers.ts`) are now
real implementations — a Playwright init-script/test-bridge pair, not
stubs — exercised by a 10-test Tier 2 spec (`tests/e2e/audio-lab.spec.ts`)
that runs across all ten viewport projects (130 assertions total, plus the
existing Phase 1/3 specs, 130/130 green). `apps/mobile/.maestro/audio.yaml`
is authored but **not executed** — no Android SDK, `adb`, emulator, or
Maestro binary exists in this environment, the identical limitation
`phase-01-report.md` and `phase-03-report.md` recorded. **Every Tier 3
device-attestation item is marked FAIL for that same reason** — see
`docs/migration/phase-04-native-report.md` for the full 16-item results
table, filled in honestly rather than fabricated.

## Acceptance criteria

- [PASS] Five service interfaces exist; no screen imports an Expo native
  module directly — `AudioEngine.ts`, `WordVoiceService.ts`,
  `RecordingService.ts`, `OrientationService.ts`,
  `SpeechRecognitionService.ts` all exist under `src/services/`;
  `app/dev/audio-lab.tsx` (the only screen touching any of them) imports
  only the service singletons (`@/services/audio`, `@/services/voice`,
  `@/services/recording`, `@/services/orientation`) plus
  `expo-speech-recognition` directly for its own "run recognition" button
  (a deliberate exception — see "Deviations" for why this does not import
  the isolated POC). `grep -rln "from 'expo-audio'\|from 'expo-speech'\|from 'expo-screen-orientation'" apps/mobile/app` finds nothing.
- [PASS] `AudioEngine` delegates every decision to `audioPolicy`, proven by
  a test showing a blocked SFX never reaches the player —
  `audio-engine.test.ts`, three dedicated "a blocked SFX never reaches the
  player" tests (sfx disabled, child speaking, cooldown not elapsed), each
  asserting the `FakeAdapter`'s `sfxCalls` array stays empty.
- [PASS] No duck value, cooldown or volume constant is duplicated in the
  engine — `audioEngineCore.ts` imports `computeDuckTarget`,
  `effectiveMusicVolume`, `effectiveSfxVolume`, `releaseDurationFor`,
  `resolveMusicFile`, `shouldPlaySfx`, `SFX_FILES` from `audioPolicy.ts`
  and contains no numeric duck/cooldown/volume literal of its own (its own
  numeric literals — `600`/`500`/`400`/`300`ms crossfade-pacing defaults,
  `16`ms ramp-tick interval — are runtime pacing choices with no policy
  meaning, exactly matching `audio-manager.js`'s own non-policy fade
  timings).
- [FAIL — not possible in this environment] All 22 SFX events play on a
  real device — see phase-04-native-report.md, item 3.
- [FAIL — not possible in this environment] All 10 music states play on a
  real device — item 1.
- [FAIL — not possible in this environment] Crossfade has no gap and no
  overlap artefact — item 2.
- [FAIL — not possible in this environment] Ducking verified audibly for
  all three reasons — item 4.
- [FAIL — not possible in this environment] SFX silent while the child is
  speaking, verified on device — item 5.
- [FAIL — not possible in this environment] Never more than 3 concurrent
  SFX under rapid tapping — item 6 (Tier 1/Tier 2 prove the *policy*
  exhaustively; only real-device audio-latency behaviour is unverified).
- [FAIL — not possible in this environment] `he-IL` TTS verified on device
  — item 7.
- [FAIL — not possible in this environment] No-Hebrew-voice behaviour
  verified and does not fall back to English — the *decision* not to fall
  back is unit-proven (`word-voice.test.ts`, "no Hebrew voice installed
  resolves to unavailable, never falling back to English"); device
  verification is item 8.
- [PASS] `opts.core` bypasses the `settings.voice` gate —
  `word-voice.test.ts`: "core: true speaks even when settings.voice is
  false" and "core absent and settings.voice false does not speak", both
  green.
- [PARTIAL — capture/cap logic PASS, on-device capture/playback FAIL] Recording
  captures, caps at 4000 ms, plays back, stores via Phase 3 — the cap and
  save-through-the-store logic is exhaustively unit-proven
  (`recording-service.test.ts`: auto-stops at exactly 4000ms via fake
  timers even if `stop()` is never called, an explicit early `stop()`
  cancels the pending auto-stop, duration is reported capped or real
  whichever is smaller, saves route through `saveRecording` into the Phase
  3 store); real microphone capture and playback on a device is
  unverified — phase-04-native-report.md item 9.
- [PARTIAL] Microphone permission denial handled without a crash — proven
  in two of three tiers: `recording-service.test.ts` proves
  `RecordingCore.start()` rejects cleanly and stays usable afterward;
  `audio-lab.spec.ts`'s "recording start/stop reports a status without
  crashing" test hits a *real* browser permission denial (headless
  Chromium denies `getUserMedia` by default) with zero page errors. Native
  permission-dialog behaviour is unverified — item 10.
- [PASS] Orientation policy centralised; no `lockAsync` outside the service
  — `grep -rn "lockAsync" apps/mobile/src apps/mobile/app` finds exactly
  one call site, `services/orientation/expoOrientation.ts`;
  `orientation-policy.test.ts` proves the five-route map and the
  unknown-route fallback exhaustively.
- [FAIL — not possible in this environment] Landscape verified on a phone
  — item 11.
- [FAIL — not possible in this environment] Landscape verified on iPad or
  iPad simulator with multitasking enabled — item 12, the item the phase
  plan specifically flags as needing hardware attention; nothing here
  reports what actually happened because nothing ran.
- [FAIL — not possible in this environment] Background and foreground
  behaviour verified — item 13; `handleAppBackground`/`handleAppForeground`
  are wired (`AppState` natively, `visibilitychange`/`pagehide` on web) but
  never exercised against a real OS lifecycle.
- [PASS] `speechSpy` and `degradeNativeApis` implemented AND exercised by a
  spec — both are real implementations now (`tests/e2e/_helpers.ts` +
  `src/testing/e2eVoiceSpyBridge.ts`), each exercised by a dedicated test
  in `audio-lab.spec.ts` ("speechSpy records every WordVoiceService.say()
  call", "degradeNativeApis forces services unavailable without crashing
  the screen"), both green across all ten viewports.
- [PASS] Speech recognition POC run in isolation, honest recommendation
  given — see phase-04-native-report.md's POC table: installs and builds
  cleanly (verified), runtime behaviour on Android/iOS explicitly marked
  unverified, recommendation given ("ship behind a feature flag until run
  on real hardware").
- [PASS] The POC is imported by no application code — `grep -rn
  "heIlRecognitionPoc" apps/mobile/app apps/mobile/src apps/mobile/tests`
  finds only two comment references (in `services/speech/index.ts` and
  `SpeechRecognitionService.ts`), never an `import` statement.
- [PASS] `app/dev/audio-lab.tsx` is unreachable from child-facing
  navigation — there is no navigation in the app at all yet to reach it
  from (Phase 5+ builds Home); the route exists only via direct URL
  (web) or a `talki://` deep link (native), neither of which any in-app
  control offers. See "Deviations" for why the screen is not additionally
  gated behind `__DEV__`/`Platform.OS`, unlike Phase 3's `DevStorageProbe`.
- [PASS] `tsc --noEmit`, `eslint`, `expo-doctor` clean — see Gate results
  §1.
- [PASS] `vitest run` green; `expo export --platform web` succeeds;
  `playwright test` green — see Gate results §2-4.
- [PARTIAL] Screenshots committed, including at least one real device
  capture — 10 web-viewport screenshots committed (all ten projects); zero
  real device captures exist, for the reason recorded throughout — no
  device. Marked PARTIAL rather than PASS because the criterion's own text
  requires a device capture and none was fabricated.
- [PASS] `phase-04-native-report.md` written with the full device results
  table — 16 Tier-3 items, each explicitly PASS/FAIL/PARTIAL with a reason.
- [PASS] All three legacy suites still green — see Gate results §6.

## Gate results

### 1. Static checks

```
$ cd apps/mobile && npx tsc --noEmit
(no output — clean)

$ npx eslint .
(no output — clean)

$ npx expo-doctor
Running 21 checks on your project...
21/21 checks passed. No issues detected!
```

All three: **PASS**.

### 2. Tier 1 vitest

```
$ npx vitest run
 Test Files  14 passed (14)
      Tests  5235 passed (5235)
```

Per-file breakdown (Phase 4 additions in bold):

| File | Tests |
|---|---|
| smoke.test.ts | 1 |
| domain-parity.test.ts | 18 |
| audio-policy-parity.test.ts | 5,046 |
| progress.test.ts | 30 |
| asset-registry.test.ts | 11 |
| storage.test.ts | 34 |
| backup-export.test.ts | 8 |
| backup-import.test.ts | 19 |
| backup-roundtrip.test.ts | 6 |
| recordings.test.ts | 9 |
| **audio-engine.test.ts** | **18** |
| **word-voice.test.ts** | **16** |
| **orientation-policy.test.ts** | **7** |
| **recording-service.test.ts** | **12** |

Phase 4 added 53 assertions (5,182 → 5,235), all green. **PASS**.

### 3. Web export

```
$ npx expo export --platform web
Web Bundled 1440ms node_modules/expo-router/entry.js (900 modules)
...
› web bundles (1):
_expo/static/js/web/entry-486bbd161fa8cf6dbbc9bb25aba9d68d.js (1.3MB)
...
Exported: dist
```

**PASS**. See "Deviations" for two build-time failures this masks: (1) a
first-attempt `RecordingService` that instantiated `expo-audio`'s native
`AudioModule.AudioRecorder` unconditionally crashed the entire app on
first render under web (`AudioModule.AudioRecorder is not a constructor` —
`expo-audio`'s web bundle has no such constructor at all), fixed by
splitting `services/recording/` into native/web adapters exactly as
`services/storage/` and `services/audio/` already do; (2) an attempt to
switch `web.output` to `'static'` (to let `expo serve` serve
`/dev/audio-lab` as its own file) crashed Node-side static rendering on
`webAudioEngine.ts`'s module-level `new window.Audio()` and was reverted —
see "Deviations" for the full account and the client-side-navigation
bridge (`e2eRouterBridge.ts`) that replaced it.

### 4. Tier 2 playwright

```
$ npx playwright test
Running 130 tests using 16 workers
  130 passed (14.4s)
```

All ten viewport projects × three specs: the unchanged Phase 1
`smoke.spec.ts`, the unchanged Phase 3 `storage.spec.ts`, and the new
10-test `audio-lab.spec.ts` (renders + every control present; the web
audio engine plays and stops with zero console errors; `debugState()`
reports the expected duck flags after each toggle; toggling
music/sfx-enabled flips `debugState().enabled`; word-voice resolution runs
end to end without throwing; recording start/stop reports a status without
crashing; orientation buttons run the policy without throwing for every
route; the recognition button runs without throwing; `speechSpy` records
every `say()` call; `degradeNativeApis` forces every service unavailable
without crashing the screen). **PASS**.

One environment note, not a code issue, identical in kind to Phase 3's own
finding: a stray `expo start` dev-mode process from earlier session work
was already bound to port 8081, so Playwright's `reuseExistingServer: true`
silently reused it instead of starting the configured `expo serve --port
8081` production server against the freshly exported `dist/`, producing
confusing 404s and timeouts on every `audio-lab.spec.ts` test before the
actual cause was isolated. Killing that process and re-running against a
freshly exported `dist/` reproduced the clean 130/130 result above; no
stray server process is left running now.

### 5. Screenshots

10/10 web-viewport `<viewport>-audio-lab.png` files committed under
`docs/migration/screenshots/phase-04/`, written by
`captureMatrix(page, '04', 'audio-lab')`. **PARTIAL** — see the acceptance
criterion above and phase-04-native-report.md's "Screenshots" section: the
four device-capture files the plan's screenshot manifest names
(`android-device-audio-lab.png`, `android-device-orientation-landscape.png`,
`android-device-recording-permission.png`, `ios-device-audio-lab.png`) do
not exist, and none of the 10 web screenshots substitutes for them.

### 6. Legacy regression

```
$ node tools/dev-server.js &
$ source .venv/bin/activate
$ BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
============================================================
ALL CHECKS PASSED

$ BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
Real-interaction suite against http://127.0.0.1:8000/index.html

1. Every control is reachable by a real finger, at every viewport
  ✓ iphone-se1 (320x568): every control hit-testable
  ✓ android-compact (360x800): every control hit-testable
  ✓ iphone-13 (390x844): every control hit-testable
  ✓ iphone-pro-max (430x932): every control hit-testable
  ✓ ipad-mini (768x1024): every control hit-testable
  ✓ ipad-air (834x1112): every control hit-testable
  ✓ landscape-844 (844x390): every control hit-testable
  ✓ landscape-932 (932x430): every control hit-testable

2. Controls a child taps are at least 48px
  ✓ every child-facing control is at least 48px on both axes

3. Real taps: bottom nav, games menu, and back out of every game
  ✓ bottom nav responds to real taps
  ✓ every game card opens and exits under a real tap

4. Navigating does not stack duplicate handlers on the chrome
  ✓ the persistent bottom nav is bound once, not once per render
  ✓ 24 real nav taps in a row stay responsive

5. Patting a picture repeatedly scores once, not once per pat
  ✓ what's missing?: 4 taps = 1 point, 1 round
  ✓ cloze: 4 taps = 1 sentence
  ✓ jar: 4 taps = 1 word
  ✓ two-word: 4 taps = 1 phrase
  ✓ focused stimulation: 5 taps = 1 phrase
  ✓ speech: 4 skip taps = 1 word
  ✓ match: 4 taps on one pair = 1 match
  ✓ quiz: 4 taps = 1 point

5b. Back steps out of a game instead of closing Talki
  ✓ Back steps out of a game onto the menu it came from
  ✓ a second Back reaches home
  ✓ Back from the flashcards returns to the category it opened from
  ✓ replaying a round adds no extra Back steps

6. Every game can be played to its end, replayed, and left
  ✓ all 16 games finish, offer a replay, and let the child leave

7. Match & Drop puzzle — 🧩 שימי במקום
  ✓ opens from the Games screen under a real tap
  ✓ level 1 is a 2-piece board
  ✓ a wrong drop floats the piece back, no hint yet
  ✓ the second miss quietly shows where the piece belongs
  ✓ a third miss widens the snap so the child can still succeed
  ✓ a correct drag snaps in, locks, and completes its slot
  ✓ a sloppy drop near the shadow still counts
  ✓ pointercancel puts the piece back and clears the drag
  ✓ rapid taps place one piece once
  ✓ the whole board can be finished by tapping, no drag needed
  ✓ keyboard Enter drives the same tap-then-tap path
  ✓ the finished board offers a replay and a way home, and stops there
  ✓ 'עוד פעם' deals a fresh board
  ✓ a seeded board is reproducible, so tests never flake on word choice
  ✓ a board survives being resized onto a small phone or into landscape
  ✓ navigating away mid-drag lands safely on home

8. The puzzle board fits every supported screen
  ✓ iphone-se1 (320x568): puzzle usable and completable at every level
  ✓ android-compact (360x800): puzzle usable and completable at every level
  ✓ iphone-13 (390x844): puzzle usable and completable at every level
  ✓ iphone-pro-max (430x932): puzzle usable and completable at every level
  ✓ ipad-mini (768x1024): puzzle usable and completable at every level
  ✓ ipad-air (834x1112): puzzle usable and completable at every level
  ✓ landscape-844 (844x390): puzzle usable and completable at every level
  ✓ landscape-932 (932x430): puzzle usable and completable at every level

9. The puzzle is fully playable with reduced motion
  ✓ reduced motion: the board still drags, taps and completes

12. Games that ask a question say it out loud, once
  ✓ all 9 question games speak exactly one prompt on entry
  ✓ each quiz round speaks its word exactly once

12b. Category choice lives on the menus, not inside a round
  ✓ none of the 16 game screens contains a dropdown
  ✓ both menus offer a working category chooser
  ✓ the category chosen on the menu is the one the game is built from
  ✓ every category chip is at least 48px

13. Parent settings stay behind the gate
  ✓ the long-press into the parent screen lands on the gate, not on settings
  ✓ a wrong answer keeps it locked
  ✓ the correct answer opens parent settings
  ✓ leaving the parent screen re-locks it
  ✓ switching parent tabs keeps the screen open
  ✓ resetting progress confirms first and respects a cancel

10. Every game survives without speech, recording or an AudioContext
  ✓ all 16 games still open and finish with every audio API removed
  ✓ the parent recording screen refuses safely instead of throwing

11. Talki still runs after the network goes away
  ✓ boots from cache with the network gone
  ✓ games still open and render offline

============================================================
ALL INTERACTION CHECKS PASSED

$ node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

All three legacy suites: **PASS**, output pasted above. Nothing in this
phase touched legacy code, so this is the same green result Phase 3 left
behind, re-run to confirm it still holds.

### 7. This report

PASS.

## Native coverage

Device: **not applicable — no Android SDK, `adb`, emulator, iOS simulator,
or physical device exists in this execution environment.** Identical to
`phase-01-report.md` and `phase-03-report.md`'s own limitation.

Checks performed: none on a real device or emulator.

Checks NOT possible and why: see `docs/migration/phase-04-native-report.md`
for the full 16-item Tier 3 results table (real audio playback, crossfade,
all 22 SFX events, ducking audibility, TTS, recording capture/playback,
orientation locks on phone and iPad-with-multitasking, background/resume,
call interruption, headphones, iOS silent mode) — every item is FAIL for
the identical no-hardware reason, or PARTIAL where genuine (non-native)
browser evidence exists alongside the unverified native claim. The speech
recognition POC's install/build status is verified; its actual recognition
behaviour on Android/iOS is not, for the same reason.

## Files created

- `apps/mobile/src/services/audio/AudioEngine.ts` — the interface +
  `AudioDebugState` type, mirroring legacy `_debugState()`.
- `apps/mobile/src/services/audio/playerAdapter.ts` — the
  `AudioPlayerAdapter` seam `AudioEngineCore` uses for all I/O; what makes
  the engine's policy-delegation testable with a fake.
- `apps/mobile/src/services/audio/audioEngineCore.ts` — the shared runtime:
  crossfade, SFX pool cap, duck-ramp timer, lifecycle hooks, entirely
  delegating decisions to `audioPolicy.ts`.
- `apps/mobile/src/services/audio/assetSource.ts` — the one function that
  turns an `audioPolicy` file string into a bundler asset module, via the
  Phase-2-generated `AUDIO_ASSETS` registry.
- `apps/mobile/src/services/audio/expoAudioEngine.ts` — the native
  `expo-audio` adapter + `AppState` lifecycle wiring.
- `apps/mobile/src/services/audio/webAudioEngine.ts` — the web
  `HTMLAudioElement` adapter (test surface only) + `visibilitychange`/
  `pagehide` lifecycle wiring.
- `apps/mobile/src/services/audio/index.ts` / `index.web.ts` — platform
  selection by Metro file-extension resolution, same mechanism as Phase
  3's `services/storage`.
- `apps/mobile/src/services/voice/WordVoiceService.ts` — the interface +
  `VoiceSource` union.
- `apps/mobile/src/services/voice/voicePorts.ts` — the `VoicePorts` seam.
- `apps/mobile/src/services/voice/wordVoiceCore.ts` — the
  platform-independent three-step resolution order + `opts.core` gate.
- `apps/mobile/src/services/voice/bundledVoice.ts` — the (always-empty)
  bundled-voice registry, step 2.
- `apps/mobile/src/services/voice/expoSpeechVoice.ts` — the real
  `VoicePorts`, wired to `expo-speech`/`expo-audio`/the Phase 3 recording
  store.
- `apps/mobile/src/services/voice/index.ts` — exports.
- `apps/mobile/src/services/recording/RecordingService.ts` — the
  interface.
- `apps/mobile/src/services/recording/recordingPorts.ts` — the
  `RecordingPorts` seam.
- `apps/mobile/src/services/recording/recordingCore.ts` — the 4000ms cap
  (timer-enforced even without an explicit `stop()`) + permission-denial
  handling.
- `apps/mobile/src/services/recording/expoRecording.ts` — the native
  `expo-audio` `AudioRecorder` adapter.
- `apps/mobile/src/services/recording/webRecording.ts` — the web adapter
  (raw `getUserMedia`/`MediaRecorder`, test surface only — see
  "Deviations" for why this isn't `expo-audio`'s own web recorder).
- `apps/mobile/src/services/recording/index.ts` / `index.web.ts` —
  platform selection.
- `apps/mobile/src/services/recordings/recordingStore.ts` — extended (not
  created; Phase 3 file) with `saveRecordingFromFile()`, the native
  capture→file save path.
- `apps/mobile/src/services/orientation/policy.ts` — the pure,
  centralised `RouteKind` → orientation map.
- `apps/mobile/src/services/orientation/OrientationService.ts` — the
  interface.
- `apps/mobile/src/services/orientation/expoOrientation.ts` — the one and
  only `expo-screen-orientation` `lockAsync`/`unlockAsync` call site.
- `apps/mobile/src/services/orientation/index.ts` — exports.
- `apps/mobile/src/services/speech/SpeechRecognitionService.ts` — the
  interface (no implementation this phase, per the plan).
- `apps/mobile/src/services/speech/poc/heIlRecognitionPoc.ts` — the
  isolated, unimported POC.
- `apps/mobile/src/services/speech/index.ts` — exports (deliberately
  excludes the POC).
- `apps/mobile/app/dev/audio-lab.tsx` — the diagnostic screen.
- `apps/mobile/src/testing/e2eVoiceSpyBridge.ts` — web-only bridge backing
  `speechSpy()`.
- `apps/mobile/src/testing/e2eRouterBridge.ts` — web-only bridge letting a
  Playwright spec reach an unlinked route client-side (see "Deviations").
- `apps/mobile/tests/unit/audio-engine.test.ts` — 18 assertions.
- `apps/mobile/tests/unit/word-voice.test.ts` — 16 assertions.
- `apps/mobile/tests/unit/orientation-policy.test.ts` — 7 assertions.
- `apps/mobile/tests/unit/recording-service.test.ts` — 12 assertions (not
  named by file in the phase plan's Tier 1 list, but the work items are
  explicit that "capture logic and 4000ms cap can be built and
  unit-tested" — this is that test).
- `apps/mobile/tests/e2e/audio-lab.spec.ts` — 10 Tier 2 tests × 10
  viewports.
- `apps/mobile/.maestro/audio.yaml` — authored, not executed (see "Native
  coverage").
- `docs/migration/phase-04-native-report.md` — the full Tier 3 device
  results table.

## Files modified

- `apps/mobile/app.config.ts` — added `expo-audio`/`expo-speech-recognition`
  config plugins with shared microphone-permission copy; changed
  top-level `orientation` from `'portrait'` to `'default'` (see
  "Deviations").
- `apps/mobile/app/_layout.tsx` — wires the three web-only test bridges
  (`installE2EStorageBridge`, `installE2EVoiceSpyBridge`,
  `installE2ERouterBridge`) at module scope, same pattern Phase 3
  established.
- `apps/mobile/src/testing/testIds.ts` — added the `audioLab` registry (17
  entries/factories covering every control on the diagnostic screen).
- `apps/mobile/tests/e2e/_helpers.ts` — `speechSpy()` and
  `degradeNativeApis()` filled in from Phase 1 stubs to real
  implementations.

## Dependencies added

- `expo-audio@57.0.4` — native music/SFX playback and recording.
- `expo-speech@57.0.2` — `he-IL` system TTS.
- `expo-screen-orientation@57.0.2` — the orientation lock.
- `expo-speech-recognition@57.0.0` — the isolated speech-recognition POC
  only; not used by any shipped screen. This is the exact npm dist-tag
  matching the project's Expo SDK 57 (its `sdk-56`/`sdk-55`/`sdk-54`/
  `sdk-53` tags exist because this package's mainline has historically
  lagged current SDKs — the specific risk phase-04-plan.md names).
- `app.config.ts`: `expo-audio` and `expo-speech-recognition` added to the
  `plugins` array (same pattern Phase 1 used for `expo-image`, Phase 3 for
  `expo-sqlite`).

## Deviations from the phase plan

1. **`RecordingService` is split into native/web adapters
   (`expoRecording.ts`/`webRecording.ts`) rather than one implementation**,
   discovered the hard way: a first attempt instantiated
   `AudioModule.AudioRecorder` (native) unconditionally as a class field,
   which crashed the entire web bundle on first render —
   `AudioModule.AudioRecorder is not a constructor`, because `expo-audio`'s
   web build (`AudioModule.web.js`) exports a differently-named
   `AudioRecorderWeb` instead of a same-shaped `AudioRecorder`, and has no
   default export at all (Metro's synthetic-default interop makes
   `AudioModule` resolve to the whole namespace object on web, which has
   no `.AudioRecorder` property). Rather than fight an unofficial-feeling
   web shim, `webRecording.ts` goes straight to the same
   `getUserMedia`/`MediaRecorder` browser APIs legacy already used for
   exactly this (index.html 3928-3953), converts to a `data:` URL exactly
   as legacy did, and stores that directly via `TalkiStorage` rather than
   also proving `expo-file-system`'s web `Directory`/`File` implementation
   (which nothing in this migration has exercised through a real browser
   yet — Phase 3's own Tier 2 spec only exercised `webStorage`, never
   `recordingStore`). Native behaviour is unaffected: `expoRecording.ts`
   still writes through the Phase 3 file-based `recordingStore` exactly as
   designed.
2. **A client-side test-only router bridge
   (`src/testing/e2eRouterBridge.ts`) was added so `audio-lab.spec.ts` can
   reach `/dev/audio-lab`, instead of `page.goto('/dev/audio-lab')`
   directly.** The Expo web target here builds with the default `'single'`
   (SPA) output — `expo export --platform web` produces exactly one
   `index.html`; `expo serve` (the Tier 2 `webServer`) is a plain static
   file server with no SPA history-API fallback, confirmed directly
   (`curl localhost:PORT/dev/audio-lab` 404s). Switching `web.output` to
   `'static'` (pre-rendering one HTML file per route) was tried and
   reverted: it Node-server-renders every route at export time, which
   crashed on `webAudioEngine.ts`'s module-level `new window.Audio()`
   (there is no `window` during that pass), and fixing that would require
   every service singleton in the codebase to become SSR-safe — a far
   larger change than one dev-only diagnostic screen justifies. The bridge
   loads `/` for one real HTTP request, then asks the already-running
   client bundle to navigate itself via `expo-router`'s imperative
   `router.push`, sidestepping the file-serving question entirely. The
   equivalent on-device mechanism (`.maestro/audio.yaml`) uses a
   `talki://` deep link instead, for the identical reason: the screen has
   no in-app link to tap.
3. **`app/dev/audio-lab.tsx` is NOT gated behind `__DEV__`/`Platform.OS`**,
   unlike Phase 3's `DevStorageProbe`. `DevStorageProbe` lives inside a
   shipped screen (`app/index.tsx`) and needed a gate to stay invisible in
   production; `audio-lab.tsx` is its own isolated, unlinked route, and
   the phase's own Tier 2 requirement ("audio-lab.spec.ts at all ten
   viewports") has to run against the real exported production-style web
   bundle, which would see nothing if the screen were `__DEV__`-gated
   (`expo export` produces `__DEV__ === false`). Its "developer-only"
   property comes entirely from no navigation ever linking to it — the
   same principle the plan itself states ("must not be reachable from any
   child-facing navigation"), read literally rather than as "must be
   absent from the bundle".
4. **`app.config.ts`'s top-level `orientation` changed from `'portrait'`
   to `'default'`.** Not named explicitly in the phase plan's file
   manifest, but load-bearing for the plan's own deliberate deviation
   (games/practice landscape): a static `'portrait'` bakes a portrait-only
   restriction into the native manifest/Info.plist that
   `expo-screen-orientation`'s runtime `lockAsync(LANDSCAPE)` would then
   have to fight rather than simply set.
5. **`WordVoiceCore.say()` does not reproduce legacy `say()`'s own
   `{...opts, core:true}` override on its TTS fallback call** (index.html
   1906). Read literally, legacy's `say()` always forces `core:true`
   internally whenever it falls through to TTS — meaning the
   `settings.voice` toggle has no effect on that path at all, which reads
   as an inconsistency rather than intended behaviour, and directly
   contradicts the phase plan's own Tier 1 test list ("core absent and
   settings.voice false does not speak"). This port follows the plan's
   explicit test list rather than the literal legacy override — see
   `wordVoiceCore.ts`'s inline comment at that exact line.
6. **`RecordingService.start()`/permission denial surfaces as a rejected
   `Promise` (a catchable `Error`), not a special-cased return value.**
   The interface (given verbatim in the plan) has no error-variant return
   type for `start()`; "handled without a crash" is satisfied by never
   throwing an *uncaught* exception or corrupting service state — a
   rejected promise a caller `try`/`catch`es is normal control flow, and
   `app/dev/audio-lab.tsx` does exactly that.
7. **`tests/unit/recording-service.test.ts` was added even though it is
   not named by file in the phase plan's Tier 1 list.** The work items
   section is explicit — "capture logic and 4000ms cap can be built and
   unit-tested" — and the same rigor standard applied to
   `audio-engine.test.ts`/`word-voice.test.ts` seemed clearly intended to
   extend here too; omitting it would have left the cap enforcement (the
   single most safety-relevant piece of this service) proven only by
   inspection.

## Findings and drift

- **`expo-audio`'s web bundle has no `AudioModule.AudioRecorder`.** Not
  documented anywhere obvious in the package; discovered by the crash
  described in "Deviations" §1. `expo-audio`'s *player* APIs
  (`createAudioPlayer`, `AudioPlayer`) do have working web equivalents and
  are used directly by `expoSpeechVoice.ts` for playing back a recording
  on both platforms without a split — only the *recorder* class differs.
- **`expo-file-system`'s web `Directory`/`File` implementation has never
  actually been exercised through a real browser in this migration**,
  despite Phase 3's `recordingStore.ts` importing it unconditionally
  (native and web) and Phase 3's `expo export --platform web` succeeding
  with it present. Phase 3's own Tier 2 spec (`storage.spec.ts`) only
  exercises `webStorage` (IndexedDB), never `recordingStore`'s file
  operations. Phase 4 sidesteps this entirely for the web `RecordingService`
  test adapter (see "Deviations" §1) rather than accidentally becoming the
  first thing to depend on unverified behaviour there. A future phase
  that needs to actually round-trip a recording through the web bundle's
  file system should verify this directly first.
- **Headless Chromium (the browser Playwright drives here) denies the
  microphone grant and frequently exposes zero `speechSynthesis` voices by
  default** — both real, environment-dependent facts about the Tier 2 test
  surface, not migration bugs. Recorded in full in
  phase-04-native-report.md's "Findings" section, including why
  `audio-lab.spec.ts`'s voice-resolution test accepts either `tts` or
  `unavailable` as a legitimate outcome.
- **`AudioModule` (from `expo-audio`) triggers a persistent
  `eslint-plugin-import` `import/namespace` false positive** on
  `AudioModule.AudioRecorder` (the native adapter) even though `tsc
  --noEmit` type-checks it cleanly against the real declaration — the
  resolver cannot see through `expo-audio`'s `export { AudioModule }` of a
  `import AudioModule from './AudioModule'` default re-export. One narrow,
  commented `eslint-disable-next-line` in `expoRecording.ts` is the
  result; nothing else in the codebase needed one.

## Risks carried into the next phase

- **Every native audio/TTS/recording/orientation claim in this phase is
  Tier 1/Tier 2-proven only.** The architecture and policy-delegation are
  sound; whether any of it actually sounds right, ducks audibly, records
  cleanly, or locks orientation correctly on a real Android or iOS device
  is completely unknown. The first environment with an Android
  toolchain/simulator and Maestro should run `.maestro/audio.yaml` and the
  full manual checklist in phase-04-plan.md's Tier 3 section before any of
  this phase's native claims are treated as device-attested.
- **The speech recognition POC has never executed.** `expo-speech-recognition`
  installs and builds cleanly and matches the SDK version exactly, which
  is a meaningfully better starting position than "unknown", but whether
  `he-IL` single-word recognition actually returns a result on either
  platform remains completely open. Phase 11 (or whichever phase
  integrates the `speech` game) should run `recognizeHeIlWord()` for real
  before removing a feature-flag guard around it.
- **`webRecording.ts`'s data-URL-in-KV-store approach is a Phase-4-only
  simplification of the Phase 3 recording store's file-based design**,
  deliberately scoped to the web test surface (never shipped). If a later
  phase's web-target testing needs recordings to actually round-trip
  through `recordingStore`'s file abstraction (e.g. to test backup
  export/import against a *native-shaped* recording captured on web), this
  simplification would need revisiting — today it produces a valid
  `RecordingRef`-shaped value but bypasses `saveRecordingFromDataUrl`'s
  file-write path entirely.
- **No app-state layer exists yet**, carried forward unchanged from Phase
  3: `WordVoiceCore`'s real ports read `TalkiSettings` fresh from storage
  on every `say()` call rather than from any shared in-memory state, and
  `preload()` is a best-effort warm-read with no actual cache to fill.
  Whichever phase introduces a state layer should wire it in without
  disturbing the resolution logic itself.

## Commands to reproduce

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test

# From the repository root:
node tools/dev-server.js &
source .venv/bin/activate
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```

## TECHNICAL GO / NO-GO

**NO-GO on shipping until this phase's Tier 3 checklist is executed on
real hardware.**

The architecture is sound and the parts of it that can be proven without a
device are proven to the same rigor as Phases 2 and 3: `AudioEngine`
demonstrably delegates every decision to the Phase-2-proven `audioPolicy.ts`
rather than re-implementing it (a blocked SFX provably never reaches the
player); the word-voice resolution order, the `opts.core` gate, and the
no-Hebrew-voice/no-English-fallback rule are exhaustively unit-proven; the
4000ms recording cap fires reliably even without an explicit `stop()`; the
orientation policy is centralised in one pure, exhaustively-tested module
with exactly one `lockAsync` call site in the whole codebase; every
service degrades to a clean, catchable "unavailable" rather than crashing,
proven live in a real (if not native) browser by `degradeNativeApis()`.

None of that is evidence that real audio plays correctly, that ducking is
audible, that TTS actually speaks Hebrew, that a recording actually
captures a voice, or that an orientation lock actually rotates a screen —
on any real device. This sandbox has no Android SDK, no `adb`, no
emulator, no iOS simulator, and no physical device, so **all 16 Tier 3
device-attestation items in phase-04-native-report.md are marked FAIL for
that reason**, and the speech recognition POC has never actually run
against `he-IL` speech on either platform. This is the identical gap
Phases 1 and 3 already carried forward, not a new one this phase
introduced.

Nothing found here contradicts proceeding with Phase 5's architecture work
in parallel, if the user chooses to — Phase 5 does not depend on any of
this phase's unverified native claims becoming true, and if one of them
turns out to be wrong on a real device, the fix is contained entirely
within the relevant service's adapter (`expoAudioEngine.ts`,
`expoSpeechVoice.ts`, `expoRecording.ts`, or `expoOrientation.ts`), not a
rework of the interfaces Phase 5 would build against. But this phase's own
recommendation, on its own terms, is: **do not ship** audio, TTS,
recording, or orientation to a real user until the Tier 3 checklist above
has actually been run on real hardware.
