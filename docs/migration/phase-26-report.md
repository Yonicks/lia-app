# Phase 26 report — Landscape Practice Activities

## Summary

Phase 26 migrates all six practice activity screens onto a shared
landscape `PracticeShell` (GameShell chrome + practice world background)
with Phase 26 board metrics in `landscapeTokens`. Hardcoded board sizes
are replaced by DeviceClass tokens; Combine gains a tablet split layout.
Reducers/session/content/timing/audio/TTS/progress/completion are
unchanged. Practice hub (Phase 22) remains intact. Capacitor untouched.
No Parent/Rewards work. Phase 27 not started.

This phase completes the **Child Feature Completion Gate**: categories
(Phase 23), games Wave A/B (Phases 24–25), and practice activities
(Phase 26) are landscape-complete with hub↔detail reachability preserved.

## Pre-flight inventory (recorded before edits)

- **Modes (authoritative):** `PRACTICE_LIST` / `practiceRegistry` — focus,
  receptive, cloze, temptation, pairs, combine (6/6).
- **Chrome:** every mode already wrapped `PracticeGate` → `GameShell`
  (games world BG); boards used fixed `fontSize` / `minHeight` / `%`
  flexBasis — no `useLandscapeLayout` / practice tokens.
- **Reusable seams:** `GameShell`, `useGameSession`, `PracticeGate`,
  `landscapeTokens`, `landscapeBackgrounds.practice`, WordArt.
- **Proposed shell:** `PracticeShell` = GameShell with `world="practice"`;
  extend GameShell with optional `world` prop (games default).
- **Assets:** practice world BG EXISTING; no per-mode activity mocks
  (inherit hub language — not DESIGN-BLOCKED).
- **Behavior to preserve:** all six reducers, `practiceTimings`, TTS/
  speech recognition (temptation), bespoke focus done card, cloze wait
  5s, combine finish delay, progress markLearned/recordSeen.
- **Validation:** tsc, eslint, vitest, expo export, Playwright six mode
  specs × 8 viewports with update-snapshots; native N/A if no device.

## Gate

Phase 25 report ends with `GAMES WAVE B READY FOR PHASE 26` — confirmed.

## Acceptance criteria

- [PASS] Every current practice mode is landscape-complete (6/6).
- [PASS] Shared practice-detail shell (`PracticeShell`) reused by all
  modes + PracticeGate loading state.
- [PASS] Practice session/content/timing behavior preserved (reducers +
  unit tests + e2e paths unchanged in methodology).
- [PASS] Audio/TTS behavior preserved (speechSpy assertions still green).
- [PASS] Progress/completion/navigation preserved (DoneCard / focus
  bespoke done / back / restart).
- [PASS] No current practice mode missing from hub or detail coverage
  (registry ↔ route ↔ hub cards 1:1).
- [PASS] No portrait-only child practice path remains active (boards use
  landscape tokens only; no Dimensions/local breakpoints).
- [PASS] Compact phone and tablet evidence passes (8 viewport projects).
- [PASS] Full relevant regression passes (see Tests).
- [PASS] This report exists.

## Per-mode notes

### Focus

- Behavioral parity: 8 carriers, tap advance, speak-once per step,
  bespoke done (scoring=false), markLearned / recordSeen on last step.
- Layout: `practiceArtSize` / `practiceWordSize` / `practicePhraseSize`
  + token gaps; no ScrollView.
- Screenshots: `focus-step1`, `focus-done`.

### Receptive

- Behavioral parity: level-driven option count (2→4), columns from
  reducer, replay TTS, correct/wrong delays, DoneCard on complete.
- Layout: `practiceOptionMin` tiles; wrap grid; instruction + replay.
- Screenshots: `receptive-level2`, `receptive-level4`.

### Cloze

- Behavioral parity: say → wait (5s) → model; parent “היא אמרה” scores;
  e2e wait/say hooks unchanged.
- Layout: phrase/actions centered with `practicePhraseSize`; row of
  action buttons; maxWidth from `cardsStageMaxWidth`.
- Screenshots: `cloze-say`, `cloze-wait`, `cloze-model`.

### Temptation

- Behavioral parity: closed jar prompt, mic any-speech open, manual
  open, no failure path, next jar.
- Layout: `practiceJarSize` / `practiceArtSize` when opened; action row.
- Screenshots: `temptation-closed`, `temptation-open`.
- Native speech recognition: product path; web uses stub hooks in e2e.

### Pairs

- Behavioral parity: two near-homophones, replay TTS, correct/wrong
  feedback speech, advance delay.
- Layout: two `practiceOptionMin` cards with labels.
- Screenshots: `pairs-board`.

### Combine

- Behavioral parity: 4 modifiers + picture picks, phrase build, expand
  TTS, COMBINE_ROUNDS finish delay.
- Layout: `practiceModMin` / `practiceModArtSize` / `practiceOptionMin`;
  `practiceCombineSplitLayout` on tablets (mods | pics side-by-side).
- Screenshots: `combine-board`, `combine-phrase`.

## Hub → detail reachability matrix

| Mode | Hub card | Route | Activity screen | Registry |
|------|----------|-------|-----------------|----------|
| focus | PASS | `/practice/focus` | FocusScreen | PASS |
| receptive | PASS | `/practice/receptive` | ReceptiveScreen | PASS |
| cloze | PASS | `/practice/cloze` | ClozeScreen | PASS |
| temptation | PASS | `/practice/temptation` | TemptationScreen | PASS |
| pairs | PASS | `/practice/pairs` | PairsScreen | PASS |
| combine | PASS | `/practice/combine` | CombineScreen | PASS |

Route `app/practice/[id].tsx` now resolves via `practiceRegistry` (DRY
with catalog). Phase 22 hub e2e already launches all six cards; Phase 26
mode specs exercise session paths.

## Child Feature Completion Gate evidence

| Child feature area | Status | Evidence |
|--------------------|--------|----------|
| Categories / words reachable | PASS | Phase 23 landscape category/word grid; domain vocabulary + progress stores untouched this phase; vitest green. |
| Games landscape-complete | PASS | Phases 24–25 Wave A/B reports; gameRegistry + GameShell; no game edits in Phase 26. |
| Practice modes landscape-complete | PASS | This phase — 6/6 PracticeShell + tokens; hub Phase 22; e2e 168 green. |
| Progress / audio / storage intact | PASS | Practice reducers/timings unchanged; progressStore markLearned/recordSeen calls preserved; audioEngine music state via PracticeGate; unit + e2e TTS spies pass. |

## Files changed

Production:
- `apps/mobile/src/design-system/landscape/tokens.ts` — practice board
  tokens (`practiceArtSize`, `practiceWordSize`, `practiceOptionMin`,
  `practiceJarSize`, `practicePhraseSize`, `practiceModMin`,
  `practiceModArtSize`, `practiceCombineSplitLayout`).
- `apps/mobile/src/features/games/shell/GameShell.tsx` — optional
  `world: 'games' | 'practice'`.
- `apps/mobile/src/features/practice/shell/PracticeShell.tsx` — shared
  practice-detail frame.
- `apps/mobile/src/features/practice/PracticeGate.tsx` — loading uses
  PracticeShell.
- `apps/mobile/src/features/practice/{focus,receptive,cloze,temptation,pairs,combine}/*Screen.tsx`
  — landscape board metrics.
- `apps/mobile/app/practice/[id].tsx` — registry-driven route.

Tests / evidence:
- `apps/mobile/tests/unit/landscape-shell.test.ts` — Phase 26 token
  contract (+1 test → 5540 total).
- `apps/mobile/tests/e2e/practice-*.spec.ts` — retagged Phase 26;
  `captureMatrix(..., '26', ...)`.
- Playwright `__screenshots__/practice-*.spec.ts/Phase-26-*` baselines
  (48 files, 6 modes × 8 projects).
- `docs/migration/screenshots/phase-26/` — matrix evidence (96 files).

Reverted noise (not committed as intentional):
- Accidental `*.generated.ts` and `theme.test.ts.snap` diffs from export/
  vitest — restored via `git checkout`.
- No phase-0N screenshot noise produced by this run.

## Screenshot index

Under `docs/migration/screenshots/phase-26/` (8 viewports × 12 shots = 96):

Focus: step1 / done  
Receptive: level2 / level4  
Cloze: say / wait / model  
Temptation: closed / open  
Pairs: board  
Combine: board / phrase  

Viewports: 667×375, 740×360, 844×390, 932×430, 1024×768, 1133×744,
1280×800, 1366×1024.

## Compact phone result

667×375 and 740×360: tightened gaps/pads via compactPhone tokens; option
mins ≥48; Focus stimulus/phrase remain visible without vertical scroll;
Combine stays stacked (no split); touch/reachability audits clean.

## Modern / large phone result

844×390 and 932×430: same phone layouts with more breathing room;
practice world BG cover crop; all mode boards and done/phase shots
captured.

## Tablet result

1024×768, 1133×744, 1280×800, 1366×1024: larger art/option/jar tokens;
Combine uses `practiceCombineSplitLayout` (mods column | picture grid);
no uniform phone×scale blow-up; audits clean.

## Native coverage

N/A — no physical iOS/Android device attached in this unattended run.
Expo web Playwright is the validation surface (same as Phases 24–25).
Temptation speech recognition remains a native-product path; web e2e
uses support/result stubs and does not fake native attestation. Device
classification remains short-edge based (Phase 17).

## Assets still missing

- Committed landscape reference crops (`practice.png` / `home.png` /
  `games.png`) remain absent from `docs/design/landscape/reference/` —
  hub and activities inherit existing production practice world BG +
  word art (same posture as Wave B: not DESIGN-BLOCKED for activity
  boards).
- No invented placeholder practice activity art.

## Behavior parity

- Reducers: focus / receptive / cloze / temptation / pairs / combine —
  **unchanged**.
- Timings: `CLOZE_WAIT_MS`, `TEMPTATION_LISTEN_MS`, `COMBINE_ROUNDS`,
  finish delays — **unchanged**.
- Audio/TTS/speech recognition call sites — **preserved**.
- Progress markLearned / recordSeen — **preserved**.
- Layout-only migration; no mode deletion or methodology simplification.

## Deviations

- Practice activities previously used games world BG via GameShell; now
  use practice world BG via PracticeShell (intentional Phase 26 shell
  alignment with hub).
- Cloze action buttons use a horizontal wrap row on all classes (fits
  short landscape height better than a tall stack); scoring semantics
  unchanged.
- No dedicated per-mode landscape mock images — visual language inherits
  Practice hub + shared chrome (documented; not a gate failure).

## Risks carried forward

1. Temptation / Speech native recognition still needs device QA when
   hardware is available (web stubs only).
2. Expo web raster paint of landscape backgrounds may differ slightly
   from native cover crop (known test-surface limitation).
3. Long Playwright runs can drop `expo serve` mid-matrix — phone and
   tablet batches were run separately; re-export `dist` after code
   changes before e2e.

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint .                     # exit 0
$ npx vitest run                   # 51 files / 5540 tests PASS
$ npx expo export --platform web   # exit 0
$ npx playwright test \
    tests/e2e/practice-focus.spec.ts \
    tests/e2e/practice-receptive.spec.ts \
    tests/e2e/practice-cloze.spec.ts \
    tests/e2e/practice-temptation.spec.ts \
    tests/e2e/practice-pairs.spec.ts \
    tests/e2e/practice-combine.spec.ts \
    --workers=1 --update-snapshots \
    --project=compact-phone --project=compact-android-phone \
    --project=landscape-844 --project=landscape-932
  # 84 passed (~2.5m)
$ npx playwright test … (same specs) --workers=1 --update-snapshots \
    --project=tablet-4-3 --project=tablet-1133 \
    --project=tablet-16-10 --project=large-tablet
  # 84 passed (~2.7m)
  # Combined: all 8 viewport projects green for practice activities (168 tests).
```

## Explicit phase status

CHILD FEATURE COMPLETION GATE PASSED
