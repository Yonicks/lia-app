# Phase 30 Agent Prompt — Native Cutover and Capacitor Retirement

Implement **Phase 30 only**.

## Required reading

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `docs/migration/README.md`
4. `docs/migration/prompts/_landscape-shared.md`
5. `docs/migration/phase-29-report.md`
6. historical `docs/migration/phase-15-report.md`
7. any historical Phase 15 cutover/data-migration artifacts
8. `docs/migration/phases/phase-30-plan.md`
9. current release/build/store/data-migration/backup/Capacitor configuration

## Hard gate

Phase 29 must end with:

`LANDSCAPE RELEASE GO`

If not, write a BLOCKED/NO-CUTOVER Phase 30 report and STOP. Do not retire Capacitor.

## Pre-flight

Before changing anything, output:

- exact RC commit/version/build identifiers;
- historical Phase 15 artifacts found and their current validity;
- current native/legacy shipping paths;
- current migration/backup compatibility seams;
- available release/store capabilities and actions requiring a human;
- rollback strategy;
- files/config/scripts likely to be retired only after stability.

## Work

Execute `phase-30-plan.md` in order.

Create:

- `docs/migration/phase-30-cutover-checklist.md`
- `docs/migration/phase-30-data-migration-results.md`
- `docs/migration/phase-30-rollback-plan.md`
- `docs/migration/phase-30-report.md`

Revalidate historical Phase 15 instructions against current source. Freeze the RC, test clean install and legacy→native data migration, run internal native smoke, prepare/execute rollout only where explicitly authorized, prove rollback, and retire obsolete Capacitor shipping paths only after the stability gate.

## Safety rules

- do not perform production store publish/rollout/destructive remote action without explicit human confirmation in this session;
- do not claim external rollout happened when credentials/tools are unavailable;
- do not delete legacy shipping code before rollback/stability requirements are met;
- preserve historical migration evidence and compatibility fixtures;
- any RC code fix after Phase 29 GO requires re-running the affected release gate before continuing.

## Validation

Run the full post-retirement Expo/native regression required by the plan and relevant Maestro/device smoke. Search for stale active Capacitor/shipping references and classify deliberate historical references.

## Report

The final `phase-30-report.md` must include:

- Phase 29 GO verification;
- RC identifiers;
- historical Phase 15 revalidation table;
- data migration results;
- internal release smoke;
- rollout actions/evidence vs HUMAN REQUIRED items;
- rollback plan evidence;
- exact Capacitor/PWA shipping files/scripts/config retired;
- final tests/results;
- remaining risks/follow-ups;
- explicit final status.

End with exactly one of:

`NATIVE CUTOVER COMPLETE`

`ROLLBACK REQUIRED`

`AWAITING HUMAN RELEASE ACTION`

Then STOP.
