# Talki Landscape Redesign Roadmap

## Why this roadmap exists

The original React Native / Expo migration reached Phase 14, whose release gate was NO-GO. The subsequent historical Phase 15 cutover attempt correctly stopped and left Capacitor intact.

The product direction then changed materially: the child-facing experience is now a **landscape-only phone/tablet application**.

This roadmap starts a new continuation at Phase 16. It does not rewrite the history of Phases 0–15.

The complete execution index is [`landscape-phase-pack.md`](landscape-phase-pack.md).

## Program goal

Deliver the complete existing Talki functionality in the approved new landscape design across supported phones and tablets, then run a fresh native release gate and only afterward resume cutover.

## Phase order

| Phase | Title | Outcome | Plan | Prompt |
|---:|---|---|---|---|
| 16 | Landscape rebaseline and design contract | Freeze source-of-truth, screen inventory, asset gaps, test contract | [plan](phases/phase-16-plan.md) | [prompt](prompts/phase-16.md) |
| 17 | Landscape runtime and responsive foundation | App-wide landscape policy and correct phone/tablet geometry | [plan](phases/phase-17-plan.md) | [prompt](prompts/phase-17.md) |
| 18 | Landscape design system and world shell | Shared shell, background, chrome, cards, layout primitives | [plan](phases/phase-18-plan.md) | [prompt](prompts/phase-18.md) |
| 19 | Navigation architecture | Remove child bottom navigation and install landscape top/side model | [plan](phases/phase-19-plan.md) | [prompt](prompts/phase-19.md) |
| 20 | Home hub | Implement approved landscape Home | [plan](phases/phase-20-plan.md) | [prompt](prompts/phase-20.md) |
| 21 | Games hub | Implement 3×2 paged games hub with all games reachable | [plan](phases/phase-21-plan.md) | [prompt](prompts/phase-21.md) |
| 22 | Practice hub | Implement 3×2 complete practice hub | [plan](phases/phase-22-plan.md) | [prompt](prompts/phase-22.md) |
| 23 | Categories and vocabulary | Landscape category/word learning experience | [plan](phases/phase-23-plan.md) | [prompt](prompts/phase-23.md) |
| 24 | Games wave A | Quiz, Memory, Missing, Match, Cards | [plan](phases/phase-24-plan.md) | [prompt](prompts/phase-24.md) |
| 25 | Games wave B | Sounds, Count, Bubbles, Sort, Puzzle, Speech | [plan](phases/phase-25-plan.md) | [prompt](prompts/phase-25.md) |
| 26 | Practice activities | All current practice activity screens | [plan](phases/phase-26-plan.md) | [prompt](prompts/phase-26.md) |
| 27 | Rewards and Parent Center | Stickers/rewards, parent gate, settings, reports, recordings, custom words | [plan](phases/phase-27-plan.md) | [prompt](prompts/phase-27.md) |
| 28 | Intro, overlays, ads, accessibility, global polish | Remaining shared/global UI and route-aware policies | [plan](phases/phase-28-plan.md) | [prompt](prompts/phase-28.md) |
| 29 | Full landscape native QA and release gate | Real-device matrix, native APIs, stability, explicit GO/NO-GO | [plan](phases/phase-29-plan.md) | [prompt](prompts/phase-29.md) |
| 30 | Native cutover and Capacitor retirement | Controlled migration/cutover only after Phase 29 GO | [plan](phases/phase-30-plan.md) | [prompt](prompts/phase-30.md) |

## Dependency model

Plans/prompts are committed in advance, but each phase must read the immediately previous phase report and current source before implementation.

A later phase plan is a durable scope/acceptance contract; it must not cause an agent to assume files/APIs that earlier phases did not actually create.

If the previous phase did not reach the exact exit status required by the active phase plan, the next phase stops BLOCKED/NO-GO.

## Program gates

### Gate A — Foundation (after Phase 19)

Must prove:

- one centralized landscape geometry system;
- app-wide orientation contract;
- no child bottom navigation;
- stable top/side navigation;
- phone/tablet classification works;
- shared shell supports the approved hub compositions.

Required exit:

`LANDSCAPE FOUNDATION GATE PASSED`

### Gate B — Child feature completion (after Phase 26)

Must prove:

- all categories/words reachable;
- all games reachable and landscape-complete;
- all practice modes reachable and landscape-complete;
- progress/audio/storage behavior remains intact.

Required exit:

`CHILD FEATURE COMPLETION GATE PASSED`

### Gate C — Product completion (after Phase 28)

Must prove:

- parent/rewards/global surfaces migrated;
- accessibility and reduce-motion addressed;
- ad placement explicitly designed;
- no old portrait child UI/bottom navigation remains reachable.

Required exit:

`PRODUCT COMPLETION GATE PASSED`

### Gate D — Release (Phase 29)

Requires named real hardware and native capability evidence.

Final status must be exactly:

`LANDSCAPE RELEASE GO`

or

`NO-GO`

Phase 30 may not start on NO-GO.

## Landscape web viewport matrix

Phase 17 validates/tunes the Phase 16-frozen matrix. Initial targets:

- 667×375 — compact phone
- 740×360 — compact Android phone
- 844×390 — standard modern phone/reference
- 932×430 — large phone
- 1024×768 — small 4:3 tablet
- 1133×744 — tablet
- 1280×800 — 16:10 tablet
- 1366×1024 — large tablet

The native release matrix in Phase 29 must include exact model/OS evidence for:

- compact/older Android phone;
- modern Android phone;
- recent iPhone;
- Android tablet;
- iPad.

## Content preservation

The visual mocks show only subsets of some catalogs.

The implementation must preserve current source behavior/content, including:

- every registered game;
- every vocabulary category and word, including custom/my words where applicable;
- every practice mode;
- Parent Center features;
- rewards/progress;
- audio/TTS/recording/speech behavior.

No content is removed merely to match one reference viewport.

## Validation/report model

Every execution phase writes a report and stops.

Reports include:

- acceptance PASS/FAIL/BLOCKED;
- files changed;
- exact test results;
- screenshot/evidence index;
- compact/reference phone and tablet results;
- native coverage;
- deviations;
- design/product blockers;
- risks carried forward;
- exact phase exit status.

Only Phase 16 creates a separate audit document by design. Phase 29 and Phase 30 create extra release/cutover evidence named in their plans.

Historical Phase 14/15 reports remain unchanged.
