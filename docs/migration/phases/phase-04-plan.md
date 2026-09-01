# Phase 4 — Native audio, TTS, recording and orientation services

**Prompt:** [../prompts/phase-04.md](../prompts/phase-04.md)
**Creates:** `apps/mobile/src/services/{audio,voice,recording,orientation,speech}/`
**Ships:** one developer-only diagnostic screen, not reachable from the product

---

## Goal and rationale

Solve the risky native platform capabilities before building screens that
depend on them.

The ordering here is the whole argument. Audio, TTS, recording, orientation and
speech recognition are the five things most likely to behave differently from
what a developer assumes, most likely to differ between Android and iOS, and
least likely to be caught by any automated test. If they are discovered to be
broken in Phase 11, eleven phases of work sit on top of a wrong abstraction.

This phase is therefore a proof, not a feature. Its output is five service
interfaces, one diagnostic screen that exercises them, and a report that says
plainly what worked on which device.

It is also the last phase before the technical go/no-go gate.

## Entry conditions

- `docs/migration/phase-03-report.md` exists with no critical FAIL.
- `audioPolicy.ts` exists from Phase 2 and passes its differential test.
- Recording storage exists from Phase 3.

## Design decisions

### Five services, no direct Expo imports anywhere else

```
AudioEngine                music, SFX, ducking, lifecycle
WordVoiceService           what a word sounds like
RecordingService           capture parent voice
OrientationService         per-route orientation policy
SpeechRecognitionService   interface only in this phase
```

No screen, game or domain module imports `expo-audio`, `expo-speech`,
`expo-screen-orientation` or any recognition library. This is not
architectural decoration; it is what lets Phase 11 swap the recognition
implementation without touching a game, and what lets the web target run at all.

### The policy is already ported, so AudioEngine is only the runtime

`assets/audio/audio-logic.js` is pure and became `audioPolicy.ts` in Phase 2,
verified by an exhaustive differential test. `AudioEngine` must not re-implement
any of that logic. It calls `shouldPlaySfx`, `computeDuckTarget`,
`resolveMusicFile`, `effectiveMusicVolume` and `effectiveSfxVolume` and does
only I/O: loading players, crossfading, animating duck ramps, and responding to
app lifecycle.

`audio-manager.js` is the reference for the runtime behaviour but not a port
target — it is built on `window.Audio()`, `requestAnimationFrame`,
`visibilitychange` and `pagehide`, none of which exist natively.

A rule worth stating explicitly: no component ever learns an MP3 filename. Game
code says `playSfx('answer.correct')`.

### Word voice resolution, in one place

```
1. parent recording for this exact catId:word
2. bundled Talki voice recording, if one exists
3. he-IL system TTS
```

Legacy implements steps 1 and 3 inside `say()` (index.html 1888-1987). Step 2
does not exist yet and has no assets. It is designed in now anyway, because the
long-term intent is to replace robotic system TTS with consistent recorded Talki
voice, and retrofitting a resolution step into a dozen game screens later is
exactly the kind of change this architecture exists to avoid. For now step 2
always misses.

`opts.core` must be carried over: it bypasses the `settings.voice` gate for
speech that is essential rather than decorative.

### Orientation is centralised policy, not scattered calls

```ts
export const orientationPolicy = {
  intro: 'responsive',
  home: 'responsive',
  category: 'responsive',
  games: 'landscape',
  practice: 'landscape',
} as const;
```

One module owns this. No game calls `lockAsync` itself. That way the landscape
decision can be revisited product-wide without touching eleven game screens.

This is a **deliberate deviation from parity**: the legacy app hard-locks
portrait at index.html 4088 and in `manifest.json`. Recorded in checklist
section 14.

iPad needs specific attention. When an iPad app supports multitasking, iOS may
refuse an orientation lock entirely. The app config must be set so the lock is
honoured, and the report must state what actually happened on a real iPad or
simulator.

### Speech recognition is proven in isolation and integrated nowhere

`SpeechRecognitionService` is defined as an interface. A separate, isolated
proof-of-concept establishes whether `he-IL` single-word recognition works on
the current Expo SDK.

The reason for the caution: the commonly used package's published line has
lagged the SDK, and there have been Android issues around continuous
recognition. Talki needs exactly one narrow capability — short single-word
`he-IL`, non-continuous — and that is a much easier target than a general voice
interface.

If the library is unstable, the finding is documented and the interface stands.
What must not happen is a library problem propagating into game code or, worse,
a decision to downgrade the whole application architecture to accommodate one
optional capability.

### A diagnostic screen, deliberately unreachable

`app/dev/audio-lab.tsx` exercises every service: play each music state, fire
each of the 22 SFX events, speak a word through each resolution step, record and
play back, toggle the orientation lock, and run the recognition POC.

It exists because "does ducking work?" cannot be answered by a unit test and
should not require building a game first. It must not be reachable from any
child-facing navigation.

## Legacy source mapping

| Behaviour | Legacy location |
|---|---|
| Pure audio policy | assets/audio/audio-logic.js |
| Music crossfade, SFX pool, duck animation | audio-manager.js |
| `unlock()` first-gesture pattern | audio-manager.js |
| Visibility and pagehide lifecycle | audio-manager.js |
| Audio unlock gate on first tap | index.html 4068-4084 |
| `say(catId, word, opts)` resolution | index.html 1888-1987 |
| `speakTTS()`, `pickVoice()`, iOS keep-alive | index.html 1888-1987 |
| TTS `lang='he-IL'`, `rate=settings.rate`, `pitch=1.1` | index.html 1888-1987 |
| `preloadRecs(catId)` | index.html 3921-3927 |
| Recording via MediaRecorder, 4s cap | index.html 3919-3957 |
| `startListening()` single-word match | index.html 3841-3876 |
| `listenForAnything()` 8s timeout | index.html 3885-3917 |
| Portrait lock (the deviation) | index.html 4088-4090 |
| Wake lock | index.html 4085-4087 |
| `SPEECH_VIEWS` music profile | index.html 2018 |

## Files to be created

```
apps/mobile/src/services/audio/
├── AudioEngine.ts            the interface
├── expoAudioEngine.ts        expo-audio implementation
├── webAudioEngine.ts         HTMLAudioElement, test surface only
└── index.ts

apps/mobile/src/services/voice/
├── WordVoiceService.ts
├── expoSpeechVoice.ts        he-IL TTS
└── index.ts

apps/mobile/src/services/recording/
├── RecordingService.ts
└── expoRecording.ts          writes through Phase 3 recordingStore

apps/mobile/src/services/orientation/
├── OrientationService.ts
├── policy.ts                 the route-to-orientation map
└── index.ts

apps/mobile/src/services/speech/
├── SpeechRecognitionService.ts   interface only
└── poc/heIlRecognitionPoc.ts     isolated, not imported by app code

app/dev/audio-lab.tsx
apps/mobile/tests/unit/audio-engine.test.ts
apps/mobile/tests/unit/word-voice.test.ts
apps/mobile/tests/unit/orientation-policy.test.ts
apps/mobile/tests/e2e/audio-lab.spec.ts
apps/mobile/.maestro/audio.yaml
docs/migration/phase-04-native-report.md
```

## Contracts introduced

```ts
export interface AudioEngine {
  unlock(): Promise<void>;
  setMusicState(state: MusicStateKey | 'rewardScreen' | null): Promise<void>;
  playSfx(event: SfxEvent): void;
  setListening(on: boolean): void;
  setChildSpeaking(on: boolean): void;
  setVoicePromptPlaying(on: boolean): void;
  setMusicEnabled(on: boolean): void;
  setSfxEnabled(on: boolean): void;
  setMusicVolumeMultiplier(v: number): void;
  stopMusic(fadeOutMs?: number): Promise<void>;
  stopAll(): Promise<void>;
  debugState(): AudioDebugState;   // mirrors legacy _debugState()
}

export interface WordVoiceService {
  say(catId: CategoryId, word: string, opts?: { core?: boolean }): Promise<void>;
  cancel(): void;
  resolve(catId: CategoryId, word: string): Promise<VoiceSource>;
  preload(catId: CategoryId): Promise<void>;
}

export type VoiceSource =
  | { kind: 'parentRecording'; uri: string }
  | { kind: 'bundledVoice'; uri: string }
  | { kind: 'tts'; text: string }
  | { kind: 'unavailable'; reason: string };

export interface RecordingService {
  isAvailable(): Promise<boolean>;
  requestPermission(): Promise<'granted' | 'denied' | 'undetermined'>;
  start(catId: CategoryId, word: string): Promise<void>;
  stop(): Promise<{ uri: string; durationMs: number }>;
  cancel(): Promise<void>;
  maxDurationMs: number;   // 4000, matching legacy
}

export interface OrientationService {
  applyFor(route: RouteKind): Promise<void>;
  unlock(): Promise<void>;
  current(): Promise<'portrait' | 'landscape'>;
}

export interface SpeechRecognitionService {
  isSupported(): Promise<boolean>;
  requestPermission(): Promise<'granted' | 'denied' | 'undetermined'>;
  recognizeOnce(opts: { lang: 'he-IL'; timeoutMs: number }): Promise<RecognitionResult>;
  abort(): void;
}
```

`debugState()` deliberately mirrors legacy `_debugState()`, which
`tools/audio-check.js` already uses to assert duck flags and music profiles.
Keeping the shape means those assertions port over.

## Behaviour to preserve exactly

- All 22 semantic SFX event names.
- Duck priority speaking > listening > voicePrompt.
- Duck values: voicePrompt `{music 0.32, sfx 0.55, attack 100, release 350}`;
  listening `{0.18, 0.25, 120, 450}`; speaking `{0.08, 0.0, 80, 500}`.
- Speaking hard-mutes SFX to exactly 0.
- SFX blocked entirely while the child is speaking.
- Cooldowns 60 / 400 / 800 ms by event class.
- At most 3 simultaneous SFX.
- `rewardScreen` reuses the home track at multiplier 0.72.
- Base volumes master 1.0, music 0.42, sfx 0.78, voicePrompt 1.0.
- Volumes clamp to `[0, 1]`.
- TTS `he-IL`, rate from settings, pitch 1.1.
- `opts.core` bypasses the `settings.voice` gate.
- Recording capped at 4000 ms.
- Music pauses on background and resumes on foreground.

## Deliberate deviations

- Landscape for game and practice routes. Legacy is portrait-locked.
- A `bundledVoice` resolution step that currently always misses.

## Test plan

### Tier 1

`audio-engine.test.ts` — against a fake player, asserting the engine defers to
`audioPolicy` rather than deciding for itself:
- a blocked SFX per `shouldPlaySfx` never reaches the player
- duck targets come from `computeDuckTarget`, not from engine-local constants
- music state changes resolve through `resolveMusicFile`
- `rewardScreen` applies the 0.72 multiplier
- `stopAll()` clears every duck flag
- more than 3 concurrent SFX requests do not create a 4th player

`word-voice.test.ts`:
- resolution order: parent recording, then bundled, then TTS
- with no recording and no bundled voice, resolves to `tts`
- with TTS unavailable, resolves to `unavailable` with a reason and does not
  throw
- `core: true` speaks even when `settings.voice` is false
- `core` absent and `settings.voice` false does not speak

`orientation-policy.test.ts`:
- every game route maps to landscape
- every practice route maps to landscape
- home, category and intro map to responsive
- an unknown route falls back to responsive rather than throwing

### Tier 2

`audio-lab.spec.ts` at all ten viewports:
- the lab screen renders and every control is present
- the web audio engine plays and stops without a console error
- `debugState()` reports the expected duck flags after each toggle
- `captureMatrix(page, '04', 'audio-lab')`

Also fill in the two helpers stubbed in Phase 1:
- `speechSpy(page)` — records `WordVoiceService.say` calls so later phases can
  assert "speaks exactly once on entry"
- `degradeNativeApis(page)` — forces every service into its unavailable state,
  mirroring legacy `STRIP_AUDIO`

Both must be exercised by a spec in this phase so later phases inherit working
helpers rather than untested ones.

### Tier 3 — the substance of this phase

Nothing about real audio is provable on web. The report must contain a results
table filled in on a real device, naming make, model and OS version, covering:

- each of the 10 music states plays
- crossfade between two states has no gap and no overlap artefact
- each of the 22 SFX events plays
- ducking is audible during a voice prompt, during listening, during speaking
- SFX is silent while the child is speaking
- rapid tapping does not exceed 3 concurrent SFX
- `he-IL` TTS speaks; and what happens on a device with no Hebrew voice
  installed
- recording captures, stops at 4 s, and plays back
- microphone permission denial is handled without a crash
- orientation lock works on phone, and on iPad with multitasking enabled
- music pauses on background and resumes on foreground
- audio survives an incoming call or another app taking the audio session
- headphone connect and disconnect
- silent-mode behaviour on iOS

`.maestro/audio.yaml` automates what it can: launch, open the lab, trigger
music, background the app, foreground it, assert still playing.

### Speech recognition POC — a separate, honest result

Run in isolation. Report:
- does the package install and build on this SDK
- does `he-IL` non-continuous single-word recognition return a result on Android
- and on iOS
- permission denial behaviour
- behaviour with no recogniser available
- a recommendation, which may legitimately be "not viable, keep the speech game
  behind a feature flag"

The POC must not be imported by any application code.

## Screenshot manifest

```
docs/migration/screenshots/phase-04/
    <viewport>-audio-lab.png                x10
    android-device-audio-lab.png
    android-device-orientation-landscape.png
    android-device-recording-permission.png
    ios-device-audio-lab.png                if an iOS device is available
```

## Risks and open questions

**Reanimated is not needed here.** Duck ramps can be driven by the audio
library's own volume interpolation or a simple timer. Default: do not introduce
a Reanimated dependency into the audio engine. Phase 6 is the first animation
phase.

**`expo-audio` API surface may differ from `audio-manager.js` assumptions.**
Default: preserve the *semantics* — crossfade, pooling, ducking, lifecycle —
and let the implementation differ. Record any semantic that cannot be
reproduced.

**No Hebrew TTS voice on the test device.** This is a real user scenario, not
a test-environment problem. Default: handle it as `unavailable` with a reason,
verify the app stays usable, and record it. Do not silently fall back to
English.

**Speech recognition may not work at all.** Default: document and stop. Do not
patch the library, do not vendor a fork, and do not change the SDK version. If
it is unviable, Phase 11 ships the speech game behind a flag and everything
else proceeds.

**iPad orientation lock may be refused.** Default: configure the app so the
lock is honoured, test it, and if iOS still refuses, record it and design the
game layouts to tolerate portrait rather than assuming landscape.

## Exit criteria

- [ ] Five service interfaces exist; no screen imports an Expo native module
      directly
- [ ] `AudioEngine` delegates every decision to `audioPolicy`, asserted by test
- [ ] All 22 SFX events and 10 music states play on a real device
- [ ] Ducking verified audibly for all three reasons
- [ ] SFX silent while the child is speaking, verified on device
- [ ] `he-IL` TTS verified, including no-Hebrew-voice behaviour
- [ ] Recording captures, caps at 4 s, plays back, and stores through Phase 3
- [ ] Microphone permission denial handled without a crash
- [ ] Orientation policy centralised; no `lockAsync` call outside the service
- [ ] Landscape lock verified on a phone and on an iPad or iPad simulator
- [ ] Background and foreground behaviour verified
- [ ] `speechSpy` and `degradeNativeApis` implemented and exercised by a spec
- [ ] Speech recognition POC run in isolation with an honest recommendation
- [ ] The POC is imported by no application code
- [ ] Dev lab is not reachable from child-facing navigation
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] Screenshots committed including at least one real device capture
- [ ] `docs/migration/phase-04-native-report.md` written with the device table
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-04-report.md` written

**This phase ends at the technical go/no-go gate.** If audio, TTS, recording or
orientation cannot be made to work reliably, that is the moment to say so.
