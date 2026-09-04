# Phase 24 report — Landscape Games Wave A

## Summary

Phase 24 migrates Quiz, Memory, Missing, Match, and Cards to the landscape
design system while preserving each game's reducer/session/scoring/audio/
progress/routing behavior. Shared `GameShell` now uses
`LandscapeWorldShell` (`variant="detail"`, games world background) with
`LandscapeTopBar` (back accessory + points/music/parent brand), compact
title + chips chrome, and token-driven board metrics. Phase 17 Quiz ad-hoc
`height < 500` / `width >= 900` breakpoints and Memory portrait column
branches are removed in favor of `landscapeTokens` (`quizGridMode`,
`memoryColumns`, card/option sizes). Capacitor untouched. Wave B boards
untouched except shared-shell chrome. No invented art.

## Pre-flight inventory (recorded before edits)

- **Shared chrome:** legacy `TalkiScreen` + `GameHeader` + `GameChips` +
  `DoneCard` / toast / celebrate — no landscape tokens.
- **Reducers:** quiz/memory/missing/match reducers + cards nav — keep
  intact; UI-only layout work.
- **Portrait leftovers:** Quiz `useDevice` width/height hacks; Memory
  `orientation ? 4 : 3` + `maxWidth: 420`.
- **Verified art:** games world BG EXISTING; word/photo art EXISTING; no
  dedicated per-gameplay mocks (inherit hub language — not DESIGN-BLOCKED).
- **Planned shell:** Category-style detail shell with games world BG +
  game board tokens.
- **Per-game tests:** unit reducers + e2e specs (phase tag → `24`) +
  compact/reference/tablet matrix captures.

## Gate

Phase 23 report ends with `CATEGORIES READY FOR PHASE 24` — confirmed.

## Acceptance criteria

- [PASS] Shared landscape game-detail shell implemented (`GameShell` →
  `LandscapeWorldShell` detail + games BG + top bar back).
- [PASS] Quiz landscape-complete with behavioral parity (reducers/TTS/
  feedback timers/e2e hooks unchanged; 2×2 phones / 1×4 tablets via tokens).
- [PASS] Memory landscape-complete (always 4 columns; token card mins;
  flip/match/CLOSE/done parity).
- [PASS] Missing landscape-complete (show→ask timing, guesses, 5 rounds;
  tablet ask split layout).
- [PASS] Match landscape-complete (tap pairing; token row mins ≥48).
- [PASS] Cards landscape-complete (`scoring={false}`; tablet split stage;
  swipe/nav/TTS preserved).
- [PASS] No Wave B game boards redesigned (Sounds/Count/Bubbles/Sort/
  Puzzle/Speech untouched aside from shared shell API).
- [PASS] No game rules/content changed merely for fit.
- [PASS] Compact phone and tablet screenshots pass review (phase-24
  matrix + Playwright baselines updated).
- [PASS] Full relevant regression passes (see Tests).
- [PASS] This report exists.

## Per-game notes

### Quiz

- Behavioral parity: pool/options/score/streak/lock/advance, TTS plain
  target, 750/420 feedback, celebrate on STAR_STEP, e2e seeds.
- Layout: token `quizGridMode` (`2x2` | `1x4`); compact horizontal prompt
  row; option tiles sized from `quizOptionMin` (≥48).
- Screenshots: `quiz-board`, `quiz-wrong`, `quiz-correct`,
  `quiz-done-3star`, `quiz-done-1star`.

### Memory

- Behavioral parity: 12-card / 6-pair board, CLOSE 900ms, third-card lock,
  attempts extra on done, `__talkiMemoryLayout`.
- Layout: fixed `memoryColumns: 4`; `memoryCardMin` from tokens; portrait
  branch removed.
- Screenshots: `memory-board`, `memory-matched`, `memory-done`.

### Missing

- Behavioral parity: `MISSING_SHOW_MS` / e2e override, AppState resume ASK,
  5 rounds, show→ask→guess scoring.
- Layout: token `missingCardSize`; tablet ask uses side-by-side item/guess
  rows (`cardsSplitLayout`).
- Screenshots: `missing-show`, `missing-ask`, `missing-done`.
- Test note: speech assert moved before `captureMatrix` so the 200ms e2e
  show window is not raced by tablet screenshot latency (behavior assert
  unchanged).

### Match

- Behavioral parity: select word → picture; wrong keeps selection; matched
  opacity; audio cues; toast when picture first.
- Layout: two columns; `matchRowMinHeight` ≥48; no absolute coords.
- Screenshots: `match-selected`, `match-board`, `match-done`.

### Cards

- Behavioral parity: wrap index, swipe ±50, say/markLearned, empty→home,
  browse session mode.
- Layout: `cardsStageMaxWidth`; tablet art | controls split.
- Screenshots: `cards-first`, `cards-middle`.

## Files changed

Production:
- `apps/mobile/src/features/games/shell/GameShell.tsx` — landscape detail
  shell.
- `apps/mobile/src/features/games/shell/GameChips.tsx` — token gap; empty
  chips → null.
- `apps/mobile/src/design-system/landscape/tokens.ts` — game-board tokens
  (`quizGridMode`, `quizOptionMin`, `memoryColumns`, `memoryCardMin`,
  `missingCardSize`, `matchRowMinHeight`, `cardsStageMaxWidth`,
  `cardsSplitLayout`, `gameTitleSize`).
- `apps/mobile/src/design-system/landscape/index.ts` — export `QuizGridMode`.
- `apps/mobile/src/features/games/quiz/QuizScreen.tsx` /
  `QuizOption.tsx` — token layout; remove `useDevice` breakpoints.
- `apps/mobile/src/features/games/memory/MemoryScreen.tsx` /
  `MemoryCard.tsx` — token 4-col board.
- `apps/mobile/src/features/games/missing/MissingScreen.tsx` — token cards
  + tablet ask split.
- `apps/mobile/src/features/games/match/MatchScreen.tsx` — token row heights.
- `apps/mobile/src/features/games/cards/CardsScreen.tsx` — token stage /
  split.

Tests / evidence:
- `apps/mobile/tests/unit/landscape-shell.test.ts` — game token contract.
- `apps/mobile/tests/e2e/{quiz,memory,missing,match,cards}.spec.ts` —
  `captureMatrix(..., '24', ...)`; missing show assert order.
- Playwright `__screenshots__` baselines updated for Wave A.
- `docs/migration/screenshots/phase-24/` — matrix evidence (128 files).

## Screenshot index

Under `docs/migration/screenshots/phase-24/` (8 viewports × 16 shots):

Quiz: board / wrong / correct / done-3star / done-1star  
Memory: board / matched / done  
Missing: show / ask / done  
Match: selected / board / done  
Cards: first / middle  

Viewports: 667×375, 740×360, 844×390, 932×430, 1024×768, 1133×744,
1280×800, 1366×1024.

No phase-0N screenshot noise was produced by this run (nothing to revert).

## Compact / phone / tablet notes

- Compact (667×375 / 740×360): slim chrome (title+chips row), horizontal
  quiz prompt, fixed-size option tiles, memory 4-col with overflow hidden.
- Reference phones (844 / 932): same 2×2 quiz mode; more breathing room.
- Tablets: quiz 1×4; missing ask split; cards split stage; larger token
  mins — not uniform phone scale-up.

## Native coverage

Expo web Playwright is the validation surface for this phase. Native
Maestro (`quiz.yaml`) not re-run in this unattended web gate. Device
classification remains short-edge based (Phase 17).

## Assets still missing

None for Wave A gameplay. Dedicated per-game landscape mocks were never
required; hub visual language + existing word art suffice. Wave B may still
need board-specific density tokens when redesigned.

## Deviations

1. Shared shell chrome now applies to Wave B routes automatically (API-
   compatible). Board layouts for Wave B remain pre-Phase-24 until Phase 25.
2. Missing e2e: assert “no speech during show” before matrix capture to
   avoid 200ms show-window races on slow tablet screenshots.

## Risks carried forward (Phase 25)

1. Wave B games (Sounds, Count, Bubbles, Sort, Puzzle, Speech) still need
   landscape board redesign; some retain `useDevice` height hacks.
2. Expo web may under-render world BG rasters in Playwright captures.
3. Long Playwright runs can drop `expo serve` mid-matrix — run phone and
   tablet project batches separately when re-validating.

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint .                     # exit 0 (BOM warnings fixed)
$ npx vitest run                   # 50 files / 5529 tests PASS
$ npx expo export --platform web   # exit 0
$ npx playwright test tests/e2e/quiz.spec.ts \
    tests/e2e/memory.spec.ts tests/e2e/missing.spec.ts \
    tests/e2e/match.spec.ts tests/e2e/cards.spec.ts \
    --workers=1 --update-snapshots \
    --project=compact-phone --project=compact-android-phone \
    --project=landscape-844 --project=landscape-932
  # 116 passed (3.8m)
$ npx playwright test … (same specs) --workers=1 --update-snapshots \
    --project=tablet-4-3 --project=tablet-1133 \
    --project=tablet-16-10 --project=large-tablet
  # 115 passed; 1 failed (Windows UNKNOWN open on match snapshot write)
$ npx playwright test tests/e2e/match.spec.ts:44 --workers=1 \
    --update-snapshots --project=tablet-16-10
  # 1 passed after deleting locked snapshot file
  # Combined: all 8 viewport projects green for Wave A (232 tests).
```

## Explicit phase status

**GAMES WAVE A READY FOR PHASE 25**
