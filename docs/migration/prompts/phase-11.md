# Phase 11 prompt — Speech practice and speech recognition

Plan: [../phases/phase-11-plan.md](../phases/phase-11-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 11 of the Talki migration to Expo React Native.

Phase 11 ports the six evidence-based practice modes and the speech game.
These are what make Talki a speech-therapy tool rather than a vocabulary app.
The legacy code labels them as such at index.html 3060-3061.

Execute ONLY Phase 11.

THE PORTING RULE HERE IS STRICTER THAN ANYWHERE ELSE IN THE MIGRATION.
Timings, thresholds and scoring rules are CLINICAL PARAMETERS, not UX
preferences. A five-second pause that becomes three seconds is not a tuning
change, it is a different intervention. Do not adjust a single number.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename or refactor index.html, audio-manager.js, assets/,
  tests/, android/, ios/, capacitor.config.ts or manifest.json.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Recognition and microphone are NOT testable on web.
  Do not let a green Playwright run stand in for native evidence.

FORBIDDEN
- No changing any clinical timing or threshold.
- No adding a failure state to any practice mode.
- No requiring correctness where legacy accepts any attempt.
- No removing the manual "open" path from temptation.
- No direct recognition-library import from a screen. Services only.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not build the parent centre, custom words or rewards. Phase 12.
- If you finish early, deepen the device testing. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-11-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-11-plan.md   — your plan, read it fully
2. docs/migration/phase-04-report.md        — the speech-recognition POC RESULT.
                                              Read it before you plan the
                                              speech game.
3. docs/migration/phase-10-report.md
4. index.html 3060-3061                     — the clinical labels
5. index.html:
     1597       CARRIERS
     1600-1609  CLOZE
     1612-1620  PAIRS
     1623-1628  MODIFIERS
     2018       SPEECH_VIEWS
     2218-2225  PRACTICE_LIST
     2515-2517  speech setup           2643-2661  renderSpeech
     2527-2529  focus setup            3065-3083  renderFocus
     2530-2531  cloze setup            3086-3125  renderCloze, runCloze, clozeNext
     2532-2533  temptation setup       3128-3146  renderTemptation
     2534-2536  receptive setup        3149-3166  setupReceptiveRound, renderReceptive
     2537-2539  pairs setup            3169-3186  setupPairsRound, renderPairs
     2540-2541  combine setup          3189-3201  renderCombine
     3590-3595  speech handlers        3841-3876  startListening
     3885-3917  listenForAnything

THE MOST IMPORTANT BEHAVIOURAL PROPERTY IN THIS PHASE:

EVERYTHING COUNTS AS AN ATTEMPT.
  - Temptation opens the jar on ANY sound, not on a correct word
    (index.html 3885-3917).
  - Cloze scores on the PARENT's judgement, not on recognition.
  - The hint text says it plainly: 'כל ניסיון נחשב — גם צליל, גם הברה אחת'
    (every attempt counts, including a sound, including a single syllable).

For a child with a speech delay, requiring correctness would make the app a
source of failure. Do not introduce correctness checks anywhere legacy does not
have them.

GROUND TRUTH — per mode

FOCUS — focused stimulation (2527-2529, 3065-3083)
    target   weightedPick(cat.items, cat.id, 1)[0]
    state    { it, step, total: CARRIERS.length }
    phrase   CARRIERS[step].replace('{w}', display(it.word))
    advance  tapping the picture speaks and advances
    done     a BESPOKE card, NOT doneCard, reading
             'המילה נשמעה {total} פעמים במשפטים שונים'
    title    '🎯 מילה במיקוד'

CLOZE — cloze plus expectant pause (2530-2531, 3086-3125)
    pool     shuffle(CLOZE).slice(0, 6)
    phases   'say' -> 'wait' -> 'model'
    say      speak the phrase
    wait     EXACTLY 5000 ms OF SILENCE
    model    speak answer, then phrase, then answer again
    scoring  the parent presses 'היא אמרה!'
    leaving  clearTimeout AND stopTTS
    done     doneCard(score, pool.length, 0, 'כל השלמה נחשבת')
    title    '⏸️ משלימים ביחד'

    THE 5000 ms IS THE INTERVENTION. It is uncomfortable for an adult watching,
    which is exactly why it works and exactly why someone will be tempted to
    shorten it. It does not change.

TEMPTATION — communication temptation (2532-2533, 3128-3146)
    pool      weightedPick(cat.items, cat.id, 6)
    mechanic  a closed jar; the child must vocalise to open it
    listening listenForAnything(), 8s timeout, ANY sound opens it
    manual    a 'לפתוח' button ALWAYS available — this is the design, not a
              testing fallback. A parent can always open the jar.
    done      doneCard(pool.length, pool.length, 0, 'הכול נפתח')
    title     '🫙 הצנצנת'
    NO FAILURE STATE. Everything opens eventually.

RECEPTIVE — receptive identification (2534-2536, 3149-3166)
    state    { level: 2, i, score, run, miss, locked }
    rounds   8
    options  level options: the target plus level-1 distractors
    adaptive level rises and falls with run and miss — READ THE EXACT
             THRESHOLDS FROM THE HANDLER, do not infer them
    columns  2 options -> 2 cols, 3 -> 3 cols, 4 or more -> 2 cols
    done     doneCard(score, 8, 0, `רמה ${level} אפשרויות`)
    title    '👈 תראי לי'
    No talking required. This is the mode a non-verbal child can always succeed at.

PAIRS — minimal pairs (2537-2539, 3169-3186)
    pool     shuffle(PAIRS).slice(0, 6)
    round    target is a RANDOM member of the pair; shown is the shuffled pair
    done     doneCard(score, pool.length, 0)
    title    '👂 דומה אבל לא'

COMBINE — two-word combinations (2540-2541, 3189-3201)
    state    { round, mod, phrase, pics: weightedPick(cat.items, cat.id, 3) }
    flow     choose a MODIFIERS word, then a picture, producing a phrase
    rounds   6
    done     doneCard(round, 6, 0, 'צירופים נבנו')
    title    '➕ שתי מילים'

SPEECH GAME (2515-2517, 2643-2661, 3590-3595, 3841-3876)
    pool        weightedPick(cat.items, cat.id, Math.min(6, cat.items.length))
    recognition he-IL, single word, Levenshtein distance <= 1
    skip        ALWAYS available
    unsupported an EXPLICIT screen (index.html 2646-2648), not a crash
    title       '🎤 תגידי את זה'

MUSIC: SPEECH_VIEWS (index.html 2018) is the set of views that switch to the
listening-focus profile. Every one of these modes is in it. The
'speechOrListeningTask' music state and the listening duck must engage while
the microphone is open.

WORK ITEMS

1. Build all six practice modes and the speech game exactly to the ground truth
   above.

2. Isolate the clinical constants in a single module (clozeTimings.ts or
   equivalent) so any change to them is visible in review, and write
   practice-timings.test.ts asserting:
     - cloze wait is exactly 5000
     - temptation listening timeout is exactly 8000
     - receptive is exactly 8 rounds
     - cloze, temptation and pairs pools are exactly 6

3. Implement the real recognition service, or a documented stub if Phase 4
   concluded it is not viable. If it is not viable: ship all six practice modes
   anyway, put the SPEECH GAME behind a feature flag defaulting off, and keep
   temptation fully usable through its manual open. Record the decision.

4. Every mode must work with recognition unavailable. Legacy already guards the
   speech game with an explicit unsupported screen and gives temptation a manual
   open beside the microphone. Preserve both.

5. Add every testId from the plan to src/testing/testIds.ts.

6. Tier 1 tests per the plan. The ones that matter most:

   cloze-reducer.test.ts
     - phases progress say -> wait -> model
     - the wait phase does NOT advance early
     - the model sequence is answer, phrase, answer
     - scoring is parent-driven, never recognition-driven
     - leaving clears the timer AND stops TTS
     - done after the pool is exhausted

   temptation-reducer.test.ts
     - ANY recognition result opens the jar, INCLUDING an empty or unrecognised
       one. Stub the service to return arbitrary content and assert the jar
       opens regardless.
     - the manual open works with no recognition at all
     - the 8-second timeout does NOT fail the round
     - no state can produce a failure

   receptive-reducer.test.ts
     - starts at level 2, option count equals level
     - level rises on a run and falls on misses, matching legacy EXACTLY in
       both directions
     - 8 rounds
     - column rule: 2 options -> 2, 3 -> 3, 4 or more -> 2

   levenshtein.test.ts
     - distance 0 accepted, 1 accepted, 2 rejected
     - Hebrew strings with and without niqqud
     - comparison uses the PLAIN form

   Plus focus, pairs and combine reducer tests.

7. Tier 2: one spec per mode plus the speech game, all ten viewports.
   Common: renders and fits in landscape; speechSpy proves the prompt speaks
   EXACTLY ONCE on entry; degradeNativeApis leaves the mode working with no TTS
   and no recognition; audits clean; no listener growth; toHaveScreenshot and
   captureMatrix per documented state.

   Mode-specific highlights:
     cloze      — all three phases visually distinct; the wait phase persists
                  for the FULL five seconds; the "she said it" button scores
     temptation — the jar opens on a stubbed recognition result of ANY content;
                  the manual open works; no failure state is reachable
     receptive  — the option count changes with level; the column layout
                  follows the rule
     speech     — with recognition stubbed unsupported, the explicit
                  unsupported screen shows and does not crash; skip always works

8. Tier 3 — THE SUBSTANCE. Recognition and microphone are not testable on web.
   Manual attestation with the device named:
     - he-IL recognition returns a result for a single word on Android
     - and on iOS, or a recorded statement that it does not
     - the temptation jar opens on a real child-like vocalisation such as "ba"
     - microphone permission denial leaves EVERY mode usable
     - the cloze five-second pause feels correct in real use
     - music ducks while listening and restores afterwards
     - all six modes plus the speech game work end to end on a device

9. Run the gate:
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
- Do not shorten the 5000 ms cloze pause.
- Do not shorten the 8000 ms temptation window.
- Do not require a correct word anywhere legacy accepts any sound.
- Do not add a failure state, a timer pressure or a losing condition.
- Do not remove temptation's manual open.
- Do not truncate a Hebrew carrier phrase to fit. Wrap or scale it — a
  truncated phrase defeats the intervention.
- Do not build the parent centre, custom words or rewards.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] All six practice modes work end to end
- [ ] The speech game works, or is flagged off with a recorded reason
- [ ] cloze wait is EXACTLY 5000 ms, asserted by test
- [ ] cloze models in the order answer, phrase, answer
- [ ] cloze scoring is parent-driven, never recognition-driven
- [ ] cloze clears its timer and stops TTS on leaving
- [ ] temptation opens on ANY sound, asserted with an arbitrary stub result
- [ ] temptation's manual open always works
- [ ] temptation timeout is 8000 ms and does not fail the round
- [ ] NO practice mode has a reachable failure state, asserted by test
- [ ] receptive: 8 rounds, adaptive level matching legacy in both directions
- [ ] receptive column rule 2 / 3 / 2 correct
- [ ] focus: CARRIERS.length steps and the BESPOKE done card, not doneCard
- [ ] pairs: 6 pairs, random target, shuffled display
- [ ] combine: 6 rounds, modifier plus picture builds the phrase
- [ ] speech: Levenshtein <= 1 on the plain form
- [ ] speech: skip always available
- [ ] speech: an explicit unsupported screen, not a crash
- [ ] Every mode speaks its prompt exactly once on entry, proven by speechSpy
- [ ] Every mode works under degradeNativeApis
- [ ] speechOrListeningTask music and the listening duck engage while listening
- [ ] Microphone permission denial leaves every mode usable
- [ ] Audits clean, no listener growth, no leaked timers
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 140 screenshots plus two device captures committed
- [ ] Recognition attested on a real device, or its absence recorded
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-11-report.md using the headings in
docs/migration/validation.md section 7.

Add a section "Clinical fidelity" confirming, one by one, that every timing and
threshold matches legacy exactly, and that no mode can be failed.

Add a final section "FEATURE PARITY GATE" listing what remains before parity can
be declared. Every child-facing feature now exists; say what is left.

Then stop. Do not begin Phase 12.
````
