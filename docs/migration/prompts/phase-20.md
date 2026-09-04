# Phase 20 Agent Prompt — Landscape Home Hub

Implement **Phase 20 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/design/landscape/reference/home.png`
5. `docs/design/landscape/asset-manifest.md`
6. `docs/migration/prompts/_landscape-shared.md`
7. `docs/migration/phase-19-report.md`
8. `docs/migration/phases/phase-20-plan.md`
9. current Home/progress/category/top-chrome code

Gate: Phase 19 must end with `LANDSCAPE FOUNDATION GATE PASSED`.

## Pre-flight

Before editing, identify:

- current Home component tree;
- real progress/category data sources;
- verified Home production assets;
- Phase 18 shell/primitives to reuse;
- Phase 19 navigation APIs;
- missing assets/blockers;
- screenshot/test plan.

## Work

Redesign **Home only** according to `home.png` and `phase-20-plan.md`.

Preserve every current category, real progress behavior, music toggle, parent entry, rewards/star state, and Games/Practice navigation.

Hard rules:

- no screenshot-as-UI;
- no default long vertical Home scroll;
- no category deletion to match the mock;
- no invented production art;
- use centralized landscape metrics only;
- phone/tablet share one implementation.

Do not start Games, Practice, Category, game, parent, rewards, ad-policy, or cutover redesign work.

## Validation

Run plan validation and capture Home screenshots across the active landscape viewport matrix. Review compact phone and tablet geometry explicitly.

## Report

Write `docs/migration/phase-20-report.md` including:

- PASS/FAIL/BLOCKED per acceptance item;
- visual comparison notes;
- all-category reachability evidence;
- progress/navigation/control behavior;
- screenshots/index;
- exact test results;
- asset blockers/deviations;
- risks for Phase 21.

End exactly with:

`HOME HUB READY FOR PHASE 21`

or

`BLOCKED`

Then STOP.
