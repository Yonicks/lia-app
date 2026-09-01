# Talki — React Native / Expo Migration

This directory is the operational home of the migration from the current
vanilla-JS / Capacitor Talki to a native Expo React Native application.

The strategy document is [`../../Talki — React Native - Expo Migration Master Plan.md`](../../Talki%20—%20React%20Native%20-%20Expo%20Migration%20Master%20Plan.md).
This directory is how that strategy actually gets executed, one phase at a time.

---

## The three documents per phase

Every phase has exactly three documents. They have different audiences and are
written at different times.

```
phases/phase-NN-plan.md      written now      for a human reviewer
        │                                     design, decisions, rejected alternatives,
        │                                     file tree, contracts, test plan
        ▼
prompts/phase-NN.md          written now      for an agent
        │                                     paste-ready, self-contained, cites the plan
        ▼
     agent executes
        │
        ▼
phase-NN-report.md           written by the   evidence: PASS/FAIL per acceptance item,
                             agent            command output, screenshot index
        │
        ▼
    read as input by phase NN+1
```

Read the plan before you run the prompt. The prompt is deliberately narrower —
it inlines the facts an agent needs but not the reasoning behind them.

---

## How to run a phase

1. Read `phases/phase-NN-plan.md` end to end. Disagree with it now, not later.
2. Confirm the previous phase's `phase-(NN-1)-report.md` exists and has no
   critical FAIL.
3. Open a fresh agent session (Cursor or Claude agent mode) at the repository
   root.
4. Copy the entire fenced prompt block out of `prompts/phase-NN.md` and paste
   it as the first message. Do not paraphrase it and do not add extra
   instructions — the guard rails are load-bearing.
5. Let the agent run to completion. It must stop at the end of its phase.
6. Review `phase-NN-report.md` and the screenshots under
   `screenshots/phase-NN/` before starting the next phase.

A fresh session per phase is intentional. Context accumulated from a previous
phase makes an agent more likely to assume rather than re-read the source.

---

## The gate

No phase is complete until all seven hold. The full contract, including the
exact commands, is in [`validation.md`](validation.md).

1. `tsc --noEmit`, `eslint` and `expo-doctor` are clean.
2. `vitest run` is green, including the differential tests against legacy code.
3. `expo export --platform web` succeeds.
4. `playwright test` is green across all ten viewport projects.
5. Screenshots for every screen the phase touched are committed under
   `screenshots/phase-NN/`.
6. The legacy app is still green: both Python suites plus the audio-logic unit
   tests.
7. `phase-NN-report.md` exists with PASS or FAIL per acceptance item and an
   explicit native-coverage section.

Phases with no user interface (2 and 3) replace item 5 with a generated
artifact report. Their prompts say so explicitly.

---

## Phase order

```
PHASE 0   Freeze and audit the migration baseline
PHASE 1   Create the Expo application and the full test harness
PHASE 2   Port the domain model, content and asset registry
PHASE 3   Native persistence and legacy backup compatibility
PHASE 4   Native audio, TTS, recording and orientation services
─────────────────────── TECHNICAL GO / NO-GO ───────────────────────
PHASE 5   Talki native design system and app shell
PHASE 6   Yonicks Studios native opening sequence
PHASE 7   Home, navigation and categories
PHASE 8   Game platform and first full game (quiz)
────────────────────── ARCHITECTURE GO / NO-GO ─────────────────────
PHASE 9   Games wave A — memory, missing, match, cards
PHASE 10  Games wave B — sounds, count, bubbles, sort, puzzle
PHASE 11  Speech practice and speech recognition
PHASE 12  Parent centre, custom words, recordings and rewards
─────────────────────── FEATURE PARITY GATE ────────────────────────
PHASE 13  AdMob and native application configuration
PHASE 14  Full parity, device QA and performance
─────────────────────── RELEASE GO / NO-GO ─────────────────────────
PHASE 15  Native cutover and Capacitor retirement
```

### Index

| Phase | Title | Plan | Prompt |
|------:|-------|------|--------|
| 00 | Freeze and audit the baseline | [plan](phases/phase-00-plan.md) | [prompt](prompts/phase-00.md) |
| 01 | Expo application and test harness | [plan](phases/phase-01-plan.md) | [prompt](prompts/phase-01.md) |
| 02 | Domain model, content, asset registry | [plan](phases/phase-02-plan.md) | [prompt](prompts/phase-02.md) |
| 03 | Persistence and backup compatibility | [plan](phases/phase-03-plan.md) | [prompt](prompts/phase-03.md) |
| 04 | Audio, TTS, recording, orientation | [plan](phases/phase-04-plan.md) | [prompt](prompts/phase-04.md) |
| 05 | Design system and app shell | [plan](phases/phase-05-plan.md) | [prompt](prompts/phase-05.md) |
| 06 | Yonicks Studios opening sequence | [plan](phases/phase-06-plan.md) | [prompt](prompts/phase-06.md) |
| 07 | Home, navigation, categories | [plan](phases/phase-07-plan.md) | [prompt](prompts/phase-07.md) |
| 08 | Game platform and quiz | [plan](phases/phase-08-plan.md) | [prompt](prompts/phase-08.md) |
| 09 | Games wave A | [plan](phases/phase-09-plan.md) | [prompt](prompts/phase-09.md) |
| 10 | Games wave B | [plan](phases/phase-10-plan.md) | [prompt](prompts/phase-10.md) |
| 11 | Speech practice and recognition | [plan](phases/phase-11-plan.md) | [prompt](prompts/phase-11.md) |
| 12 | Parent centre and rewards | [plan](phases/phase-12-plan.md) | [prompt](prompts/phase-12.md) |
| 13 | AdMob and native configuration | [plan](phases/phase-13-plan.md) | [prompt](prompts/phase-13.md) |
| 14 | Parity, device QA, performance | [plan](phases/phase-14-plan.md) | [prompt](prompts/phase-14.md) |
| 15 | Cutover and Capacitor retirement | [plan](phases/phase-15-plan.md) | [prompt](prompts/phase-15.md) |

---

## Directory contents

```
docs/migration/
├── README.md                      this file
├── validation.md                  the harness contract every phase obeys
├── feature-parity-checklist.md    seeded now, completed by Phase 0, graded by Phase 14
├── 00-current-state.md            written by Phase 0
├── phase-NN-report.md             written by each phase as it completes
├── phases/
│   └── phase-NN-plan.md           the design document for each phase
├── prompts/
│   ├── _shared.md                 rules block inlined into every prompt
│   └── phase-NN.md                the paste-ready agent prompt for each phase
├── fixtures/
│   ├── legacy-domain.json         generated in Phase 2 from index.html
│   └── legacy-backup-v1.json      generated in Phase 3 from the running legacy app
└── screenshots/
    ├── legacy-baseline/           captured in Phase 0, the visual reference set
    └── phase-NN/                  per-phase visual evidence
```

---

## Ground rules that outlive any single phase

- The legacy application at the repository root keeps working until Phase 15.
  No phase moves, renames or refactors it.
- `index.html` on the current branch is the primary functional source of truth.
  Documents in `docs/` are secondary and are known to contain stale claims.
- The Expo web target exists so Playwright can drive the app. It is a test
  surface, never a shipping target, and no design decision may be made for its
  benefit.
- Nothing in the legacy source may be edited to make a new test pass.
- No assertion may be weakened, skipped or deleted to turn a run green.
