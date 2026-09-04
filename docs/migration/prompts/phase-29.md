# Phase 29 Agent Prompt — Full Landscape Native QA and Release Gate

Implement **Phase 29 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/design/landscape/README.md`
4. `docs/migration/prompts/_landscape-shared.md`
5. `docs/migration/phase-28-report.md`
6. `docs/migration/phases/phase-29-plan.md`
7. historical `phase-14-report.md`, Phase 14 defects/evidence, and `phase-15-report.md`
8. current native build/test scripts, Maestro flows, app config, and release docs

Gate: Phase 28 must end with `PRODUCT COMPLETION GATE PASSED`.

## Pre-flight

Before touching code, output:

- exact current build/version/branch baseline;
- available real devices with model/OS;
- missing required device classes;
- current automated/native test harness;
- Phase 14 blockers/majors to re-verify;
- native capabilities requiring attestation;
- proposed QA order and evidence paths.

If a mandatory real-device class is unavailable, continue collecting useful evidence if practical, but the final status cannot be GO.

## Work

Execute every item in `phase-29-plan.md`.

This is a release gate, not a redesign sprint.

You may fix release-blocking defects discovered during QA, but:

- add focused regression for each fix;
- rerun the relevant suite;
- rerun the full final gate;
- defer unrelated cleanup/refactoring.

Do not claim native coverage from web mocks. Do not waive missing device evidence.

Create:

- `docs/migration/phase-29-device-matrix.md`
- `docs/migration/phase-29-release-checklist.md`
- `docs/migration/phase-29-report.md`

Run the full automated and real-device matrix, including Maestro, offline/process-death checks, native permissions/media/speech, ads, orientation/safe areas, keyboard, and 30-minute soak evidence.

## Report

The report must include:

- exact commit/build identifiers;
- complete named-device matrix;
- PASS/FAIL/BLOCKED for every acceptance criterion;
- historical Phase 14 reconciliation table;
- all automated commands/results;
- Maestro results;
- native capability attestation;
- offline/process-death results;
- soak/performance methodology/results;
- defects found/fixed/open;
- screenshots/log/video evidence index;
- explicit release decision.

End exactly with:

`LANDSCAPE RELEASE GO`

or

`NO-GO`

Then STOP. Do not start Phase 30.
