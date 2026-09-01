# Phase 9 prompt — Games wave A: memory, missing, match, cards

Plan: [../phases/phase-09-plan.md](../phases/phase-09-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 9 of the Talki migration to Expo React Native.

Phase 9 ports four games onto the Phase 8 shell: memory, missing, match and
cards. They were chosen for their DIFFERENCES, not their similarity, so that
you find out where the shell is too narrow while widening it is still cheap:

    memory   a card grid with flip state and a timed auto-close
    missing  a two-phase round driven by a 2600 ms timer
    match    two-column selection with a pending selection across taps
    cards    not a scored game at all — a browsing flow with swipe

Execute ONLY Phase 9. Do not build sounds, count, sort, bubbles, puzzle or
speech.

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
- It is never shipped. Do not make a decision for the browser's benefit.

FORBIDDEN
- No forking the game shell. EXTEND it and record what you changed.
- No game reimplementing the header, the chips or the done card.
- No global store for transient per-game state.
- No lockAsync in game code. OrientationService owns orientation.
- No redesign of game rules.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- If you finish early, deepen the tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-09-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-09-plan.md   — your plan, read it fully
2. docs/migration/validation.md
3. docs/migration/phase-08-report.md        — the shell, and its go/no-go
4. index.html:
     2329-2351  renderCards()
     2503-2508  memory setup inside startGame()
     2509-2511  missing setup inside startGame()
     2512-2514  match setup inside startGame()
     2583-2597  renderMemory()
     2600-2610  setupMissingRound(), nextMissing()
     2611-2626  renderMissing()
     2629-2640  renderMatch()
     3457-3479  cards handlers
     3512-3533  memory handlers
     3535-3558  missing handlers
     3560-3577  match handlers

GROUND TRUTH — take every number from the legacy code, not from memory.

MEMORY (index.html 2503-2508, 2583-2597, 3512-3533)
    picks   weightedPick(cat.items, cat.id, 6)
    cards   shuffle(picks.flatMap((it, n) => [
              { pair: n, kind: 'pic',  it },
              { pair: n, kind: 'word', it }
            ])).map((c, i) => ({ ...c, idx: i, open: false, matched: false }))
    state   { cards, first, moves, found, total, locked, done }
    title   '🃏 משחק זיכרון'
    chips   `זוגות ${found}/${total}`, `ניסיונות ${moves}`
    done    doneCard(total, total, 0, `סיימת ב-${moves} ניסיונות`)
    12 cards: 6 pairs, each pair one PICTURE and one WORD.

MISSING (index.html 2509-2511, 2600-2626, 3535-3558)
    set        shuffle(weightedPick(cat.items, cat.id, 4))
    missing    a random member of set
    phase      'show' -> after EXACTLY 2600 ms -> 'ask'
    askOrder   shuffle(set)     <- a SEPARATE shuffle from the display order
    rounds     5
    title      '🙈 מה נעלם?'
    chips      `סיבוב ${round+1}/5`, `✅ ${score}`
    done       doneCard(score, 5, 0)
    During 'show' the option buttons are DISABLED. The prompt is spoken once
    the picture is gone, guarded by `asked`.

MATCH (index.html 2512-2514, 2629-2640, 3560-3577)
    picks   weightedPick(cat.items, cat.id, Math.min(5, cat.items.length))
    state   { left: shuffle(picks), right: shuffle(picks), sel, matched: [], done }
    title   '🔗 חיבורים'
    chips   `חוברו ${matched.length}/${left.length}`
    done    doneCard(left.length, left.length, 0)
    Left column is WORDS, right column is PICTURES. Tap a word, then a picture.

CARDS (index.html 2329-2351, 3457-3479)
    state   cardIdx, clamped to [0, items.length - 1]
    nav     prev, next, say
    swipe   left and right change the word
    header  `${cardIdx+1}/${cat.items.length}`
    empty   an empty category goes home
    NO score. NO rounds. NO done card.

WORK ITEMS

1. Extend the shell where these games need something quiz did not:
     - `missing` needs a timed phase transition
     - `cards` needs a shell variant with NO scoring and NO done card

   EXTEND the shell. Do not fork it, and do not work around it locally in a
   game. A GameShell variant with scoring: false, and a timer utility owned by
   useGameSession, are correct outcomes. Four bespoke screens that each
   re-implement the header are not.

   Record every extension in your report so Phase 10 knows what it inherits.

2. TIMERS BELONG TO THE SESSION, NOT THE COMPONENT.
   `missing` uses a 2600 ms timeout; `memory` uses a delay before closing a
   non-matching pair. Both MUST be cancelled on unmount, or a timer fires
   against a dead component. Add a managed timer helper to useGameSession and
   write a test asserting that navigating away mid-round leaves NO pending
   timer.

3. Do not force `cards` into a GameDefinition with a fake score. It is a
   flashcard browser. A non-scored shell variant is a better abstraction than a
   fake score. It is also the only place in the app with a swipe gesture, so it
   is where react-native-gesture-handler earns its dependency.

4. Build the four games exactly to the ground truth above.

5. Add every testId from the plan to src/testing/testIds.ts:
     memory-root, memory-card-<index>, memory-chip-pairs,
     missing-root, missing-item-<index>, missing-guess-<index>,
     missing-phase-show, missing-phase-ask,
     match-root, match-left-<index>, match-right-<index>,
     cards-root, cards-word, cards-prev, cards-next, cards-say, cards-counter

6. Tier 1: one reducer test per game, per the plan. Must include:
     memory  — 12 cards from 6 pairs, each pair exactly one pic and one word;
               matching sets both matched and increments found; non-matching
               increments moves and schedules a close; a matched card cannot be
               re-selected; a THIRD card cannot be flipped while two are open;
               done when found === total
     missing — exactly 4 items in set; missing is a member of set; askOrder is
               a permutation of set; the show->ask transition happens on the
               TIMER, not on a tap; correct scores, wrong does not; done after
               exactly 5 rounds
     match   — pairs are min(5, items.length); left and right hold the same
               words in different orders; word then correct picture marks
               matched; word then wrong picture marks nothing; done when all
               matched
     cards   — index clamps at 0 and at length-1; next and prev move by one;
               an empty category is handled without a crash

   Plus, for all four: navigating away mid-round leaves no pending timer.

7. Tier 2: one spec per game at all ten viewports.

   Common to all four:
     - the board renders and fits WITHOUT CLIPPING in landscape
     - burst on the primary control does not double-count or double-advance
     - auditTouchTargets and auditReachability clean
     - countListeners shows no growth across ten interactions
     - degradeNativeApis: still playable
     - toHaveScreenshot() on the board and, where applicable, the done card
     - captureMatrix for every state in the manifest

   Game-specific:
     memory  — a full playthrough matching all six pairs reaches the done card;
               rapid tapping cannot open a third card
     missing — 'show' is visibly distinct from 'ask'; options are
               non-interactive during 'show'; speechSpy proves the prompt
               speaks ONCE and only AFTER the transition
     match   — selecting a word highlights it; a wrong pairing leaves both
               sides unmatched; a full playthrough completes
     cards   — prev and next move through the whole category; the counter is
               correct at both ends; the say button speaks once per press; a
               swipe changes the word

8. Tier 3: apps/mobile/.maestro/games-wave-a.yaml playing one round of each,
   plus manual attestation with the device named:
     - memory flip animation smooth on a LOW-END device
     - the missing 2600 ms timer feels right and survives a background and return
     - match selection reliable with a small finger on a small screen
     - cards swipe works both directions and does NOT fight the navigation back
       gesture
     - landscape holds for all four

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
- Do not build sounds, count, sort, bubbles, puzzle or speech.
- Do not give `cards` a score to make it fit the shell.
- Do not change the 2600 ms timing, the 5 rounds, the 6 pairs or the 5 match
  pairs.
- Do not leave a timer running after unmount.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] All four games playable end to end
- [ ] All four use GameShell; none reimplements the header, chips or done card
- [ ] Every shell extension recorded in the report for Phase 10
- [ ] memory: 6 pairs, 12 cards, one pic and one word per pair
- [ ] memory: a third card cannot be flipped while two are open
- [ ] memory: the done card shows the attempt count in its extra line
- [ ] missing: exactly 5 rounds
- [ ] missing: 'show' lasts 2600 ms with options disabled
- [ ] missing: the prompt speaks once, AFTER the transition, proven by speechSpy
- [ ] missing: askOrder is a separate shuffle from the display order
- [ ] match: up to 5 pairs, selection persists, wrong pairing marks nothing
- [ ] cards: no score, no done card, index clamps at both ends
- [ ] cards: swipe works both directions and does not break the back gesture
- [ ] cards: an empty category returns home
- [ ] markSeen called with the correct outcome in all four
- [ ] No pending timer survives unmounting, asserted by test
- [ ] Rapid tapping cannot double-count in any of the four
- [ ] All four playable under degradeNativeApis
- [ ] Audits clean and no listener growth at all ten viewports
- [ ] No clipping in landscape at 320x568 rotated, proven by screenshot
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 110 screenshots plus two device captures committed
- [ ] Only these four games were built
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-09-report.md using the headings in
docs/migration/validation.md section 7.

Add a section "Shell extensions" describing every change you made to the Phase 8
shell and why, so Phase 10 inherits an accurate picture before it tackles
puzzle's drag and drop and bubbles' spawning timers.

Then stop. Do not begin Phase 10.
````
