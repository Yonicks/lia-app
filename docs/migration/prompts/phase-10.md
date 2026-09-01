# Phase 10 prompt — Games wave B: sounds, count, sort, bubbles, puzzle

Plan: [../phases/phase-10-plan.md](../phases/phase-10-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 10 of the Talki migration to Expo React Native.

Phase 10 finishes the game catalogue: sounds, count, sort, bubbles and puzzle.
Four are straightforward on the existing shell. PUZZLE is the most sophisticated
piece of interaction design in the entire application and deserves most of your
attention.

Execute ONLY Phase 10.

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
- No "simplifying" any puzzle mechanic. Every one of them is a therapeutic
  decision, not a difficulty setting. See below.
- No removing the tap-then-tap path as a drag workaround.
- No forking the game shell. Extend it and record what changed.
- No global store for transient per-game state.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not build the speech game or any practice mode. Phase 11 owns those.
- If you finish early, deepen the puzzle tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-10-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-10-plan.md   — your plan, read it fully
2. docs/migration/phase-09-report.md        — especially "Shell extensions"
3. index.html 2764-2774                     — READ THIS COMMENT BEFORE CODING
4. index.html:
     2518-2519, 2663-2670, 3597-3602   bubbles
     2520-2523, 2702-2719, 3604-3621   sounds
     2524-2526, 2722-2742, 3623-3636   count
     2542-2544, 2745-2762, 3638-3654   sort
     2545-2549, 2822-2870, 3579-3588   puzzle
     2775                              PUZZLE_STEPS
     2776-2781                         PUZZLE_TOGETHER
     2785-2797                         puzzleCapacity, puzzleLevel, puzzleSize
     2802-2820                         puzzlePick
     2872-                             puzzleDoneCard
     2938-2955                         miss handling, hint, tolerance growth
     2956-2969                         puzzleFinish
     2973-2978                         puzzleAdvance
     2985-                             puzzleAttachDrag

PUZZLE IS A PORT OF A DESIGN, NOT JUST OF CODE.

The legacy comment at index.html 2771-2774 says:

    "There is no game over, no lives and no timer. A piece that lands in the
     wrong place floats back; the second miss lights up where it belongs; from
     the third the magnet gets stronger, so the board always ends up finished."

That is a THERAPEUTIC decision. A child with a speech delay must not be able to
fail. Every mechanic below serves it. None may be simplified, and none may be
dropped because it looks like an edge case.

GROUND TRUTH — PUZZLE

Adaptive difficulty across sessions:
    PUZZLE_STEPS = [2, 3, 4, 5, 6]
    settings.puzzleLevel is 1..5 and PERSISTS between sessions
    puzzleAdvance() (2973-2978) moves ONE step at a time:
        misses <= 1  -> level + 1, capped at 5
        misses >= 5  -> level - 1, floored at 1
        otherwise    -> unchanged

Capacity BEATS level (2785-2790). A crowded board is the fastest way to lose a
two-year-old, so screen size wins over difficulty:
    height < 620 or width < 360  -> 3 pieces
    height < 780                 -> 4 pieces
    otherwise                    -> 6 pieces
    puzzleSize() = max(2, min(PUZZLE_STEPS[level-1], capacity))

Piece selection is deliberately varied (2802-2820). puzzlePick draws n*3
candidates via weightedPick, then prefers DISTINCT FIRST LETTERS and DISTINCT
`shape` tags, then backfills. Mostly words the child manages, with a little
challenge, and never four near-identical silhouettes.

  This is why the `shape` field exists on all 182 words. If you were tempted to
  treat it as unused data, read this function first.

The magnet grows (2945):
    tolerance starts at 0.9
    from the THIRD miss on a piece: tolerance += 0.4, capped at 2.2
    The drop target literally gets bigger the more a child struggles.

Miss feedback escalates (2938-2955):
    1st miss  float back + playSfx('interaction.invalidMove')
    2nd miss  the correct slot lights up AND Talki speaks the word
    3rd+      tolerance grows

TWO INPUT PATHS, ALWAYS BOTH:
    drag and drop
    tap the piece, then tap the shadow
The second exists for children who cannot sustain a drag. It is NOT optional
and must never be removed to work around a gesture problem.

Completion (2956-2969):
    wait 1100 ms, then done, boards++, puzzleAdvance(),
    playSfx('game.levelComplete'), confetti(24) when settings.effects
Stars (2872-) use a DIFFERENT scale from doneCard, deliberately, because puzzle
has no score:
    misses <= 1  three stars
    misses <= 4  two stars
    otherwise    one star

PUZZLE_TOGETHER (2776-2781): three parent-facing prompts shown OCCASIONALLY,
not on every board. Read the exact condition from the code; do not invent a
frequency. If it is genuinely random, inject the random source so it is testable.

Gesture robustness: puzzleAttachDrag (2985-) uses pointer capture so a drag
survives a small finger wandering off the piece, and handles pointercancel —
a system gesture, an incoming call, the browser stealing the gesture — by
RETURNING the piece rather than leaving it stranded mid-air. Your gesture
handler must do the equivalent. A stranded piece is worse than a failed drop.

GROUND TRUTH — THE OTHER FOUR

SOUNDS (2520-2523, 2702-2719)
    Forces CATEGORIES.animals filtered to items WITH a `sound` field, ignoring
    the active category entirely. This is the one game that overrides category
    selection — let the SHELL accept a game-declared fixed category rather than
    special-casing it inside the screen.
    6 rounds, 3 options. The prompt is the onomatopoeia.
    title '🐮 מי אמר את זה?'

COUNT (2524-2526, 2722-2742)
    5 rounds. n = 1 + floor(random * 5), so 1..5.
    options = a Set of THREE DISTINCT numbers, always including n.
    Items with a `photo` are EXCLUDED from the pool, so a custom-word photo is
    not repeated five times across the stage.
    NUM_WORDS = ['','אַחַת','שְׁתַּיִם','שָׁלוֹשׁ','אַרְבַּע','חָמֵשׁ']
    title '🔢 כמה יש?'

SORT (2542-2544, 2745-2762)
    6 rounds. Picks TWO random categories with 4+ items from CATEGORIES —
    NOT from allCats(), so the virtual 'mine' category never becomes a box.
    title '📦 לאיזו קופסה?'

BUBBLES (2518-2519, 2663-2670, 3597-3602)
    12 bubbles. NO fail state, no score pressure. Bubbles spawn on an interval;
    tapping pops one and speaks its word.
    title '🫧 בועות מילים'

WORK ITEMS

1. Build the five games exactly to the ground truth above.

2. Puzzle gesture handling with react-native-gesture-handler and Reanimated.
   Mirror the legacy robustness: an interrupted gesture and a gesture leaving
   the piece bounds both RETURN the piece.

   Express tolerance as a MULTIPLE OF SLOT SIZE, not absolute pixels, so it
   scales across the viewport range. Record the basis you chose.

3. Let the shell accept a game-declared fixed category, for sounds.

4. Pause the bubble spawner on background, resume on foreground, and ALWAYS
   clear it on unmount. Assert the unmount case with a test.

5. Add every testId from the plan to src/testing/testIds.ts.

6. Tier 1 tests per the plan. The puzzle tests are the important ones:

   puzzle-difficulty.test.ts
     - puzzleCapacity boundaries tested on BOTH sides of 620 tall, 360 wide
       and 780 tall
     - puzzleLevel clamps 1..5 and handles a missing or non-numeric setting
     - puzzleSize = min(STEPS[level-1], capacity), never below 2
     - puzzleAdvance: up at 0 and 1 misses, unchanged at 2, 3 and 4, down at 5
       and above; never above 5 or below 1; the new level is persisted

   puzzle-pick.test.ts
     - returns exactly n pieces
     - prefers distinct first letters when the pool allows
     - prefers distinct shape tags when the pool allows
     - backfills when the constraints cannot all be met
     - never returns fewer than n when the category has enough items

   puzzle-reducer.test.ts
     - a correct drop places and increments placed
     - a wrong drop increments piece AND board misses and does not place
     - the second miss on a piece sets the hint
     - the third miss raises tolerance by 0.4, capped at 2.2
     - tap-then-tap places exactly like a drag
     - THERE IS NO STATE IN WHICH THE GAME CAN BE LOST
     - done when every piece is placed
     - stars: 0 misses three, 1 three, 2 two, 4 two, 5 one

   Plus sounds, count, sort and bubbles reducer tests per the plan.

7. Tier 2: one spec per game at all ten viewports. Puzzle gets the most:
     - drag a piece to its slot and it places
     - tap a piece then tap the slot and it places
     - a wrong drop returns the piece and does not place it
     - the second miss shows the hint
     - the board can ALWAYS be completed
     - the piece count adapts to viewport height, verified at 320x568 and
       1280x800
     - an interrupted drag returns the piece rather than stranding it
     - burst on a piece does not place it twice
     - toHaveScreenshot() on board, mid-drag, hint state and done

   If a gesture cannot be driven under Playwright, mark that assertion skipped
   WITH A REASON and cover it in Tier 3. Do not remove the tap-tap path as a
   workaround.

   Others: sounds replay and playthrough; count stage shows exactly n images;
   sort two boxes and 6 rounds; bubbles spawn, pop, speechSpy proves one speak
   per pop, and the spawner stops on navigation away.

   All five: audits clean, no listener growth, playable under degradeNativeApis.

8. Tier 3: apps/mobile/.maestro/games-wave-b.yaml, plus manual attestation with
   the device named:
     - puzzle drag smooth with a real finger
     - an interrupted drag (incoming call or notification shade) returns the piece
     - the tap-tap path works for a child who cannot sustain a drag
     - the puzzle level persists across a force-stop
     - bubbles spawning does not leak when navigating away repeatedly
     - sounds plays the onomatopoeia clearly
     - all five hold landscape

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
- Do not build the speech game or any practice mode.
- Do not simplify any puzzle mechanic.
- Do not remove the tap-tap path.
- Do not let sort use the virtual 'mine' category as a box.
- Do not let count include items with a photo.
- Do not add a fail state, a timer or lives to puzzle or bubbles.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] All eleven games now playable end to end
- [ ] sounds: always animals with a sound field, 6 rounds, 3 options
- [ ] sounds: the fixed category is declared through the shell, not special-cased
- [ ] count: 5 rounds, n in 1..5, 3 distinct options including n
- [ ] count: items with a photo excluded from the pool
- [ ] sort: 6 rounds, 2 boxes from CATEGORIES, never 'mine'
- [ ] bubbles: 12 bubbles, no fail state, spawner cleared on unmount
- [ ] puzzle: PUZZLE_STEPS correct and settings.puzzleLevel persists
- [ ] puzzle: capacity boundaries correct on both sides of 620, 360 and 780
- [ ] puzzle: size never below 2
- [ ] puzzle: puzzlePick prefers distinct initials and shapes, then backfills
- [ ] puzzle: tolerance 0.9, +0.4 from the third miss, capped at 2.2
- [ ] puzzle: hint on the second miss, with the word spoken
- [ ] puzzle: BOTH drag and tap-tap work
- [ ] puzzle: no state can lose the game, asserted by test
- [ ] puzzle: an interrupted drag returns the piece, verified on a device
- [ ] puzzle: finish waits 1100 ms then advances the level
- [ ] puzzle stars 3 / 2 / 1 at the correct miss thresholds
- [ ] PUZZLE_TOGETHER appears on the same condition as legacy
- [ ] All five playable under degradeNativeApis
- [ ] Audits clean, no listener growth, no leaked timers
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 110 screenshots plus two device captures committed
- [ ] Puzzle level persists across a force-stop, verified on device
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-10-report.md using the headings in
docs/migration/validation.md section 7.

Add a section "Puzzle fidelity" stating, mechanic by mechanic, that each of the
therapeutic behaviours above is present: no fail state, escalating hints,
growing tolerance, adaptive level, capacity cap, varied piece selection, and
both input paths. If any could not be reproduced faithfully, say exactly which
and why.

Then stop. Do not begin Phase 11.
````
