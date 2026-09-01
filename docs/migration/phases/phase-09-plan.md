# Phase 9 — Games wave A: memory, missing, match, cards

**Prompt:** [../prompts/phase-09.md](../prompts/phase-09.md)
**Creates:** four game features on the Phase 8 shell
**Ships:** five of eleven games playable

---

## Goal and rationale

Port four games that exercise the shell in four different ways, and find out
where the Phase 8 abstraction is too narrow while there is still time to widen
it cheaply.

The four are chosen for their differences, not their similarity:

| Game | What it stresses |
|---|---|
| memory | a card grid with flip state and a timed auto-close |
| missing | a two-phase round driven by a 2600 ms timer |
| match | two-column selection with a pending selection across taps |
| cards | not a scored game at all — a browsing flow with swipe |

If the shell survives all four, it will very likely survive wave B. If it does
not, the extension happens here rather than being worked around five times.

## Entry conditions

- `docs/migration/phase-08-report.md` exists, and its architecture go/no-go says
  proceed.
- `GameShell`, `useGameSession` and `DoneCard` are in place.

## Design decisions

### Extend the shell, never fork it

Two of these games need something quiz did not: `missing` needs a timed phase
transition, and `cards` needs a shell without scoring or a done card.

The rule is that the shell grows to accommodate them. A `GameShell` variant
with `scoring: false`, and a timer utility owned by `useGameSession`, are
correct outcomes. Four bespoke screens that each re-implement the header are
not.

Any extension must be recorded in the report so Phase 10 knows what it inherits.

### Timers belong to the session, not the component

`missing` uses `setTimeout(..., 2600)` to move from `show` to `ask`. `memory`
uses a delay before closing a non-matching pair.

Both must be cancelled when the screen unmounts, or a timer fires against a
dead component. This is a classic React Native leak and it is exactly the kind
of thing `tests/interaction_suite.py` catches in the legacy app through its
listener-growth test. `useGameSession` gets a managed timer helper, and a test
asserts that navigating away mid-round leaves no pending timer.

### `cards` is a browsing flow and must not be forced into a game shape

`renderCards()` (index.html 2329-2351) has no score, no rounds and no
completion. It is a flashcard browser with previous, next, replay and swipe.

Making it a `GameDefinition` with a fake score would be a worse abstraction than
letting the shell support a non-scored variant. It also happens to be the only
place in the app with a swipe gesture, so it is where
`react-native-gesture-handler` first earns its dependency.

### Per-game legacy specifics

Each game's numbers come from `startGame` and its setup function, not from
memory:

**memory** (index.html 2503-2508, 2583-2597, 3512-3533)
```
picks   weightedPick(cat.items, cat.id, 6)
cards   shuffle(picks.flatMap((it, n) => [{pair:n, kind:'pic', it}, {pair:n, kind:'word', it}]))
        then .map((c, i) => ({...c, idx:i, open:false, matched:false}))
state   { cards, first, moves, found, total, locked, done }
done    doneCard(total, total, 0, `סיימת ב-${moves} ניסיונות`)
chips   `זוגות ${found}/${total}`, `ניסיונות ${moves}`
```
Twelve cards: six pairs, each pair one picture and one word.

**missing** (index.html 2509-2511, 2600-2626, 3535-3558)
```
set        shuffle(weightedPick(cat.items, cat.id, 4))
missing    a random member of set
phase      'show' -> after 2600 ms -> 'ask'
askOrder   shuffle(set)
rounds     5
done       doneCard(score, 5, 0)
chips      `סיבוב ${round+1}/5`, `✅ ${score}`
```
During `show` the option buttons are disabled. The prompt is spoken once the
picture is gone, guarded by `asked`.

**match** (index.html 2512-2514, 2629-2640, 3560-3577)
```
picks   weightedPick(cat.items, cat.id, min(5, items.length))
state   { left: shuffle(picks), right: shuffle(picks), sel, matched[], done }
done    doneCard(left.length, left.length, 0)
chips   `חוברו ${matched.length}/${left.length}`
```
Left column is words, right column is pictures. Tap a word, then a picture.

**cards** (index.html 2329-2351, 3457-3479)
```
state   cardIdx, clamped to [0, items.length - 1]
nav     prev, next, say
swipe   left and right change the word
header  `${cardIdx+1}/${items.length}`
empty   an empty category goes home
```

## Files to be created

```
apps/mobile/src/features/games/
├── memory/   MemoryScreen.tsx  memoryReducer.ts  MemoryCard.tsx
├── missing/  MissingScreen.tsx missingReducer.ts
├── match/    MatchScreen.tsx   matchReducer.ts
└── cards/    CardsScreen.tsx   useCardSwipe.ts

apps/mobile/tests/unit/
├── memory-reducer.test.ts
├── missing-reducer.test.ts
├── match-reducer.test.ts
└── cards-navigation.test.ts

apps/mobile/tests/e2e/
├── memory.spec.ts
├── missing.spec.ts
├── match.spec.ts
└── cards.spec.ts

apps/mobile/.maestro/games-wave-a.yaml
```

## testIds introduced

```
memory-root         memory-card-<index>       memory-chip-pairs
missing-root        missing-item-<index>      missing-guess-<index>
                    missing-phase-show        missing-phase-ask
match-root          match-left-<index>        match-right-<index>
cards-root          cards-word                cards-prev
                    cards-next                cards-say
                    cards-counter
```

## Behaviour to preserve exactly

- memory: six pairs, twelve cards, picture plus word.
- memory: a non-matching pair closes after a delay; `moves` counts attempts.
- memory: matched cards stay open and are not re-selectable.
- memory: the done card shows the attempt count in its extra line.
- missing: exactly five rounds.
- missing: `show` lasts 2600 ms and options are disabled during it.
- missing: the prompt is spoken once, after the picture is gone.
- missing: the guess row is `askOrder`, a separate shuffle from the display
  order.
- match: up to five pairs; left words, right pictures.
- match: a selection persists across taps until a picture is chosen.
- match: a wrong pairing does not mark either side done.
- cards: no score, no rounds, no done card.
- cards: index clamps at both ends.
- cards: swipe and buttons both navigate.
- cards: an empty category returns home.
- All four: `markSeen` called with the correct outcome, `weightedPick` used for
  selection, and audio events fired through `AudioEngine`.

## Test plan

### Tier 1

`memory-reducer.test.ts`
- 12 cards from 6 pairs, each pair exactly one `pic` and one `word`
- flipping two matching cards sets both matched and increments `found`
- flipping two non-matching cards increments `moves` and schedules a close
- a matched card cannot be re-selected
- a third card cannot be flipped while two are open
- done when `found === total`

`missing-reducer.test.ts`
- exactly 4 items in `set`
- `missing` is a member of `set`
- `askOrder` is a permutation of `set`
- the `show` to `ask` transition happens on the timer, not on a tap
- a correct guess scores, a wrong guess does not
- done after exactly 5 rounds

`match-reducer.test.ts`
- pairs are `min(5, items.length)`
- left and right contain the same words in different orders
- selecting a word then its picture marks it matched
- selecting a word then a wrong picture matches nothing and clears or keeps the
  selection exactly as legacy does
- done when every word is matched

`cards-navigation.test.ts`
- index clamps at 0 and at `length - 1`
- next and previous move by one
- an empty category is handled without a crash

Plus, for all four: navigating away mid-round leaves no pending timer.

### Tier 2

One spec per game, all ten viewports.

Common to all four:
- the board renders and fits without clipping in landscape
- `burst` on the primary control does not double-count or double-advance
- `auditTouchTargets` and `auditReachability` clean
- `countListeners` shows no growth across ten interactions
- `degradeNativeApis`: the game is still playable
- `toHaveScreenshot()` on the board and, where applicable, the done card
- `captureMatrix` for every state in the manifest

Game-specific:
- memory: a full playthrough matching all six pairs reaches the done card;
  rapid tapping cannot open three cards
- missing: `show` is visibly distinct from `ask`; options are non-interactive
  during `show`; `speechSpy` proves the prompt speaks once and only after the
  transition
- match: selecting a word highlights it; a wrong pairing leaves both sides
  unmatched; a full playthrough completes
- cards: previous and next move through the whole category; the counter is
  correct at both ends; the say button speaks once per press; a swipe changes
  the word

### Tier 3

`.maestro/games-wave-a.yaml` plays one round of each.

Manual attestation, device named:
- memory card flip animation is smooth on a low-end device
- the missing 2600 ms timer feels right and survives a background and return
- match selection is reliable with a small finger on a small screen
- cards swipe works in both directions and does not fight the navigation back
  gesture
- landscape holds for all four

## Screenshot manifest

```
docs/migration/screenshots/phase-09/
    <viewport>-memory-board.png
    <viewport>-memory-matched.png
    <viewport>-memory-done.png
    <viewport>-missing-show.png
    <viewport>-missing-ask.png
    <viewport>-missing-done.png
    <viewport>-match-board.png
    <viewport>-match-selected.png
    <viewport>-match-done.png
    <viewport>-cards-first.png
    <viewport>-cards-middle.png
    android-device-memory-landscape.png
    android-device-cards-swipe.png
```

Eleven states times ten viewports is 110 files, plus two device captures.

## Risks and open questions

**A twelve-card grid in landscape on a 320-wide phone.** Rotated that is
568x320, and twelve cards plus a header is tight. Default: a responsive grid
from the Phase 5 module, four by three in landscape and three by four in
portrait, with the card size derived from available space rather than fixed.
Prove it with a screenshot.

**The 2600 ms timer and app backgrounding.** If the app is backgrounded during
`show`, the timer may fire late or not at all. Default: on resume, if the round
is still in `show` and more than 2600 ms has elapsed, transition immediately.
Record the behaviour.

**Swipe versus the navigation back gesture.** On iOS an edge swipe is the
system back gesture. Default: constrain the card swipe to the card area rather
than the full screen, and verify on a device that back still works.

**`cards` does not fit `GameDefinition`.** Default: add a non-scored shell
variant rather than faking a score. Record the extension.

**The shell may need widening.** Default: widen it and record what changed.
Do not fork it, and do not work around it locally in a game.

## Exit criteria

- [ ] All four games playable end to end
- [ ] All four use `GameShell`; none reimplements the header or done card
- [ ] Any shell extension is recorded in the report for Phase 10
- [ ] memory: 6 pairs, 12 cards, correct match and close behaviour
- [ ] memory: the done card shows the attempt count
- [ ] missing: 5 rounds, 2600 ms `show`, options disabled during `show`
- [ ] missing: the prompt speaks once, after the transition, proven by
      `speechSpy`
- [ ] missing: `askOrder` is a separate shuffle from the display order
- [ ] match: up to 5 pairs, selection persists, wrong pairing marks nothing
- [ ] cards: no score, no done card, index clamps, swipe works both ways
- [ ] cards: an empty category returns home
- [ ] `markSeen` correct in all four
- [ ] No pending timer survives unmounting, asserted by test
- [ ] Rapid tapping cannot double-count in any of the four
- [ ] All four playable under `degradeNativeApis`
- [ ] Audits clean and no listener growth at all ten viewports
- [ ] No clipping in landscape at 320x568 rotated, proven by screenshot
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 110 screenshots plus two device captures committed
- [ ] Only these four games were built
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-09-report.md` written
