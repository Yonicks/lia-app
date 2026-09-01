# Phase 8 prompt — Game platform and first full game (quiz)

Plan: [../phases/phase-08-plan.md](../phases/phase-08-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 8 of the Talki migration to Expo React Native.

Phase 8 establishes the pattern that ten more games will follow, and proves it
by shipping ONE game end to end: quiz.

Execute ONLY Phase 8. Build the shell and quiz. No other game.

Everything shared by all eleven games — round lifecycle, scoring, audio cues,
the completion card, the landscape lock, the back affordance, rapid-tap
protection — gets built once, here. If it is instead discovered game by game,
the first three games each invent their own version and the shared abstraction
gets extracted from whichever one happened to be written last.

This phase ends at the ARCHITECTURE GO / NO-GO gate. Phases 9, 10 and 11 stack
sixteen more screens on whatever you decide here, so this is the last cheap
moment to change the pattern.

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

FORBIDDEN
- No global store for transient per-game state.
- No direct expo-audio, expo-speech or expo-screen-orientation import from a
  game. Services only.
- No lockAsync call in game code. OrientationService owns orientation.
- No game-local copy of the done-card star thresholds.
- No redesign of game rules.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Build the shell and quiz ONLY. Do not build memory, missing, match, cards,
  sounds, count, sort, bubbles, puzzle or speech.
- If you finish early, deepen the tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-08-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-08-plan.md   — your plan, read it fully
2. docs/migration/validation.md
3. docs/migration/phase-07-report.md
4. index.html:
     1845       STAR_STEP
     1869-1877  weightedPick()
     1878-1883  markSeen()
     2480-2486  gameHeader(), chips()
     2489-2490  MIN_ITEMS
     2491-2551  startGame()
     2552-2555  launch() and the toast
     2557-2568  setupQuizRound()
     2569-2571  nextQuiz()
     2572-2581  renderQuiz()
     3204-3208  doneCard() and the star tiers
     3451       celebrate() every 10th word
     3488-3510  quiz handlers
5. tests/interaction_suite.py — the rapid-tap and single-speak tests you mirror

GROUND TRUTH

startGame(type, catId) (index.html 2491-2551) does FOUR things before any
game-specific setup, and all four matter:
  1. need = MIN_ITEMS[type] || 4
  2. if the requested category has fewer than `need` items, fall back to the
     FIRST category that has enough
  3. if no category qualifies: go home, return false. The caller toasts
     'צריך לפחות 4 מילים בקטגוריה'
  4. fire AudioManager.playSfx('game.levelStart')

WHAT IT DOES NOT DO: it does not write lia:lastcat. Only enterCat() does
(index.html 1823). A game's category fallback must NOT change where Continue
Learning points. Assert this explicitly — it is a subtle cross-feature
regression that no game-level test would catch.

Quiz, from the legacy code:
  pool     weightedPick(cat.items, cat.id, Math.min(8, cat.items.length))
  state    { type, catId, pool, i, score, streak, best, locked, done }
  round    target  = pool[i]
           others  = shuffle(cat.items.filter(i => i.word !== target.word)).slice(0,3)
           options = shuffle([target, ...others])
           locked  = false
           asked   = false
  done     when i >= pool.length, fire 'game.levelComplete'
  chips    `שאלה ${i+1}/${pool.length}`, `✅ ${score}`, `🔥 רצף ${streak}`
  title    '🎧 איפה ה...?'
  replay   a button re-speaks the target

`asked` is the flag that makes the prompt speak EXACTLY ONCE per round. It is
easy to drop and produces a game that talks over itself.

`locked` is set on every answer to stop a second tap being counted while
feedback plays. It is the mechanism protecting against exactly the rapid-tap
behaviour tests/interaction_suite.py tests for. It belongs in the SESSION HOOK,
not copied into each game.

doneCard star tiers (index.html 3204-3208):
    >= 85%  three stars
    >= 50%  two stars
    else    one star

MIN_ITEMS.quiz is 4. A missing key defaults to 4.

WORK ITEMS

1. Build the game shell under src/features/games/shell/:
     GameShell         header, back, chips, completion card, orientation,
                       audio state
     useGameSession    start, round advance, lock, score, streak, done
     DoneCard          the shared star tiers, used by all eleven games
     gameRegistry      id -> GameDefinition

   A game supplies its board and its answer rules. It does NOT supply its own
   header, its own done card, or its own orientation call.

2. Per-game state lives in a reducer owned by the game screen. It NEVER enters
   Zustand. Zustand holds progress and settings, which outlive a screen; a quiz
   round does not. Putting it in a global store creates a stale-state bug that
   is invisible until a child leaves a game mid-round and comes back, which is
   exactly what children do.

   The only thing crossing the boundary is the OUTCOME: markSeen() and the
   learned set, through the progress store.

3. Reducers must be PURE and take randomness from an injected source in
   GameInitContext, so a test can make a round deterministic. Do NOT stub
   Math.random globally; that makes failures non-reproducible.

4. Lock landscape through OrientationService using the Phase 4 policy map. No
   game calls lockAsync. This is where the deliberate portrait-to-landscape
   deviation first becomes visible to a child, so it is also where the layout
   consequences first appear.

5. Build quiz exactly to the ground truth above, in
   src/features/games/quiz/.

6. Add every testId from the plan to src/testing/testIds.ts:
     game-shell-root, game-header-back, game-header-title, game-chip-<index>,
     game-done-card, game-done-stars, game-done-replay, game-done-home,
     quiz-root, quiz-prompt, quiz-replay, quiz-option-<index>,
     quiz-option-correct, quiz-option-wrong

7. Tier 1: game-session.test.ts, quiz-reducer.test.ts, done-card.test.ts.

   Must include:
     - MIN_ITEMS gate and category fallback for EVERY game id, not just quiz
     - no qualifying category returns false and does not throw
     - startGame does NOT write lia:lastcat
     - locked blocks a second answer until the round advances
     - pool size is min(8, items.length)
     - exactly four options, exactly one correct
     - distractors never duplicate the target and come from the same category
     - options are shuffled: over many seeded runs the correct answer is not
       always in the same position
     - correct increments score and streak; wrong resets streak to 0
     - best tracks the highest streak seen
     - done at i >= pool.length
     - the reducer is pure: same state + same action + same seed = same result
     - star tiers at every boundary: 100% three, 85% three, 84% two, 50% two,
       49% one, 0% one

8. Tier 2: apps/mobile/tests/e2e/quiz.spec.ts at all ten viewports. This is
   where landscape first matters.
     - the quiz renders with four options
     - the option grid fits WITHOUT SCROLLING at 1280x800 and at 320x568
     - speechSpy proves the prompt speaks EXACTLY ONCE on round entry
     - the replay button speaks again
     - burst(page, 'quiz-option-0', 10) advances exactly ONE round and scores ONCE
     - a FULL PLAYTHROUGH of all rounds reaches the done card
     - the done card shows the expected star count for a known score
     - back from mid-game returns to the games menu without a crash
     - degradeNativeApis: the quiz is still fully playable with no audio
     - auditTouchTargets and auditReachability clean
     - countListeners shows no growth across ten rounds
     - toHaveScreenshot() on the board and on the done card
     - captureMatrix for every state in the manifest

9. Tier 3: apps/mobile/.maestro/quiz.yaml, plus manual attestation with the
   device named:
     - landscape lock engages on entry and RELEASES on exit
     - rotating the device mid-game does not lose the round
     - the prompt is audible and speaks once
     - backgrounding mid-round and returning leaves the round intact
     - rapid toddler tapping cannot double-score

10. Run the gate:
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
- Do not build any game other than quiz.
- Do not change any game rule.
- Do not put round state in Zustand.
- Do not copy the star thresholds into the quiz.
- Do not stub Math.random globally.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] GameShell and useGameSession exist and quiz uses them
- [ ] Per-game state is local; nothing transient entered the global store
- [ ] MIN_ITEMS gate and category fallback behave exactly as legacy, for every
      game id
- [ ] startGame does NOT write lia:lastcat, asserted by test
- [ ] The toast fires when no category qualifies
- [ ] game.levelStart on start, game.levelComplete on completion
- [ ] Quiz pool is min(8, items.length) via weightedPick
- [ ] Exactly four options, one target and three same-category distractors
- [ ] Options shuffled, proven across seeded runs
- [ ] The prompt speaks exactly once per round, proven by speechSpy
- [ ] The replay button re-speaks the target
- [ ] locked prevents double-scoring, proven by burst
- [ ] Correct increments score and streak; wrong resets streak
- [ ] markSeen called correctly for both correct and wrong
- [ ] celebrate() fires on the 10th learned word
- [ ] Done card star tiers correct at every boundary
- [ ] Landscape via OrientationService; no lockAsync in game code
- [ ] Landscape lock releases on exit, verified on device
- [ ] Option grid fits at 1280x800 and 320x568, proven by screenshot
- [ ] A full playthrough reaches the done card in Tier 2
- [ ] Fully playable under degradeNativeApis
- [ ] Touch-target and reachability audits clean
- [ ] No listener growth across ten rounds
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 50 screenshots plus two device captures committed
- [ ] Only quiz was built
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-08-report.md using the headings in
docs/migration/validation.md section 7.

Add a final section titled "ARCHITECTURE GO / NO-GO" stating plainly whether
the shell is ready to carry ten more games. Name anything you already know will
need to change for puzzle (drag and drop), bubbles (spawning timers) or sounds
(forces its own category). It is much cheaper to say so now than in Phase 10.

Then stop. Do not begin Phase 9.
````
