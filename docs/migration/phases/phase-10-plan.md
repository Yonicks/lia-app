# Phase 10 — Games wave B: sounds, count, sort, bubbles, puzzle

**Prompt:** [../prompts/phase-10.md](../prompts/phase-10.md)
**Creates:** five game features
**Ships:** all eleven games playable

---

## Goal and rationale

Finish the game catalogue. Four of these five are straightforward on the
existing shell. The fifth, puzzle, is the most sophisticated piece of
interaction design in the entire application and deserves most of the phase's
attention.

## Entry conditions

- `docs/migration/phase-09-report.md` exists with no critical FAIL, and its
  shell-extensions section has been read.
- Nine games or game-equivalents exist.

## Design decisions

### Puzzle is a port of a design, not just of code

The legacy puzzle carries an unusually explicit design rationale in comments at
index.html 2764-2774, and it should be read before writing any code:

> There is no game over, no lives and no timer. A piece that lands in the wrong
> place floats back; the second miss lights up where it belongs; from the third
> the magnet gets stronger, so the board always ends up finished.

That is a therapeutic decision, not a difficulty setting. A child with a speech
delay must not be able to fail. Every mechanic below serves it, and none may be
"simplified" during the port.

**Adaptive difficulty across sessions.** `PUZZLE_STEPS = [2,3,4,5,6]`, and
`settings.puzzleLevel` (1-5) persists. `puzzleAdvance()` (index.html 2973-2978)
moves one step at a time: up when misses are 1 or fewer, down when misses are 5
or more, otherwise unchanged. Never below 2 pieces, so a board the child can
finish is always available.

**Capacity beats level.** `puzzleCapacity()` (index.html 2785-2790) caps the
board by screen size: 3 pieces below 620 tall or 360 wide, 4 below 780 tall,
otherwise 6. `puzzleSize()` takes the minimum of the level and the capacity. A
crowded board is the fastest way to lose a two-year-old, so screen size wins
over difficulty.

**Piece selection is deliberately varied.** `puzzlePick()` (index.html
2802-2820) draws `n * 3` candidates through `weightedPick`, then filters for
distinct first letters and distinct `shape` tags before backfilling. Mostly
words the child manages, with a little challenge, and never four
near-identical silhouettes.

This is the reason the `shape` field exists on all 182 words. Anyone tempted to
drop it as unused should read this function first.

**The magnet grows.** `game.tolerance` starts at 0.9. From the third miss on a
piece it grows by 0.4 per miss up to 2.2 (index.html 2945). The drop target
literally gets bigger the more a child struggles.

**Two input paths, always both.** Drag and drop, and tap-piece-then-tap-shadow.
The second exists for children who cannot sustain a drag, and it is not
optional.

**Miss feedback escalates.** First miss: float back plus
`interaction.invalidMove`. Second: the correct slot lights up and Talki speaks
the word. Third and beyond: tolerance grows.

**Completion is gentle.** `puzzleFinish()` waits 1100 ms, then completes,
increments the board count, calls `puzzleAdvance()`, fires
`game.levelComplete`, and shows confetti when effects are on. Stars: three when
misses are 1 or fewer, two when 4 or fewer, otherwise one — a different scale
from `doneCard`, deliberately, because puzzle has no score.

**`PUZZLE_TOGETHER` prompts.** Three parent-facing prompts shown occasionally,
not on every board (index.html 2776-2781). They invite shared play, which is
the clinical point of the whole app.

### Gesture handling must be as robust as the legacy version

`puzzleAttachDrag()` (index.html 2985-) uses pointer capture so a drag survives
a small finger wandering off the piece, and handles `pointercancel` — a system
gesture, an incoming call, the browser stealing the gesture for a scroll — by
returning the piece rather than leaving it stranded mid-air.

`react-native-gesture-handler` must handle the equivalents: an interrupted
gesture, a gesture leaving the piece bounds, and a system interruption. A
stranded piece is worse than a failed drop.

### The other four

**sounds** (index.html 2520-2523, 2702-2719) forces `CATEGORIES.animals`
filtered to items with a `sound` field, ignoring the active category entirely.
Six rounds, three options, and the prompt is the onomatopoeia. This is the one
game that overrides category selection, and the shell must allow it.

**count** (index.html 2524-2526, 2722-2742) has 5 rounds. `n` is 1-5, options
are a `Set` of three distinct numbers including `n`, and items with a `photo`
are excluded from the pool so custom-word photos are not repeated five times
across the stage. `NUM_WORDS` supplies the Hebrew numerals.

**sort** (index.html 2542-2544, 2745-2762) has 6 rounds and picks two random
categories with 4 or more items from `CATEGORIES` — not from `allCats()`, so
the virtual `mine` category never becomes a sorting box.

**bubbles** (index.html 2518-2519, 2663-2670, 3597-3602) has no fail state and
no score pressure. Twelve bubbles spawn on an interval; tapping pops one and
speaks its word.

## Legacy source mapping

| Game | Setup | Render | Handlers |
|---|---|---|---|
| sounds | 2520-2523, 2702-2710 | 2711-2719 | 3604-3621 |
| count | 2524-2526, 2723-2732 | 2733-2742 | 3623-3636 |
| sort | 2542-2544, 2745-2751 | 2752-2762 | 3638-3654 |
| bubbles | 2518-2519, 2671- | 2663-2670 | 3597-3602 |
| puzzle | 2545-2549, 2822-2832 | 2835-2870 | 3579-3588 |

Puzzle support: `PUZZLE_STEPS` 2775, `PUZZLE_TOGETHER` 2776-2781,
`puzzleCapacity` 2785-2790, `puzzleLevel` 2791-2794, `puzzleSize` 2795-2797,
`puzzlePick` 2802-2820, `puzzleDoneCard` 2872-, miss handling 2938-2955,
`puzzleFinish` 2956-2969, `puzzleAdvance` 2973-2978, `puzzleAttachDrag` 2985-.

## Files to be created

```
apps/mobile/src/features/games/
├── sounds/   SoundsScreen.tsx  soundsReducer.ts
├── count/    CountScreen.tsx   countReducer.ts   numWords.ts
├── sort/     SortScreen.tsx    sortReducer.ts
├── bubbles/  BubblesScreen.tsx bubblesReducer.ts useBubbleSpawner.ts
└── puzzle/
    ├── PuzzleScreen.tsx
    ├── puzzleReducer.ts
    ├── puzzleDifficulty.ts    STEPS, capacity, level, size, advance
    ├── puzzlePick.ts
    ├── PuzzlePiece.tsx        gesture handling
    ├── PuzzleSlot.tsx
    └── PuzzleDoneCard.tsx

apps/mobile/tests/unit/
├── sounds-reducer.test.ts
├── count-reducer.test.ts
├── sort-reducer.test.ts
├── bubbles-reducer.test.ts
├── puzzle-difficulty.test.ts
├── puzzle-pick.test.ts
└── puzzle-reducer.test.ts

apps/mobile/tests/e2e/{sounds,count,sort,bubbles,puzzle}.spec.ts
apps/mobile/.maestro/games-wave-b.yaml
```

## testIds introduced

```
sounds-root      sounds-play        sounds-option-<index>
count-root       count-stage        count-option-<index>
sort-root        sort-item          sort-box-<categoryId>
bubbles-root     bubbles-stage      bubbles-bubble-<index>
puzzle-root      puzzle-slot-<id>   puzzle-piece-<id>
puzzle-guide     puzzle-done        puzzle-together-prompt
```

## Behaviour to preserve exactly

- sounds: always animals, always items with a `sound`, 6 rounds, 3 options.
- count: 5 rounds, `n` in 1-5, 3 distinct options including `n`, `photo` items
  excluded.
- sort: 6 rounds, two random categories from `CATEGORIES` with 4 or more items.
- bubbles: 12 bubbles, no fail state, tap pops and speaks.
- puzzle: `PUZZLE_STEPS = [2,3,4,5,6]`.
- puzzle: capacity 3 / 4 / 6 by screen size; size is the minimum of level and
  capacity, never below 2.
- puzzle: `puzzlePick` prefers distinct first letters and distinct shapes, then
  backfills.
- puzzle: tolerance starts 0.9, grows 0.4 per miss from the third, caps at 2.2.
- puzzle: hint appears on the second miss on a piece, and Talki speaks the word.
- puzzle: both drag and tap-tap always work.
- puzzle: no game over, no timer, no lives.
- puzzle: finish waits 1100 ms, then advances the level and fires
  `game.levelComplete`.
- puzzle: `puzzleAdvance` moves one step; up at 1 or fewer misses, down at 5 or
  more.
- puzzle: `settings.puzzleLevel` persists across sessions.
- puzzle stars: 3 at 1 or fewer misses, 2 at 4 or fewer, otherwise 1.
- puzzle: `PUZZLE_TOGETHER` shown occasionally, not every board.

## Test plan

### Tier 1

`puzzle-difficulty.test.ts`
- `puzzleCapacity` boundaries: 619 and 620 tall, 359 and 360 wide, 779 and 780
- `puzzleLevel` clamps to 1-5 and handles a missing or non-numeric setting
- `puzzleSize` is `min(STEPS[level-1], capacity)`, never below 2
- `puzzleAdvance` up at 0 and 1 misses, unchanged at 2-4, down at 5 and above
- `puzzleAdvance` never exceeds 5 or falls below 1
- the new level is persisted

`puzzle-pick.test.ts`
- returns exactly `n` pieces
- prefers distinct first letters when the pool allows
- prefers distinct `shape` tags when the pool allows
- backfills when the constraints cannot all be met
- never returns fewer than `n` when the category has enough items

`puzzle-reducer.test.ts`
- a correct drop places the piece and increments `placed`
- a wrong drop increments both piece and board misses and does not place
- the second miss on a piece sets the hint
- the third miss raises tolerance by 0.4, capped at 2.2
- tap-then-tap places exactly like a drag
- there is no state in which the game can be lost
- done when every piece is placed
- stars: 0 misses three, 1 three, 2 two, 4 two, 5 one

`sounds-reducer.test.ts`
- always animals regardless of the requested category
- every pooled item has a `sound`
- 6 rounds, 3 options, exactly one correct

`count-reducer.test.ts`
- 5 rounds, `n` in 1-5
- exactly 3 distinct options, always including `n`
- `photo` items excluded when a non-photo pool exists

`sort-reducer.test.ts`
- 6 rounds, exactly 2 boxes
- both boxes have 4 or more items
- boxes come from `CATEGORIES`, never the virtual `mine`
- the item always belongs to one of the two boxes

`bubbles-reducer.test.ts`
- 12 total
- popping increments and speaks
- no state can end the game early
- the spawner is cleared on unmount

### Tier 2

One spec per game, all ten viewports.

Puzzle gets the most attention:
- drag a piece to its slot and it places
- tap a piece then tap the slot and it places
- a wrong drop returns the piece and does not place it
- the second miss shows the hint
- the board can always be completed
- the piece count adapts to viewport height, verified at 320x568 and 1280x800
- an interrupted drag returns the piece rather than stranding it
- `burst` on a piece does not place it twice
- `toHaveScreenshot()` on board, mid-drag, hint state and done

Others:
- sounds: the play button re-plays; three options; a full playthrough completes
- count: the stage shows exactly `n` images; three options; completes
- sort: two boxes; a correct drop scores; completes in 6 rounds
- bubbles: bubbles appear and pop; `speechSpy` proves one speak per pop; the
  spawner stops on navigation away

All: audits clean, no listener growth, playable under `degradeNativeApis`.

### Tier 3

`.maestro/games-wave-b.yaml` plays one round of each.

Manual attestation, device named:
- puzzle drag is smooth with a real finger on a real device
- an interrupted drag — incoming call or notification shade — returns the piece
- the tap-tap path works for a child who cannot sustain a drag
- the level persists across a force-stop
- bubbles spawning does not leak when navigating away repeatedly
- sounds audio plays the onomatopoeia clearly
- all five hold landscape

## Screenshot manifest

```
docs/migration/screenshots/phase-10/
    <viewport>-sounds-board.png       <viewport>-sounds-done.png
    <viewport>-count-board.png        <viewport>-count-done.png
    <viewport>-sort-board.png         <viewport>-sort-done.png
    <viewport>-bubbles-stage.png
    <viewport>-puzzle-board-2.png     2-piece board, lowest level
    <viewport>-puzzle-board-6.png     6-piece board, highest level
    <viewport>-puzzle-hint.png
    <viewport>-puzzle-done.png
    android-device-puzzle-drag.png
    android-tablet-puzzle-landscape.png
```

Eleven states times ten viewports is 110 files, plus two device captures.

## Risks and open questions

**Drag and drop is the hardest interaction in the app.** Default: build it with
`react-native-gesture-handler` and Reanimated, mirror the legacy robustness
around interruption and out-of-bounds, and if a gesture cannot be driven under
Playwright, mark that assertion skipped with a reason and cover it in Tier 3.
Never remove the tap-tap path as a workaround — it is a real accessibility path
for a real child.

**Tolerance is a pixel distance in a fluid layout.** Default: express tolerance
as a multiple of slot size rather than absolute pixels, so it scales across the
viewport range. Record the chosen basis.

**Bubble spawning and app lifecycle.** Default: pause the spawner on background
and resume on foreground, and always clear it on unmount. Assert the unmount
case with a test.

**`sounds` overriding the active category.** Default: allow the shell to accept
a game-declared fixed category. Do not special-case it inside the screen.

**`count` at `n = 5` on a small landscape screen.** Default: scale the images
to fit rather than scroll. A child counting must see all five at once.

**Occasional `PUZZLE_TOGETHER` prompts.** Legacy shows them on some boards.
Default: read the exact condition from the code rather than inventing a
frequency, and if it is genuinely random, inject the random source so it is
testable.

## Exit criteria

- [ ] All eleven games playable end to end
- [ ] sounds: always animals with a `sound`, 6 rounds, 3 options
- [ ] count: 5 rounds, `n` 1-5, 3 distinct options, `photo` items excluded
- [ ] sort: 6 rounds, 2 boxes from `CATEGORIES`, never `mine`
- [ ] bubbles: 12 bubbles, no fail state, spawner cleared on unmount
- [ ] puzzle: `PUZZLE_STEPS` and `settings.puzzleLevel` persistence correct
- [ ] puzzle: capacity boundaries correct at 620, 360 and 780
- [ ] puzzle: size never below 2
- [ ] puzzle: `puzzlePick` prefers distinct initials and shapes, then backfills
- [ ] puzzle: tolerance 0.9, +0.4 from the third miss, capped 2.2
- [ ] puzzle: hint on the second miss, with the word spoken
- [ ] puzzle: BOTH drag and tap-tap work
- [ ] puzzle: no state can lose the game, asserted by test
- [ ] puzzle: an interrupted drag returns the piece, verified on device
- [ ] puzzle: finish waits 1100 ms and advances the level
- [ ] puzzle stars 3 / 2 / 1 at the correct miss thresholds
- [ ] `PUZZLE_TOGETHER` prompts appear on the same condition as legacy
- [ ] All five playable under `degradeNativeApis`
- [ ] Audits clean, no listener growth, no leaked timers
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 110 screenshots plus two device captures committed
- [ ] Puzzle level persists across a force-stop, verified on device
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-10-report.md` written
