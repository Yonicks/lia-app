# Talki Landscape Redesign Roadmap

## Why this roadmap exists

The original React Native / Expo migration reached Phase 14, whose release gate was NO-GO. The subsequent Phase 15 cutover attempt correctly stopped and left Capacitor intact.

The product direction then changed materially: the child-facing experience is now being redesigned as a **landscape-only phone/tablet application**.

This roadmap starts a new program at Phase 16. It does not rewrite the history of Phases 0–15.

## Program goal

Deliver the complete existing Talki functionality in the approved new landscape design across supported phones and tablets, then perform a fresh native release gate and only afterward resume cutover.

## Phase order

| Phase | Title | Outcome |
|---:|---|---|
| 16 | Landscape rebaseline and design contract | Freeze source-of-truth, screen inventory, asset gaps, test contract |
| 17 | Landscape runtime and responsive foundation | App-wide landscape policy and correct phone/tablet geometry |
| 18 | Landscape design system and world shell | Shared shell, background, chrome, cards, layout primitives |
| 19 | Navigation architecture | Remove child bottom navigation and install landscape top/side navigation model |
| 20 | Home hub | Implement approved landscape Home |
| 21 | Games hub | Implement 3×2 paged games hub with all games reachable |
| 22 | Practice hub | Implement 3×2 six-mode practice hub |
| 23 | Categories and vocabulary | Landscape category/word learning experience |
| 24 | Games wave A | Quiz, Memory, Missing, Match, Cards |
| 25 | Games wave B | Sounds, Count, Bubbles, Sort, Puzzle, Speech |
| 26 | Practice activities | All six practice activity screens |
| 27 | Rewards and Parent Center | Stickers/rewards, parent gate, settings, reports, recordings, custom words |
| 28 | Intro, overlays, ads, accessibility, global polish | Remaining shared/global UI and policies |
| 29 | Full landscape native QA and release gate | Named-device matrix, performance, native APIs, regression, GO/NO-GO |
| 30 | Native cutover and Capacitor retirement | Resume staged cutover only after Phase 29 GO |

## Program gates

### Gate A — Foundation (after Phase 19)

Must prove:

- one centralized landscape geometry system;
- app-wide orientation contract;
- no child bottom navigation;
- stable top/side navigation;
- phone/tablet classification works;
- shared shell can render all three hub reference compositions.

### Gate B — Child feature completion (after Phase 26)

Must prove:

- all categories reachable;
- all games reachable;
- all six practice modes reachable;
- detail interactions preserved;
- progress/audio/storage behavior remains intact.

### Gate C — Product completion (after Phase 28)

Must prove:

- parent/rewards/global surfaces migrated;
- accessibility and reduce-motion policy addressed;
- ad placement explicitly designed;
- no old portrait child UI remains in the Expo product.

### Gate D — Release (Phase 29)

Must use named real hardware and produce an explicit:

`LANDSCAPE RELEASE GO`

or

`NO-GO`

Phase 30 may not start on NO-GO.

## Required device/view matrix

The web screenshot matrix should represent landscape geometry, not the old portrait matrix.

Initial target matrix (Phase 17 validates/tunes it):

- 667×375 — compact phone
- 740×360 — compact Android phone
- 844×390 — standard modern phone/reference class
- 932×430 — large phone
- 1024×768 — small 4:3 tablet
- 1133×744 — tablet
- 1280×800 — 16:10 tablet
- 1366×1024 — large tablet

The native release matrix must include named real devices:

- compact/older Android phone;
- modern Android phone;
- recent iPhone;
- Android tablet;
- iPad.

## Content preservation

The visual mocks show only subsets of some catalogs.

The implementation must preserve the current domain:

- 11 registered games;
- all vocabulary categories, including custom/my words where applicable;
- 6 practice modes;
- parent center features;
- rewards/progress;
- audio/TTS/recording/speech behavior.

No content is removed merely to match one reference viewport.

## Validation model

Every implementation phase writes a report and stops.

The report must include:

- acceptance criteria with PASS/FAIL/BLOCKED;
- files changed;
- exact test results;
- screenshot index;
- phone result;
- tablet result;
- native coverage;
- deviations;
- design-blocked assets;
- risks carried forward.

Historical Phase 14/15 reports must remain unchanged.
