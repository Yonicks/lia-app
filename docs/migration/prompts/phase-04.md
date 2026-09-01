# Phase 4 prompt — Native audio, TTS, recording and orientation

Plan: [../phases/phase-04-plan.md](../phases/phase-04-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 4 of the Talki migration to Expo React Native.

Phase 4 is a native-capability PROOF, not a feature. It builds five service
interfaces and one developer-only diagnostic screen, and it produces an honest
report of what actually worked on a real device.

Execute ONLY Phase 4.

This phase is deliberately before any screen work. Audio, TTS, recording,
orientation and speech recognition are the five things most likely to behave
differently from what a developer assumes and least likely to be caught by an
automated test. If they are wrong, it must be discovered now, not in Phase 11
with eleven phases stacked on top.

Phase 4 ends at the TECHNICAL GO / NO-GO gate. If something cannot be made to
work reliably, saying so is a successful outcome for this phase.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename or refactor index.html, audio-manager.js, assets/,
  tests/, android/, ios/, capacitor.config.ts or manifest.json.
- Do not edit legacy source to make a new test pass.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Do not make a decision for the browser's benefit.
- Almost nothing in this phase is provable on web. Say so plainly and do not
  let a green Playwright run stand in for native evidence.

FORBIDDEN
- No direct expo-audio, expo-speech, expo-screen-orientation or speech
  recognition import from any screen, game or domain module. Everything goes
  through a service in src/services/.
- No component ever learns an MP3 filename. Game code says
  playSfx('answer.correct').
- No re-implementation of audio policy. It was ported and proven in Phase 2.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not build Home, categories, games, practice or the design system.
- Do not integrate speech recognition into any game.
- If you finish early, deepen the device testing. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-04-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
- The native-coverage section MUST name make, model and OS version.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-04-plan.md   — your plan, read it fully
2. docs/migration/validation.md             — especially section 4
3. docs/migration/phase-03-report.md        — the recording storage you write into
4. assets/audio/audio-logic.js              — the policy, already ported in Phase 2
5. audio-manager.js                         — the RUNTIME reference. Do not port it
                                              literally; it is built on window.Audio(),
                                              requestAnimationFrame, visibilitychange
                                              and pagehide, none of which exist natively
6. tools/audio-check.js                     — the _debugState() assertions you mirror
7. index.html:
     1888-1987  say(), speakTTS(), pickVoice(), iOS keep-alive
     2018       SPEECH_VIEWS
     3841-3876  startListening()
     3885-3917  listenForAnything()
     3919-3957  recording, MediaRecorder, 4s cap
     3921-3927  preloadRecs()
     4068-4084  first-gesture audio unlock
     4085-4090  wake lock and the PORTRAIT lock you are deliberately replacing

GROUND TRUTH — these numbers come from assets/audio/audio-logic.js. Do not
retype them from memory and do not adjust them.

Base volumes:    master 1.0, music 0.42, sfx 0.78, voicePrompt 1.0
Cooldowns (ms):  tap 60, answer 400, celebration 800
MAX_SIMULTANEOUS_SFX = 3
REWARD_SCREEN_MUSIC_MULTIPLIER = 0.72

Ducking, priority speaking > listening > voicePrompt:
    voicePrompt   music 0.32   sfx 0.55   attack 100   release 350
    listening     music 0.18   sfx 0.25   attack 120   release 450
    speaking      music 0.08   sfx 0.00   attack  80   release 500
Speaking HARD-MUTES sfx to exactly 0, and shouldPlaySfx blocks all SFX while
the child is speaking.

NEVER_COMBINE:
    answer.correct   + game.levelComplete
    reward.unlock    + game.levelComplete
    reward.confetti  + game.levelComplete

22 SFX events:
    ui.primaryTap ui.secondaryTap ui.cardAppear ui.backOrClose ui.swipe
    interaction.dragPickup interaction.dragDrop interaction.correctMatch
    interaction.invalidMove
    answer.correct answer.retry
    reward.star reward.unlock reward.confetti
    game.levelStart game.levelComplete game.countdownTick game.countdownGo
    system.softAttention
    speech.listeningReady speech.recognized speech.finished

10 music states:
    home gameplay_playroom_a gameplay_playroom_b gameplay_discoveries_a
    gameplay_discoveries_b gameplay_parade_a gameplay_parade_b
    gameplay_carousel_a gameplay_carousel_b speechOrListeningTask
Plus 'rewardScreen', which reuses the home track at 0.72.
Note: music/02, 03 and 04 exist on disk and are intentionally UNMAPPED. Leave
them unmapped.

TTS (index.html 1888-1987): lang 'he-IL', rate from settings.rate, pitch 1.1.
opts.core === true bypasses the settings.voice gate for essential speech.

Recording: capped at 4000 ms (index.html 3919-3957).

WORK ITEMS

1. Build five services under apps/mobile/src/services/. Interfaces exactly as
   specified in the plan:
     AudioEngine               audio/
     WordVoiceService          voice/
     RecordingService          recording/
     OrientationService        orientation/
     SpeechRecognitionService  speech/    (interface ONLY this phase)

2. AudioEngine is a RUNTIME ONLY. audioPolicy.ts was ported and proven by an
   exhaustive differential test in Phase 2. The engine must call into it:
     shouldPlaySfx, computeDuckTarget, resolveMusicFile,
     effectiveMusicVolume, effectiveSfxVolume, cooldownFor, releaseDurationFor
   It must NOT contain its own copy of any duck value, cooldown or volume.
   Your test asserts this by proving a blocked SFX never reaches the player.

   Implement: expo-audio for native, an HTMLAudioElement engine for the web
   test surface. Preserve the SEMANTICS from audio-manager.js — crossfade,
   SFX pooling capped at 3, duck ramps with attack and release, first-gesture
   unlock, pause on background and resume on foreground — while letting the
   implementation differ.

   Expose debugState() mirroring the legacy _debugState() shape, because
   tools/audio-check.js already asserts against it and those assertions port.

3. WordVoiceService resolves in this order:
     1. parent recording for this exact catId:word
     2. bundled Talki voice recording, if one exists
     3. he-IL system TTS
   Step 2 has no assets yet and will always miss. Build it anyway — the
   long-term intent is to replace robotic TTS with recorded Talki voice, and
   retrofitting a resolution step into a dozen game screens later is exactly
   what this architecture exists to prevent.

   Carry over opts.core. Handle "no Hebrew voice on this device" as a real user
   scenario: resolve to unavailable with a reason, keep the app usable, and do
   NOT silently fall back to English.

4. RecordingService: capture through expo-audio, cap at 4000 ms, write through
   the Phase 3 recording store. Handle permission denial without a crash.

5. OrientationService with a CENTRALISED policy module:
     intro     responsive
     home      responsive
     category  responsive
     games     landscape
     practice  landscape
   No game may call lockAsync itself. An unknown route falls back to
   responsive rather than throwing.

   NOTE: this is a DELIBERATE DEVIATION from parity. The legacy app hard-locks
   portrait at index.html 4088 and in manifest.json. It is recorded in
   feature-parity-checklist.md section 14. Do not "restore" portrait.

   iPad needs specific attention: when multitasking is enabled iOS may refuse
   an orientation lock. Configure the app so the lock is honoured, test it, and
   report what actually happened.

6. Build app/dev/audio-lab.tsx — a developer-only diagnostic screen that can
   trigger every music state, every one of the 22 SFX events, each voice
   resolution step, record and play back, toggle the orientation lock, and run
   the recognition POC. It must NOT be reachable from any child-facing
   navigation.

7. Fill in the two helpers stubbed in Phase 1, and exercise both with a spec in
   this phase so later phases inherit working helpers:
     speechSpy(page)          records WordVoiceService.say calls, so later
                              phases can assert "speaks exactly once on entry"
                              (mirrors SPEECH_SPY in tests/interaction_suite.py)
     degradeNativeApis(page)  forces every service into its unavailable state
                              (mirrors STRIP_AUDIO in tests/interaction_suite.py)

8. Tier 1 tests: audio-engine.test.ts, word-voice.test.ts,
   orientation-policy.test.ts, per the plan.

9. Tier 2: apps/mobile/tests/e2e/audio-lab.spec.ts at all ten viewports, plus
   captureMatrix(page, '04', 'audio-lab').

10. Tier 3 — THE SUBSTANCE OF THIS PHASE. Nothing about real audio is provable
    on web. Write docs/migration/phase-04-native-report.md with a results table
    filled in on a REAL DEVICE, naming make, model and OS version, covering:
      - each of the 10 music states plays
      - crossfade between two states: no gap, no overlap artefact
      - each of the 22 SFX events plays
      - ducking audible for voicePrompt, listening and speaking
      - SFX silent while the child is speaking
      - rapid tapping never exceeds 3 concurrent SFX
      - he-IL TTS speaks
      - behaviour on a device with NO Hebrew voice installed
      - recording captures, stops at 4 s, plays back
      - microphone permission denial handled without a crash
      - orientation lock on a phone
      - orientation lock on iPad WITH multitasking enabled
      - music pauses on background and resumes on foreground
      - audio survives an incoming call or another app taking the session
      - headphone connect and disconnect
      - iOS silent-mode behaviour

    Also write apps/mobile/.maestro/audio.yaml automating what it can:
    launch, open the lab, start music, background, foreground, assert playing.

11. Speech recognition POC, in isolation, at
    src/services/speech/poc/heIlRecognitionPoc.ts. It must be imported by NO
    application code.

    Report honestly:
      - does the package install and build on this SDK
      - does he-IL NON-CONTINUOUS single-word recognition return a result on
        Android
      - and on iOS
      - permission denial behaviour
      - behaviour with no recogniser available
      - a recommendation

    "Not viable, keep the speech game behind a feature flag" is a legitimate
    and useful answer. Do NOT patch the library, vendor a fork, or change the
    Expo SDK version to accommodate it. Do NOT let a library problem propagate
    into game code.

12. Run the gate:
      cd apps/mobile
      npx tsc --noEmit && npx eslint . && npx expo-doctor
      npx vitest run
      npx expo export --platform web
      npx playwright test
    Then from the repository root:
      node tools/dev-server.js &
      BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
      BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
      node --test tests/audio-logic.test.js

DO NOT
- Do not build Home, categories, games, practice or the design system.
- Do not integrate speech recognition into a game.
- Do not introduce Reanimated into the audio engine. Duck ramps can use the
  audio library's own volume interpolation or a timer. Phase 6 is the first
  animation phase.
- Do not restore the portrait lock.
- Do not report a green Playwright run as evidence of native audio.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] Five service interfaces exist; no screen imports an Expo native module
      directly
- [ ] AudioEngine delegates every decision to audioPolicy, proven by a test
      showing a blocked SFX never reaches the player
- [ ] No duck value, cooldown or volume constant is duplicated in the engine
- [ ] All 22 SFX events play on a real device
- [ ] All 10 music states play on a real device
- [ ] Crossfade has no gap and no overlap artefact
- [ ] Ducking verified audibly for all three reasons
- [ ] SFX silent while the child is speaking, verified on device
- [ ] Never more than 3 concurrent SFX under rapid tapping
- [ ] he-IL TTS verified on device
- [ ] No-Hebrew-voice behaviour verified and does not fall back to English
- [ ] opts.core bypasses the settings.voice gate
- [ ] Recording captures, caps at 4000 ms, plays back, stores via Phase 3
- [ ] Microphone permission denial handled without a crash
- [ ] Orientation policy centralised; no lockAsync outside the service
- [ ] Landscape verified on a phone
- [ ] Landscape verified on iPad or iPad simulator with multitasking enabled
- [ ] Background and foreground behaviour verified
- [ ] speechSpy and degradeNativeApis implemented AND exercised by a spec
- [ ] Speech recognition POC run in isolation, honest recommendation given
- [ ] The POC is imported by no application code
- [ ] app/dev/audio-lab.tsx is unreachable from child-facing navigation
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] Screenshots committed, including at least one real device capture
- [ ] phase-04-native-report.md written with the full device results table
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-04-report.md using the headings in
docs/migration/validation.md section 7.

Add a final section titled "TECHNICAL GO / NO-GO" giving a clear
recommendation: proceed, proceed with a named caveat, or stop. This is the gate
this phase exists to inform. If audio, TTS, recording or orientation cannot be
made reliable, saying so here is the correct and valuable outcome.

Then stop. Do not begin Phase 5.
````
