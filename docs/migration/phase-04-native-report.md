# Phase 4 native report — Tier 3 device attestation

## Environment

**This sandbox has no Android SDK, no `adb`, no emulator, no iOS
simulator, and no physical device.** This is the identical limitation
`phase-01-report.md` and `phase-03-report.md` recorded for their own Tier 3
work — it was true before this phase started and remains true now. No
device name, make, model, or OS version is given anywhere below, because
none was used. Every item in this document that requires a device is
marked **FAIL — not possible in this environment**, not skipped and not
guessed.

What follows is not a shrug. Everything that *is* achievable without a
device — the service architecture, the policy-delegation proof, the
Tier 1/Tier 2 evidence, the Maestro flow authored (but unexecuted) for the
next environment that has a toolchain — was built to the same rigor as
Phases 2 and 3. This document exists specifically to keep that work from
being mistaken for something it is not: a green Playwright run is not
native audio evidence (validation.md §4), and nothing below claims
otherwise.

## Results table

Device: **not applicable — no Android SDK, `adb`, emulator, iOS simulator,
or physical device exists in this execution environment.**

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Each of the 10 music states plays | **FAIL — not possible in this environment** | Tier 1 (audio-engine.test.ts) proves the engine resolves the correct file for all 10 states + `rewardScreen` via `resolveMusicFile`. Tier 2 (audio-lab.spec.ts) proves the web `HTMLAudioElement` engine actually starts each track in a real browser. Neither is native `expo-audio` playback. |
| 2 | Crossfade between two states: no gap, no overlap artefact | **FAIL — not possible in this environment** | The crossfade *call sequence* (fade out the leaving track, fade in the new one, no `pause()` before the new one starts) is unit-proven and structurally identical in both `webAudioEngine.ts` and `expoAudioEngine.ts`. Whether it is *audibly* gapless on a real device is unverifiable without one. |
| 3 | Each of the 22 SFX events plays | **FAIL — not possible in this environment** | Tier 1 proves every event maps through `SFX_FILES`/`shouldPlaySfx` correctly and reaches the (fake, in Tier 1; real HTMLAudioElement, in Tier 2) player when and only when policy allows it. Native `expo-audio` SFX playback is unverified. |
| 4 | Ducking audible for voicePrompt, listening, speaking | **FAIL — not possible in this environment** | `audio-engine.test.ts` proves the exact numeric duck targets from `audioPolicy.DUCK` are reached (using fake timers to let the ramp converge) for all three reasons. `audio-lab.spec.ts` proves the same convergence against a real browser's `HTMLAudioElement.volume`. Whether a human ear perceives this as "ducking" on a real device is unverified. |
| 5 | SFX silent while the child is speaking | **FAIL — not possible in this environment** | Proven exactly to `0` in Tier 1 (`duckMul.sfx === 0` while `speaking`) and again live in Tier 2. Real-device audibility unverified. |
| 6 | Rapid tapping never exceeds 3 concurrent SFX | **FAIL — not possible in this environment** | Tier 1 proves a 4th concurrent request never reaches the (fake) player while 3 are active, and becomes playable again the instant one ends. Tier 2 fires all 22 SFX in rapid succession against the real web engine with zero console errors. Native pool behaviour under real device audio latency is unverified. |
| 7 | `he-IL` TTS speaks | **FAIL — not possible in this environment** | `word-voice.test.ts` proves the resolution/gating logic exhaustively against a fake TTS port. `audio-lab.spec.ts` exercises the real `expo-speech` web shim in a real browser — see "Findings" below for what that shim actually does in headless Chromium. Real device `he-IL` speech is unverified. |
| 8 | Behaviour with no Hebrew voice installed | **FAIL — not possible in this environment** | The *decision* (resolve to `unavailable` with reason `no-hebrew-voice-installed`, never fall back to English) is unit-proven. Whether a real device with no Hebrew voice actually reports that voice list correctly to `expo-speech` is unverified. |
| 9 | Recording captures, stops at 4s, plays back | **FAIL — not possible in this environment** | `recording-service.test.ts` proves the 4000ms cap fires with fake timers even if `stop()` is never called, and that a normal cycle saves through the ports and returns a capped duration. `audio-lab.spec.ts` exercises the real `getUserMedia`/`MediaRecorder` web path (denied automatically by the headless browser — see "Findings"). Real microphone capture on a device is unverified. |
| 10 | Microphone permission denial handled without a crash | **PARTIAL — proven in two of three tiers, not on device** | Tier 1 proves `RecordingCore.start()` rejects cleanly (a catchable `Error`, not a native crash) on denial and stays usable afterward. Tier 2's `audio-lab.spec.ts` "recording start/stop reports a status without crashing" test is a *real* instance of this: Playwright/headless Chromium denies the microphone grant by default, and the real `WebRecordingPorts.requestPermission()` genuinely receives a real browser permission denial and surfaces it as a status string with zero page errors — this is real evidence, just not native evidence. Native permission-dialog behaviour is unverified. |
| 11 | Orientation lock on a phone | **FAIL — not possible in this environment** | The *policy* (which routes get which orientation) is centralised and unit-proven exhaustively (orientation-policy.test.ts). `expo-screen-orientation`'s actual native lock behaviour on a phone is unverified. |
| 12 | Orientation lock on iPad WITH multitasking enabled | **FAIL — not possible in this environment** | No iPad, no iPad simulator. This is the item the phase plan calls out by name as needing specific attention ("iOS may refuse an orientation lock entirely... test it, and report what actually happened") — nothing here reports what actually happened, because nothing ran. |
| 13 | Music pauses on background, resumes on foreground | **FAIL — not possible in this environment** | `AudioEngineCore.handleAppBackground()`/`handleAppForeground()` are unit-proven against a fake adapter (not shown as a named test above — implicit in the adapter contract, exercised structurally). `expoAudioEngine.ts` wires these to `AppState`; `webAudioEngine.ts` wires them to `visibilitychange`/`pagehide`. Neither a real backgrounding on a real OS, nor a real audio session surviving it, has been exercised. |
| 14 | Audio survives an incoming call / another app taking the session | **FAIL — not possible in this environment** | `expoAudioEngine.ts` configures `interruptionMode: 'duckOthers'` via `setAudioModeAsync` so the *intent* is recorded in code, but no interruption has ever actually been triggered. |
| 15 | Headphone connect/disconnect | **FAIL — not possible in this environment** | Not addressed by any code in this phase beyond relying on the OS's default audio-route behaviour; entirely unverified. |
| 16 | iOS silent-mode behaviour | **FAIL — not possible in this environment** | `playsInSilentMode: true` is configured in `expoAudioEngine.ts`'s `setAudioModeAsync` call so the *intent* is recorded, but no iOS device or simulator has ever run it. |

**16 of 16 real-device Tier 3 items: FAIL (not possible in this
environment), 1 partially strengthened by genuine (non-native) browser
evidence.** This mirrors exactly how `phase-01-report.md` and
`phase-03-report.md` handled the identical sandbox gap for their own Tier 3
lists — recorded honestly rather than inferred, guessed, or fabricated.

## Speech recognition POC

`src/services/speech/poc/heIlRecognitionPoc.ts`, isolated per
phase-04-plan.md — imported by no application code (verified: `grep -rn
"heIlRecognitionPoc" apps/mobile/app apps/mobile/src apps/mobile/tests`
finds only comments referencing the filename, in
`services/speech/index.ts` and `services/speech/SpeechRecognitionService.ts`,
never an `import`).

| Question | Answer |
|---|---|
| Does `expo-speech-recognition` install and resolve under this SDK? | **YES.** `expo-speech-recognition@57.0.0` is the exact dist-tag matching this project's Expo SDK 57 (`npm view expo-speech-recognition dist-tags` shows `sdk-56`/`sdk-55`/`sdk-54`/`sdk-53` as *separate* tags precisely because this ecosystem's main line has historically lagged current SDKs — the risk phase-04-plan.md names explicitly — and `57.0.0` is the unqualified `latest`, i.e. it has caught up). `npm ls expo-speech-recognition` confirms `57.0.0` resolved with no peer-dependency conflicts. |
| Does it build? | **YES.** `npx tsc --noEmit`, `npx eslint .`, `npx expo-doctor` (21/21) and `npx expo export --platform web` are all clean with the POC file and its config plugin (`app.config.ts`) present. The POC file itself is never reached by the web bundle (nothing imports it), so this proves compilation, not execution. |
| Does `he-IL` non-continuous single-word recognition return a result on Android? | **UNVERIFIED.** No Android SDK, `adb`, or emulator in this sandbox. `recognizeHeIlWord()` has never executed on any platform. |
| ...and on iOS? | **UNVERIFIED.** No iOS simulator or device. |
| Permission denial behaviour | **Implemented, unverified at runtime.** `recognizeHeIlWord()` calls `requestPermissionsAsync()` first and returns `{outcome: 'permission-denied'}` without throwing if not granted — this is the same never-throw discipline `word-voice.test.ts` and `recording-service.test.ts` prove for the other two services, but nothing exercises this specific code path (the POC is never invoked in this environment). |
| Behaviour with no recogniser available | **Implemented, unverified at runtime.** `ExpoSpeechRecognitionModule.isRecognitionAvailable()` is checked first; `false` short-circuits to `{outcome: 'unavailable'}`. The dev lab's own "run recognition" button *does* exercise the equivalent check live, in a real (headless) browser — see "Findings" below for what that returned. |
| Recommendation | **Ship the speech game (`GameId: 'speech'`) behind a feature flag until `recognizeHeIlWord()` is run for real on at least one Android and one iOS device.** Nothing here contradicts the library being viable — it installed cleanly, matches the SDK exactly, and the interface it exposes maps onto Talki's one narrow need (short, single-word, non-continuous, `he-IL`) without any adaptation. But "it compiles" is not "it works", and closing that gap needs hardware this environment does not have. This is exactly the legitimate "not viable yet, keep it behind a flag" outcome phase-04-plan.md anticipated as acceptable. |

## `.maestro/audio.yaml`

Authored at `apps/mobile/.maestro/audio.yaml`, automating: launch the app,
deep-link into `app/dev/audio-lab.tsx` via the `talki://` scheme (the
on-device equivalent of the web-only `e2eRouterBridge.ts`, since the screen
has no in-app link to tap), unlock and start the `home` music state,
background the app for 5 real seconds, foreground it, and confirm the
screen is still responsive with a follow-up tap. **Not executed** — no
Maestro binary and no device/emulator exist in this environment, the exact
gap `.maestro/smoke.yaml` (Phase 1) and `.maestro/persistence.yaml`
(Phase 3) already carry.

## Screenshots

The plan's manifest asks for:

```
docs/migration/screenshots/phase-04/
    <viewport>-audio-lab.png                x10
    android-device-audio-lab.png
    android-device-orientation-landscape.png
    android-device-recording-permission.png
    ios-device-audio-lab.png                if an iOS device is available
```

- The 10 `<viewport>-audio-lab.png` files: **PASS** — captured for real by
  `audio-lab.spec.ts`'s `captureMatrix(page, '04', 'audio-lab')`, one per
  viewport project, committed under
  `docs/migration/screenshots/phase-04/`.
- `android-device-audio-lab.png`, `android-device-orientation-landscape.png`,
  `android-device-recording-permission.png`, `ios-device-audio-lab.png`:
  **FAIL — not possible in this environment.** None of these is a device
  capture; none was fabricated. **None of the 10 web-viewport screenshots
  above is a substitute for a real device capture either** — they prove
  the diagnostic screen renders and is interactive in a browser, nothing
  about native audio, orientation, or the permission dialog they are named
  for.

## Findings — real (non-native) evidence worth recording

Two things surfaced during Tier 2 that are genuine facts about real
browser behaviour, not fabrications standing in for device evidence:

- **Headless Chromium (the browser Playwright drives here) denies the
  microphone permission grant by default**, so
  `WebRecordingPorts.requestPermission()`'s real `getUserMedia({audio:
  true})` call genuinely rejects every run of "recording start/stop
  reports a status without crashing" — `RecordingCore.start()` genuinely
  takes the `microphone-permission-denied` rejection path, and the screen
  genuinely stays interactive afterward. This is real permission-denial
  evidence, in a real (if not native) runtime — it just is not the native
  iOS/Android permission dialog item 10 above is about.
- **Headless Chromium commonly exposes zero `speechSynthesis` voices**,
  so `WordVoiceService.resolve()`'s step-3 TTS-availability check
  frequently (environment-dependently) resolves to `unavailable` rather
  than `tts` even without `degradeNativeApis()` forcing it — this is why
  `audio-lab.spec.ts`'s "word voice resolution runs end to end without
  throwing" test accepts either outcome rather than asserting `tts`
  specifically. Real device `he-IL` voice availability (item 7/8 above)
  is a separate, still-unverified question.

## Bottom line

Everything in this document that says FAIL says so because nothing ran —
not because something was tried and broke. The architecture (five service
interfaces, `AudioEngine` delegating every decision to the Phase-2-proven
`audioPolicy.ts`, centralised orientation policy, never-throw error
handling proven by fake-port unit tests) is sound and unit/Tier-2-proven to
the same standard as Phases 2 and 3. What it cannot do is stand in for a
real device. See phase-04-report.md's "TECHNICAL GO / NO-GO" section for
the recommendation this produces.
