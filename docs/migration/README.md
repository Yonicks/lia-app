# Talki — React Native / Expo Migration

This directory is the operational home of the migration from the current
vanilla-JS / Capacitor Talki to a native Expo React Native application.

The strategy document is [`../../Talki — React Native - Expo Migration Master Plan.md`](../../Talki%20—%20React%20Native%20-%20Expo%20Migration%20Master%20Plan.md).
This directory is how that strategy actually gets executed, one phase at a time.

> **Current continuation:** Phase 14 ended NO-GO and the historical Phase 15
> cutover attempt correctly STOPPED without retiring Capacitor. The product has
> since moved to a landscape-only phone/tablet redesign. That continuation starts
> at **Phase 16** and is defined in [`landscape-roadmap.md`](landscape-roadmap.md).
> Root agent rules are in [`../../AGENTS.md`](../../AGENTS.md), and landscape
> visual/interaction rules are in [`../design/landscape/README.md`](../design/landscape/README.md).

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

Landscape phases additionally inherit `prompts/_landscape-shared.md` and the
repository-wide `AGENTS.md` contract.

---

## How to run a phase

1. Read `phases/phase-NN-plan.md` end to end. Disagree with it now, not later.
2. Confirm the previous phase's `phase-(NN-1)-report.md` exists and has no
   critical FAIL, unless the active plan explicitly documents why a historical
   stopped phase is being superseded by a new program.
3. Open a fresh agent session (Cursor or Claude agent mode) at the repository
   root.
4. Ask the agent to implement the phase using `prompts/phase-NN.md`; do not add
   conflicting instructions. The repository rules are load-bearing.
5. Let the agent run to completion. It must stop at the end of its phase.
6. Review `phase-NN-report.md` and the screenshots/evidence before starting the
   next phase.

A fresh session per phase is intentional. Context accumulated from a previous
phase makes an agent more likely to assume rather than re-read the source.

---

## The gate

No implementation phase is complete until the applicable validation contract
holds. The original harness is in [`validation.md`](validation.md); landscape
phases may refine the viewport/device matrix in their phase plans without
weakening behavioral coverage.

Baseline expectations remain:

1. `tsc --noEmit`, `eslint` and `expo-doctor` are clean where applicable.
2. `vitest run` is green, including relevant differential/domain tests.
3. `expo export --platform web` succeeds.
4. Relevant Playwright coverage is green across the active viewport matrix.
5. Screenshots/evidence for every screen touched are committed under the phase.
6. Legacy regression remains green until the final cutover explicitly retires it.
7. `phase-NN-report.md` exists with PASS/FAIL/BLOCKED evidence and an explicit
   native-coverage section.

Documentation/audit-only phases replace visual implementation evidence with the
artifacts named by the phase plan.

---

## Historical Phase order (0–15)

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
PHASE 14  Full parity, device QA and performance  → NO-GO
─────────────────────── RELEASE GO / NO-GO ─────────────────────────
PHASE 15  Native cutover attempt                         → STOPPED
```

Phase 15 is historical evidence. It must not be re-run as the next step.

## Landscape Redesign Phase order (16–30)

The authoritative detail is [`landscape-roadmap.md`](landscape-roadmap.md).

```
PHASE 16  Landscape rebaseline and design contract
PHASE 17  Landscape runtime and responsive foundation
PHASE 18  Landscape design system and world shell
PHASE 19  Navigation architecture
──────────── FOUNDATION GATE ────────────
PHASE 20  Home hub
PHASE 21  Games hub
PHASE 22  Practice hub
PHASE 23  Categories and vocabulary
PHASE 24  Games wave A
PHASE 25  Games wave B
PHASE 26  Practice activities
──────── CHILD FEATURE COMPLETION GATE ────────
PHASE 27  Rewards and Parent Center
PHASE 28  Intro, overlays, ads, accessibility, global polish
──────────── PRODUCT COMPLETION GATE ────────────
PHASE 29  Full landscape native QA and release gate
──────────── LANDSCAPE RELEASE GO / NO-GO ────────────
PHASE 30  Native cutover and Capacitor retirement
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
| 15 | Cutover attempt (stopped) | [plan](phases/phase-15-plan.md) | [prompt](prompts/phase-15.md) |
| 16 | Landscape rebaseline and design contract | [plan](phases/phase-16-plan.md) | [prompt](prompts/phase-16.md) |
| 17–30 | Landscape redesign continuation | [roadmap](landscape-roadmap.md) | plans/prompts created phase-by-phase |

---

## Directory contents

```
docs/migration/
├── README.md                      this file
├── validation.md                  original harness contract
├── landscape-roadmap.md           landscape redesign program, phases 16–30
├── feature-parity-checklist.md    historical parity evidence
├── 00-current-state.md            historical baseline
├── phase-NN-report.md             written by each phase as it completes
├── phases/
│   ├── phase-00-plan.md ...
│   └── phase-16-plan.md           first landscape program plan
├── prompts/
│   ├── _shared.md                 original migration shared rules
│   ├── _landscape-shared.md       shared landscape program rules
│   └── phase-NN.md                paste-ready agent prompt
├── fixtures/
└── screenshots/
```

Landscape visual contracts and references live under:

`docs/design/landscape/`

---

## Ground rules that outlive any single phase

- Read and obey root `AGENTS.md` first.
- The legacy application at the repository root keeps working until Phase 30
  explicitly completes cutover. Landscape implementation phases do not retire it.
- Current source code is the primary behavioral source of truth. Historical
  documents are evidence/context and may contain stale implementation claims.
- The Expo web target exists so Playwright can drive the app. It is a test
  surface, never the shipping UX target, and no design decision may be made only
  for its benefit.
- Nothing in the legacy source may be edited merely to make a new Expo test pass.
- No assertion may be weakened, skipped or deleted merely to turn a run green.
- Landscape visual truth lives in `docs/design/landscape/reference/` plus the
  design contract, while feature completeness comes from current code/domain.
