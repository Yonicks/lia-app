# Phase 25 report — Landscape Games Wave B

## Summary

Phase 25 migrates Sounds, Count, Bubbles, Sort, Puzzle, and Speech onto the
shared Phase 24 landscape `GameShell` with Wave B board metrics in
`landscapeTokens`. Portrait/`useDevice` height hacks are removed. Bubbles
spawn from the measured play-area rectangle; Count density fits n≤5 without
overflow; Puzzle/Sort use board-local coordinates for hit/drop geometry;
Speech keeps recognition/permission semantics with safe-area-aware mic
chrome. Reducers/session/scoring/audio/progress unchanged. Capacitor
untouched. No invented art. Phase 26 not started.

## Pre-flight inventory (recorded before edits)

- **Shared chrome:** Phase 24 `GameShell` + landscape tokens — reuse.
- **Wave B boards:** Sounds (`height < 500` compact hack), Count (fixed
  pic max), Bubbles (global-ish % spawn + no stage measure), Sort (tap
  boxes), Puzzle (`useDevice` capacity), Speech (flat centered box).
- **Gesture/native seams:** Bubbles rise; Puzzle drag/snap via
  `puzzleHit` + `measureInWindow`; Speech `speechRecognitionService` +
  flag default off.
- **Verified art:** games world BG + word art EXISTING; no dedicated
  Wave B gameplay mocks (inherit hub language — not DESIGN-BLOCKED).
- **Planned:** Wave B tokens; stage-local bubble spawn; count density
  helper; board-local puzzle/sort coords; e2e phase tag `25` + geometry
  asserts; native Speech status explicit (no fake attestation).

## Gate

Phase 24 report ends with `GAMES WAVE A READY FOR PHASE 25` — confirmed.

## Acceptance criteria

- [PASS] Sounds landscape-complete with behavioral parity (options/
  replay/onomatopoeia/progress; token option mins; phone split layout).
- [PASS] Count landscape-complete with behavioral parity; density helper
  keeps n=1..5 inside measured stage ≥48 dp.
- [PASS] Bubbles landscape-complete and bound-safe (`bubbleSpawnLayout`
  from measured stage; native Reanimated rise; web static for Playwright
  stability + `__talkiBubblesFreeze` for screenshots).
- [PASS] Sort landscape-complete; tap semantics preserved; drop zones
  measured board-local; tablet split layout.
- [PASS] Puzzle landscape-complete; capacity from
  `useLandscapeLayout` usable geometry; drag/snap uses board-local
  coords; token piece mins.
- [PASS] Speech landscape-complete; mic/skip/say chrome; safe-area
  bottom padding; **native coverage explicitly reported (not attested)**.
- [PASS] No game rules/content changed merely for fit.
- [PASS] No portrait-coordinate assumptions remain active in migrated
  Wave B boards (`useDevice` / `height < 500` removed).
- [PASS] Compact phone and tablet evidence passes (8 viewport projects).
- [PASS] Full relevant regression passes (see Tests).
- [PASS] This report exists.

## Per-game notes

### Sounds

- Behavioral parity: animals-only pool, onomatopoeia replay, 3 options,
  6 rounds, placeCorrectAt e2e hook, celebrate on STAR_STEP.
- Layout: `soundsOptionMin` + `soundsSplitLayout` (phones: prompt | row;
  tablets: stacked).
- Screenshots: `sounds-board`, `sounds-done`.
- Audio: entry speak once; replay increments spy; rapid answer lock
  preserved.

### Count

- Behavioral parity: n∈[1,5], 3 options, 5 rounds, NUM_WORDS TTS.
- Density: `countPicSize` / `countFitsStage` from measured stage width +
  `countPicMax` / `countOptionMin` tokens.
- Screenshots: `count-board`, `count-done`.
- E2E asserts stage `scrollWidth` does not exceed client width.

### Bubbles

- Behavioral parity: 12 pops, spawner stagger/interval, say+learn on pop.
- Geometry: `bubbleSpawnLayout(rnd, stage)` clamps size/start/drift to
  measured stage; unit + e2e spawn-bound checks.
- Motion: native Reanimated rise by stage height (not `105vh`); web keeps
  static spawn positions so Playwright screenshots stay stable (Expo web
  is the test surface; native rise is the product motion path).
- Screenshots: `bubbles-stage` (after `__talkiBubblesFreeze`).

### Sort

- Behavioral parity: two category boxes, tap answer (not drag in current
  product), 6 rounds, correctMatch audio.
- Layout: `sortBoxMinHeight` ≥48; `sortSplitLayout` on tablets
  (prompt | stacked boxes).
- Geometry: board-local box rects via `measureInWindow`; e2e verifies
  boxes ≥48 and inside board bounds.
- Screenshots: `sort-board`, `sort-done`.

### Puzzle

- Behavioral parity: capacity/level/pick/place/hint/finish/advance
  unchanged; finish delay e2e hook.
- Capacity input: `layout.usableHeight` / `usableWidth` (centralized),
  not raw `useDevice`.
- Drag/snap: page coords converted to board-local before
  `puzzleSlotUnder`; slots store board-local rects; `puzzlePieceMin`
  tokens.
- Screenshots: `puzzle-board-2`, `puzzle-board-6`, `puzzle-hint`,
  `puzzle-done`.

### Speech

- Behavioral parity: flag-gated enablement, unsupported fallback,
  listen/result/skip, levenshtein match, progress/audio.
- Layout: `speechArtSize`; bottom pad uses `safeInsets.bottom` so mic
  is not clipped; tablet row wrap for controls.
- Screenshots: `speech-unsupported`, `speech-board` (forced supported).

## Speech native coverage status

**Not attested in this unattended Phase 25 run.**

- Expo web Playwright covers unsupported UI and forced-supported board /
  skip / mic visibility (including viewport clip check).
- `SPEECH_GAME_ENABLED_DEFAULT` remains `false`; real he-IL recognition
  on device was never claimed here.
- Web mocks do **not** count as native attestation (per phase plan).
- Carry forward: Maestro/device Tier verification remains for a later
  native gate (e.g. Phase 29), not Phase 25.

## Files changed

Production:
- `apps/mobile/src/design-system/landscape/tokens.ts` — Wave B tokens.
- `apps/mobile/src/features/games/sounds/SoundsScreen.tsx`
- `apps/mobile/src/features/games/count/CountScreen.tsx` + `countDensity.ts`
- `apps/mobile/src/features/games/bubbles/{BubblesScreen,BubbleView,bubbleSpawn,bubblesReducer}.ts(x)`
- `apps/mobile/src/features/games/sort/SortScreen.tsx`
- `apps/mobile/src/features/games/puzzle/{PuzzleScreen,PuzzlePiece,PuzzleSlot}.tsx`
- `apps/mobile/src/features/games/speech/SpeechScreen.tsx`

Tests / evidence:
- `apps/mobile/tests/unit/landscape-shell.test.ts` — Wave B token contract.
- `apps/mobile/tests/unit/bubbles-reducer.test.ts` — stage-bound spawn.
- `apps/mobile/tests/unit/wave-b-geometry.test.ts` — count/puzzle/sort
  geometry.
- `apps/mobile/tests/e2e/{sounds,count,bubbles,sort,puzzle,speech}.spec.ts`
  — `captureMatrix(..., '25', ...)`; geometry asserts.
- Playwright `__screenshots__` baselines updated for Wave B.
- `docs/migration/screenshots/phase-25/` — matrix evidence (104 files).

## Screenshot index

Under `docs/migration/screenshots/phase-25/` (8 viewports × 13 shots = 104):

Sounds: board / done  
Count: board / done  
Bubbles: stage  
Sort: board / done  
Puzzle: board-2 / board-6 / hint / done  
Speech: unsupported / board  

Viewports: 667×375, 740×360, 844×390, 932×430, 1024×768, 1133×744,
1280×800, 1366×1024.

No phase-0N screenshot noise was produced by this run (nothing to revert).

## Compact / phone / tablet notes

- Compact (667×375 / 740×360): Sounds/Count/Sort use compact token mins;
  bubble sizes clamped to short stage height; puzzle capacity 3 at high
  level.
- Reference phones (844 / 932): same phone layouts with more room.
- Tablets: Sounds stacked; Sort split; larger piece/option/bubble tokens;
  Speech art larger — not uniform phone scale-up.

## Native coverage

Expo web Playwright is the validation surface for this phase. Bubbles
rise motion and Speech recognition are native-product paths; web does
not fake Speech native attestation. Device classification remains
short-edge based (Phase 17).

## Assets still missing

None for Wave B gameplay. Dedicated per-game landscape mocks were never
required; hub visual language + existing word art suffice.

## Deviations

1. Bubbles on Expo web render at static spawn positions (no continuous
   rise) so Playwright screenshots/clicks stay stable; native uses
   Reanimated rise within the measured stage. Product target remains
   native motion.
2. Sort remains tap-to-box (current behavioral truth); drag/drop was not
   invented. Board-local geometry is recorded for zones and tested.

## Risks carried forward (Phase 26)

1. Practice activities still need landscape redesign (Phase 26).
2. Speech native he-IL recognition still unverified on device.
3. Long Playwright runs can drop `expo serve` mid-matrix — phone and
   tablet batches were run separately; re-export `dist` after code
   changes before e2e (`expo serve` serves export, not Metro HMR).

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint .                     # exit 0
$ npx vitest run                   # 51 files / 5539 tests PASS
$ npx expo export --platform web   # exit 0 (re-exported after bubble freeze)
$ npx playwright test tests/e2e/sounds.spec.ts \
    tests/e2e/count.spec.ts tests/e2e/bubbles.spec.ts \
    tests/e2e/sort.spec.ts tests/e2e/puzzle.spec.ts \
    tests/e2e/speech.spec.ts \
    --workers=1 --update-snapshots \
    --project=compact-phone --project=compact-android-phone \
    --project=landscape-844 --project=landscape-932
  # 84 passed (~3.5m)
$ npx playwright test … (same specs) --workers=1 --update-snapshots \
    --project=tablet-4-3 --project=tablet-1133 \
    --project=tablet-16-10 --project=large-tablet
  # 84 passed (~3.8m)
  # Combined: all 8 viewport projects green for Wave B (168 tests).
```

## Explicit phase status

GAMES WAVE B READY FOR PHASE 26
