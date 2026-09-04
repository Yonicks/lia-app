# Phase 30 Plan — Native Cutover and Capacitor Retirement

## Purpose

Resume the native cutover that historical Phase 15 correctly stopped, using the now-release-approved landscape Expo application as the shipping product. Perform migration/cutover in controlled stages, preserve rollback capability, and retire the legacy Capacitor path only after the native release is proven stable.

This is the final phase of the landscape redesign program.

## Dependency — hard gate

Read `docs/migration/phase-29-report.md` first.

Phase 30 may begin **only** when the report ends with:

`LANDSCAPE RELEASE GO`

If Phase 29 says `NO-GO`, is missing, or lacks the required release evidence, Phase 30 is BLOCKED. Do not attempt cutover.

Also read:

- historical `docs/migration/phase-15-report.md`;
- any existing Phase 15 cutover/data-migration plans created by the stopped attempt;
- current release/store/build documentation;
- current backup/migration compatibility tests.

Historical Phase 15 artifacts are input, not authorization to reuse stale commands blindly.

## Safety principles

1. Preserve a tested rollback path until native release stability is confirmed.
2. Do not delete the legacy implementation before the rollback checkpoint passes.
3. Do not make destructive remote/store actions without explicit human/operator confirmation in the active session.
4. Do not alter user data formats without migration/rollback tests.
5. Record exact versions/build IDs/commits at every stage.
6. Stop immediately if migration, crash, native capability, or data-loss signals violate the rollout gate.

## In scope

1. Revalidate and update the historical cutover/data-migration plan against current source.
2. Freeze the release candidate commit/build artifacts.
3. Validate legacy→native user-data migration/compatibility.
4. Validate install/upgrade paths supported by the product.
5. Produce signed/release artifacts through the project's approved build pipeline where credentials/environment permit.
6. Execute internal/family/test-track rollout steps when explicitly authorized.
7. Define and execute staged rollout checkpoints when external release access is available and explicitly approved.
8. Monitor release-critical signals/evidence available to the project.
9. Prove rollback procedure before legacy retirement.
10. After stability checkpoint passes, remove/retire obsolete Capacitor/PWA shipping paths and update repository scripts/docs/configuration.
11. Run final regression after retirement.
12. Produce final migration/cutover report.

## Out of scope

- No new product redesign or features.
- No opportunistic dependency modernization unrelated to cutover.
- No production store publish, rollout-percentage change, or destructive remote operation without human confirmation.
- No deletion of historical migration reports/evidence.

## Step 1 — Rebaseline historical Phase 15 artifacts

Inspect any existing historical cutover documents, expected to include artifacts similar to:

- `phase-15-cutover-plan.md`;
- `phase-15-data-migration.md`;
- `phase-15-report.md`.

For each instruction classify:

- VALID AS-IS;
- UPDATE REQUIRED;
- OBSOLETE/SUPERSEDED;
- HUMAN/STORE ACTION.

Create a current Phase 30 cutover checklist rather than silently following stale Phase 15 commands.

## Step 2 — Freeze the release candidate

Record:

- git commit SHA;
- app version/build number;
- Expo/EAS/native configuration versions;
- Android application ID/package;
- iOS bundle identifier;
- signing/build profile names without exposing secrets;
- release artifact identifiers/paths;
- Phase 29 evidence reference.

No feature changes after RC freeze except an explicitly documented release-blocker fix, which requires re-running the relevant Phase 29 gate.

## Step 3 — Data migration / compatibility

Prove the native app safely handles data from the legacy shipping app according to current migration contract, including where applicable:

- progress;
- settings;
- custom words;
- custom photos/media references;
- recordings/audio;
- rewards/stickers/stars;
- backup/restore payloads;
- schema/version markers.

Test at least:

- clean install;
- upgrade/migration from representative legacy fixture/data;
- relaunch after migration;
- backup export after migration;
- restore/round-trip compatibility where promised;
- failure/interruption handling;
- no silent data reset.

If platform packaging makes in-place migration impossible or current app IDs/storage boundaries differ, document the exact supported migration/user path and do not invent compatibility.

## Step 4 — Internal release gate

Before any public rollout:

- install release build on representative Android phone/iPhone/tablet/iPad;
- run concise smoke across Home, category, one low-risk game, one high-risk game, one practice mode, Parent Center, custom words, recording/speech, ads, and persistence;
- verify crash-free launch and landscape policy;
- verify build is using production-safe configuration and no test-only endpoints/IDs accidentally ship, except provider-required test modes on internal tracks.

## Step 5 — Staged rollout

When store/release credentials and explicit human authorization are available, use conservative checkpoints. Suggested sequence:

1. internal/family/test track;
2. limited production cohort / approximately 10%;
3. approximately 50%;
4. 100%.

Exact store mechanics and percentages may be changed by the human operator/platform capabilities.

Before each increase, review available evidence such as:

- crash/ANR signals;
- startup failures;
- native permission/speech/recording issues;
- migration/data-loss reports;
- ad/configuration failures;
- severe layout/device reports.

If the environment cannot perform external rollout/monitoring, create the exact operator checklist and mark those actions `HUMAN REQUIRED`; do not pretend they happened.

## Rollback

Before legacy retirement, prove/document:

- last known-good legacy commit/tag/build reference;
- how to halt native rollout;
- how to restore previous store version/config when platform allows;
- data compatibility implications of rollback;
- repository rollback commands/branch strategy;
- what telemetry/signals trigger rollback.

A rollback plan that has never been checked against current build IDs/configuration is not sufficient.

## Capacitor retirement gate

Only after the native release reaches the agreed stability checkpoint may the repository retire obsolete legacy shipping paths.

Before deletion/removal:

- confirm current native release is stable per the rollout checklist;
- confirm rollback artifact/reference remains recoverable;
- identify every script/config/doc/CI job that still points to Capacitor/PWA shipping;
- distinguish legacy test fixtures/evidence that must be retained from obsolete shipping code.

Retirement may include, as current source requires:

- obsolete Capacitor build/configuration files;
- legacy native wrapper projects used only by Capacitor;
- old deployment scripts/CI paths;
- stale package scripts/dependencies;
- docs that claim Capacitor is the active shipping path.

Do not delete historical migration evidence or fixtures still required to test data compatibility.

## Final validation after retirement

Run the complete applicable Expo/native regression again, including:

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx vitest run
npx expo-doctor
npx expo export --platform web
npx playwright test
```

Run relevant Maestro/native smoke and repository-level tests/scripts that prove no active build path still depends on removed Capacitor files.

Search the repository for stale active references to retired shipping paths and classify any deliberate historical references.

## Required deliverables

Create:

- `docs/migration/phase-30-cutover-checklist.md`;
- `docs/migration/phase-30-data-migration-results.md`;
- `docs/migration/phase-30-rollback-plan.md`;
- `docs/migration/phase-30-report.md`.

Update current release/developer docs to identify the Expo React Native landscape app as the active shipping implementation once cutover is complete.

## Acceptance criteria

- [ ] Phase 29 release GO is verified before work starts.
- [ ] Historical Phase 15 cutover instructions are revalidated, not blindly reused.
- [ ] Release candidate commit/build identifiers are frozen and recorded.
- [ ] Legacy→native data migration/compatibility is tested with evidence.
- [ ] Clean-install and upgrade/migration paths are documented/tested.
- [ ] Internal release smoke is green.
- [ ] External rollout actions are either evidenced or explicitly marked HUMAN REQUIRED; none are fabricated.
- [ ] Rollback procedure is current and actionable.
- [ ] Capacitor retirement occurs only after the stability checkpoint.
- [ ] Obsolete shipping scripts/config/dependencies are removed or intentionally retained with explanation.
- [ ] Historical evidence/fixtures needed for audit/migration are preserved.
- [ ] Final Expo/native regression is green after retirement.
- [ ] Active documentation identifies the native landscape app as the shipping product.
- [ ] All required Phase 30 deliverables exist.

## Final status

If repository cutover/retirement and all required executable gates are complete, end with:

`NATIVE CUTOVER COMPLETE`

If a release blocker or failed migration/rollback condition requires reversal, end with:

`ROLLBACK REQUIRED`

If only external store/human actions remain and cannot be executed by the agent, end with:

`AWAITING HUMAN RELEASE ACTION`

Then stop.
