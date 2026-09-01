# Phase 8 — Game platform and first full game (quiz)

**Prompt:** [../prompts/phase-08.md](../prompts/phase-08.md)
**Creates:** `apps/mobile/src/features/games/shell/`, `.../quiz/`
**Ships:** one complete, playable game

---

## Goal and rationale

Establish the pattern that ten more games will follow, and prove it by shipping
one game end to end.

The economics are the argument. Everything shared by all eleven games — round
lifecycle, scoring, audio cues, the completion card, the landscape lock, the
back affordance, rapid-tap protection — gets built once here. If it is instead
discovered game by game, the first three games each invent their own version
and the shared abstraction is extracted from whichever one happened to be
written last.

Quiz is the right proving game: it is the simplest complete loop (prompt,
options, answer, score, next, done) and it exercises every part of the shell.

This phase ends at the architecture go/no-go gate. Phases 9, 10 and 11 add
sixteen more screens on top of whatever is decided here, so this is the last
cheap moment to change the pattern.

## Entry conditions

- `docs/migration/phase-07-report.md` exists with no critical FAIL.
- Home, navigation, design system, audio and storage all work.

## Design decisions

### Per-game state is local, always

Game state lives in a reducer owned by the game screen. It never enters the
Zustand store.

Zustand holds progress and settings, which outlive a screen. A quiz round does
not: leaving the screen should destroy it. Putting it in a global store creates
a stale-state bug that is invisible until a child leaves a game mid-round and
comes back, which is exactly what children do.

The one thing that crosses the boundary is the outcome — `markSeen()` and the
learned set — and that crosses through the progress store deliberately.

### `GameShell` owns the frame, `useGameSession` owns the lifecycle

```
GameShell        header, back, chips, completion card, orientation, audio state
useGameSession   start, round advance, lock, score, streak, done
```

A game supplies its board and its answer rules. It does not supply its own
header, its own done card, or its own orientation call.

`game.locked` deserves specific attention. Legacy sets it on every answer to
prevent a second tap being counted while feedback plays. That is the mechanism
protecting against exactly the rapid-tap behaviour `tests/interaction_suite.py`
tests for. It belongs in the session hook, not copied into each game.

### `startGame` semantics port exactly

`startGame(type, catId)` (index.html 2491-2551) does four things before any
game-specific setup, and all four matter:

1. `need = MIN_ITEMS[type] || 4`
2. if the requested category has fewer than `need` items, fall back to the
   first category that has enough
3. if no category qualifies, go home and return false — the caller toasts
   "צריך לפחות 4 מילים בקטגוריה"
4. fire `game.levelStart`

Note what it does **not** do: it does not write `lia:lastcat`. Only `enterCat()`
does. A game's category fallback must not change where Continue Learning
points.

### Landscape, through the service

Game routes lock landscape via `OrientationService`, using the policy map from
Phase 4. No game calls `lockAsync`.

This is where the deliberate portrait-to-landscape deviation first becomes
visible to a child, so it is also where the layout consequences first appear.
The option grid must work at 1280x800 and at 320x568.

### The completion card is shared

`doneCard(score, total, best, extra?)` (index.html 3204-3208) with its star
tiers — three at 85% or more, two at 50% or more, otherwise one — is a shell
component. Eleven games use it and none reimplements the thresholds.

### Quiz specifics, from the legacy code

```
pool     weightedPick(cat.items, cat.id, min(8, cat.items.length))
state    { type, catId, pool, i, score, streak, best, locked, done }
round    target = pool[i]
         others = shuffle(items where word !== target.word).slice(0, 3)
         options = shuffle([target, ...others])
         locked = false, asked = false
done     when i >= pool.length, fire game.levelComplete
chips    "שאלה {i+1}/{total}", "✅ {score}", "🔥 רצף {streak}"
replay   a button re-speaks the target
```

`asked` is the flag that makes the prompt speak exactly once per round. It is
easy to drop and produces a game that talks over itself, which
`tests/interaction_suite.py` already tests for in the legacy app.

## Legacy source mapping

| Behaviour | Legacy location |
|---|---|
| `MIN_ITEMS` | index.html 2489-2490 |
| `startGame()` | index.html 2491-2551 |
| `launch()` and the toast | index.html 2552-2555 |
| `gameHeader()` | index.html 2480-2485 |
| `chips()` | index.html 2486 |
| `doneCard()` star tiers | index.html 3204-3208 |
| `setupQuizRound()` | index.html 2557-2568 |
| `nextQuiz()` | index.html 2569-2571 |
| `renderQuiz()` | index.html 2572-2581 |
| Quiz handlers | index.html 3488-3510 |
| `weightedPick()` | index.html 1869-1877 |
| `markSeen()` | index.html 1878-1883 |
| `celebrate()` every 10th word | index.html 3451 |
| `STAR_STEP` | index.html 1845 |

## Files to be created

```
apps/mobile/src/features/games/shell/
├── GameShell.tsx
├── GameHeader.tsx
├── GameChips.tsx
├── DoneCard.tsx
├── useGameSession.ts
├── useGameAudio.ts
├── gameRegistry.ts
└── types.ts

apps/mobile/src/features/games/quiz/
├── QuizScreen.tsx
├── quizReducer.ts
├── setupQuizRound.ts
└── QuizOption.tsx

app/game/[id].tsx

apps/mobile/tests/unit/game-session.test.ts
apps/mobile/tests/unit/quiz-reducer.test.ts
apps/mobile/tests/unit/done-card.test.ts
apps/mobile/tests/e2e/quiz.spec.ts
apps/mobile/.maestro/quiz.yaml
```

## Contracts introduced

```ts
export interface GameDefinition<S, A> {
  id: GameId;
  titleHe: string;
  minItems: number;
  reducer: (state: S, action: A) => S;
  init: (ctx: GameInitContext) => S;
  Board: React.ComponentType<{ state: S; dispatch: Dispatch<A> }>;
  chips: (state: S) => string[];
  isDone: (state: S) => boolean;
  result: (state: S) => GameResult;
}

export interface GameResult {
  score: number;
  total: number;
  best?: number;
  extra?: string;
}

export interface GameInitContext {
  category: TalkiCategory;
  stats: Record<string, WordStats>;
  settings: TalkiSettings;
}
```

Reducers are pure and take their randomness from an injected source, so tests
can make a round deterministic without stubbing `Math.random` globally.

## testIds introduced

```
game-shell-root          game-header-back
game-header-title        game-chip-<index>
game-done-card           game-done-stars
game-done-replay         game-done-home

quiz-root                quiz-prompt
quiz-replay              quiz-option-<index>
quiz-option-correct      quiz-option-wrong
```

## Behaviour to preserve exactly

- `MIN_ITEMS.quiz` is 4; missing keys default to 4.
- Category fallback picks the first category with enough items.
- No qualifying category means home plus the toast, and `startGame` returns
  false.
- `startGame` does not write `lia:lastcat`.
- `game.levelStart` on start, `game.levelComplete` on completion.
- Quiz pool is up to 8 words via `weightedPick`.
- Exactly four options: one target and three distractors from the same
  category.
- Options are shuffled.
- The prompt speaks once per round, guarded by `asked`.
- The replay button re-speaks the target.
- A correct answer increments score and streak and calls `markSeen(correct)`.
- A wrong answer resets streak and calls `markSeen(wrong)`.
- `locked` prevents a second answer during feedback.
- Done card stars: 85% three, 50% two, otherwise one.
- `celebrate()` fires on every 10th learned word.

## Deliberate deviations

- Game routes are landscape.

## Test plan

### Tier 1

`game-session.test.ts`
- `MIN_ITEMS` gate and category fallback for every game id
- no qualifying category returns false and does not throw
- `startGame` does not write `lia:lastcat` — asserted explicitly, because this
  is a subtle cross-feature regression
- `locked` blocks a second answer until the round advances
- session start and completion emit the right audio events in the right order

`quiz-reducer.test.ts`
- pool size is `min(8, items.length)`
- exactly four options, exactly one correct
- distractors never duplicate the target
- distractors come from the same category
- options are shuffled — over many seeded runs the correct answer is not always
  in the same position
- correct increments score and streak
- wrong resets streak to 0
- `best` tracks the highest streak seen
- done at `i >= pool.length`
- the reducer is pure: same state plus same action plus same seed gives the
  same result

`done-card.test.ts`
- 100% gives three stars, 85% three, 84% two, 50% two, 49% one, 0% one
- boundaries asserted on both sides

### Tier 2

`quiz.spec.ts` at all ten viewports, and this is where landscape first matters
- the quiz renders with four options
- the option grid fits without scrolling at 1280x800 and at 320x568
- `speechSpy` proves the prompt speaks exactly once on round entry
- the replay button speaks again
- `burst(page, 'quiz-option-0', 10)` advances exactly one round and scores once
- a full playthrough of all rounds reaches the done card
- the done card shows the expected star count for a known score
- back from mid-game returns to the games menu without a crash
- `degradeNativeApis`: the quiz is still playable with no audio at all
- `auditTouchTargets` and `auditReachability` clean
- `countListeners` shows no growth across ten rounds
- `toHaveScreenshot()` on the board and on the done card
- `captureMatrix` for each state in the manifest

### Tier 3

`.maestro/quiz.yaml`: launch, open quiz, answer, complete, assert the done card.

Manual attestation, device named:
- landscape lock engages entering the game and releases on exit
- rotating the device mid-game does not lose the round
- the prompt is audible and speaks once
- backgrounding mid-round and returning leaves the round intact
- rapid toddler tapping cannot double-score

## Screenshot manifest

```
docs/migration/screenshots/phase-08/
    <viewport>-quiz-board.png
    <viewport>-quiz-correct.png
    <viewport>-quiz-wrong.png
    <viewport>-quiz-done-3star.png
    <viewport>-quiz-done-1star.png
    android-device-quiz-landscape.png
    android-tablet-quiz-landscape.png
```

Five states times ten viewports is 50 files, plus two device captures.

## Risks and open questions

**The shell may not fit all eleven games.** Puzzle has drag and drop, bubbles
has spawning timers, sounds forces its own category. Default: build the shell
for quiz now, and treat the first mismatch in Phase 9 as a signal to extend the
shell rather than to fork it. Record any extension.

**Landscape option grids on a small phone.** At 320x568 rotated to 568x320 the
vertical space is very tight. Default: a responsive grid from the Phase 5
module — two by two on short landscape, one row on wide. Prove it with a
screenshot, not an assumption.

**`weightedPick` randomness in tests.** Default: inject the random source
through `GameInitContext`. Do not stub `Math.random` globally; it makes failures
non-reproducible.

**`asked` versus React strict mode.** Double-invoked effects in development can
speak the prompt twice. Default: guard with a ref keyed to the round index, and
assert single-speak with `speechSpy` rather than trusting the implementation.

## Exit criteria

- [ ] `GameShell` and `useGameSession` exist and quiz uses them
- [ ] Per-game state is local; nothing transient entered the global store
- [ ] `MIN_ITEMS` gate and category fallback behave exactly as legacy
- [ ] `startGame` does not write `lia:lastcat`, asserted
- [ ] The toast fires when no category qualifies
- [ ] `game.levelStart` and `game.levelComplete` fire at the right moments
- [ ] Quiz pool, option count, distractor rules and shuffling all match legacy
- [ ] The prompt speaks exactly once per round, proven by `speechSpy`
- [ ] `locked` prevents double-scoring, proven by `burst`
- [ ] Done card star tiers correct at every boundary
- [ ] `markSeen` called correctly for both correct and wrong
- [ ] `celebrate()` fires on the 10th learned word
- [ ] Landscape lock via `OrientationService`; no `lockAsync` in game code
- [ ] The option grid fits at 1280x800 and at 320x568, proven by screenshot
- [ ] A full playthrough reaches the done card in Tier 2
- [ ] Playable with `degradeNativeApis`
- [ ] Audits clean, no listener growth
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 50 screenshots plus two device captures committed
- [ ] Only quiz was built; no other game exists
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-08-report.md` written

**This phase ends at the architecture go/no-go gate.** The report must state
plainly whether the shell is ready to carry ten more games, and name anything
that will need to change.
