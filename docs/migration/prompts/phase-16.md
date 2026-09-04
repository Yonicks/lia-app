# Phase 16 Agent Prompt — Landscape Rebaseline and Design Contract

Implement **Phase 16 only**.

Repository: `Yonicks/talki`

## Required reading

Read, in this order:

1. `AGENTS.md`
2. `CLAUDE.md` if you are Claude
3. `docs/migration/README.md`
4. `docs/migration/phase-14-report.md`
5. `docs/migration/phase-15-report.md`
6. `docs/design/landscape/README.md`
7. `docs/design/landscape/screen-map.md`
8. `docs/design/landscape/interaction-map.md`
9. `docs/design/landscape/asset-manifest.md`
10. `docs/migration/landscape-roadmap.md`
11. `docs/migration/prompts/_landscape-shared.md`
12. `docs/migration/phases/phase-16-plan.md`
13. Inspect all committed images under `docs/design/landscape/reference/`

Understand before proceeding:

- Historical Phase 15 STOPPED. Do not cut over or retire Capacitor.
- The child product direction is now landscape-only on phones and tablets.
- This phase is an audit/rebaseline phase, not a Home/Games/Practice implementation phase.

## Pre-flight

Before editing, output a short pre-flight that names:

- responsive/orientation/navigation files you found;
- current main screen implementations;
- current test harness files;
- current asset registries;
- any immediate source/document drift;
- files you plan to change/create.

## Work

Execute every item in `phase-16-plan.md`.

Important constraints:

- Do not change production UI behavior.
- Do not remove BottomNavigation yet.
- Do not change orientation behavior yet.
- Do not implement new breakpoints yet.
- Do not redesign any screen yet.
- Do not create arbitrary art.
- Do not retire/delete legacy Capacitor/PWA files.

Audit the CURRENT code, not just migration reports.

Create:

`docs/migration/phase-16-audit.md`

with all required sections from the plan.

Update the design inventory/asset docs only where current-code evidence gives more accurate information.

Run the required validation.

Then create:

`docs/migration/phase-16-report.md`

with:

- summary;
- PASS/FAIL/BLOCKED for every acceptance criterion;
- files changed;
- exact commands/results;
- current exact feature counts;
- key findings;
- native coverage;
- deviations;
- assets/design blockers;
- risks for Phase 17;
- explicit phase status.

The final status must be exactly one of:

`LANDSCAPE FOUNDATION READY FOR PHASE 17`

or

`BLOCKED`

After writing the report, STOP. Do not start Phase 17.
