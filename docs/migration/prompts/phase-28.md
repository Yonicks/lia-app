# Phase 28 Agent Prompt — Intro, Overlays, Ads, Accessibility, and Global Polish

Implement **Phase 28 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/migration/prompts/_landscape-shared.md`
5. `docs/migration/phase-27-report.md`
6. `docs/migration/phases/phase-28-plan.md`
7. current intro/splash/deep-link/toast/reward/done/loading/error/ad/accessibility code

Gate: Phase 27 must end with `REWARDS AND PARENT READY FOR PHASE 28`.

## Pre-flight

Before editing, report:

- all global/transient surfaces found;
- current intro/deep-link flow;
- current root AdBanner/ad configuration and eligible routes as implemented today;
- remaining responsive/orientation/bottom-nav/portrait remnants;
- current accessibility/reduce-motion support;
- proposed ad policy architecture;
- test/visual sweep plan.

## Work

Execute `phase-28-plan.md`.

Finish global landscape surfaces and policies without changing core domain behavior.

Hard rules:

- no ad may accidentally overlay active child controls;
- do not blindly keep a root-global banner if it breaks landscape composition;
- do not invent a commercial policy when current requirements are genuinely unresolved — mark PRODUCT-BLOCKED;
- no portrait child UI or old bottom nav may remain reachable;
- preserve deep links and intro behavior;
- add centralized reduce-motion support;
- document route-aware ad placement durably.

## Validation

Run full landscape regression, overlay/intro/deep-link/ad tests, accessibility checks available in the repo, and representative native validation. Capture final visual sweep screenshots for major surface classes.

## Report

Write `docs/migration/phase-28-report.md` with:

- PASS/FAIL/BLOCKED acceptance table;
- global surface inventory;
- ad placement policy summary and document path;
- reduce-motion/accessibility findings;
- remaining portrait/bypass search results;
- exact tests/results;
- screenshots;
- native coverage;
- deviations/blockers;
- explicit Product Completion Gate result;
- Phase 29 risks.

End exactly with:

`PRODUCT COMPLETION GATE PASSED`

or

`BLOCKED`

Then STOP.
