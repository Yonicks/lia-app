# Phase 29 Plan — Full Landscape Native QA and Release Gate

## Purpose

Run the complete native release-quality verification for the landscape Expo product on real hardware, reconcile all historical Phase 14 release blockers against current source, fix only defects required to pass the gate, and produce an explicit release GO/NO-GO decision.

Phase 29 is not another redesign phase. It is the evidence gate that determines whether native cutover may begin.

## Dependency

Read `docs/migration/phase-28-report.md` first.

Phase 29 may begin only when Phase 28 ends with:

`PRODUCT COMPLETION GATE PASSED`

Otherwise stop with `NO-GO`.

Also read historical Phase 14/15 reports and defect lists. They are evidence, not automatically-current truth. Re-test every relevant unresolved blocker against the current landscape implementation.

## In scope

1. Build release-like Android and iOS native artifacts/configurations available to the environment.
2. Execute the required real-device matrix.
3. Run automated unit/integration/Playwright/Maestro regression.
4. Run manual/native smoke and long-session checks.
5. Validate orientation, safe areas, input, audio, TTS, recording, speech recognition, image picker, persistence, backup/restore, ads, deep links, process death/resume, offline behavior, and performance.
6. Reconcile every relevant historical Phase 14 major/blocker.
7. Fix release-blocking defects discovered during QA, without introducing feature redesign or unrelated refactors.
8. Re-run affected tests after each fix and the full release gate at the end.
9. Produce an auditable device/evidence matrix and explicit GO/NO-GO.

## Out of scope

- Do not start Capacitor retirement/cutover; Phase 30.
- Do not introduce new features or visual concepts.
- Do not waive missing real-device/native evidence.
- Do not declare GO based on web/Playwright alone.

## Required real-device classes

At minimum, test and record the exact model/OS/build for:

1. compact/older Android phone;
2. modern Android phone;
3. recent iPhone;
4. Android tablet;
5. iPad.

If the project/operator has more representative devices, include them.

A simulator/emulator may supplement but does not replace the required real-device classes for GO.

If any required device class cannot be tested, the result is `NO-GO` unless the plan is explicitly amended by a human product/release decision before execution.

## Landscape/orientation checks

On every real device:

- cold launch enters landscape without a portrait flash that exposes broken UI;
- app stays in the supported landscape orientations according to platform policy;
- device rotation attempts do not produce portrait child UI;
- left/right landscape orientation respects safe areas/notches/camera cutouts;
- background/foreground transitions preserve valid orientation;
- iPad multitasking/windowing behavior is verified against the app's supported policy;
- keyboard appearance does not break parent forms.

## Full feature smoke matrix

Verify on native hardware:

### Hubs

- Home
- Games, all pages
- Practice
- Rewards

### Vocabulary

- representative built-in categories;
- large category;
- custom/my-words category;
- audio/TTS;
- progress/completion.

### All games

Every currently registered game must launch and complete at least one representative session path. High-risk native/gesture games receive deeper checks:

- Bubbles bounds/hitboxes;
- Sort drag/drop;
- Puzzle drag/snap;
- Speech microphone/recognition;
- Sounds audio;
- Count density.

### All practice modes

Every current practice mode must launch and complete a representative path with prompts/audio/progress verified.

### Parent Center

- gate;
- every tab;
- custom word CRUD;
- photo/image picker;
- recording/playback;
- settings persistence;
- reports;
- backup/restore/export/import where supported;
- software keyboard in landscape.

### Global

- splash/intro/bumper;
- deep-link after intro;
- loading/error/fallback;
- reward/done/toast overlays;
- ads eligible/ineligible routes;
- reduce motion;
- accessibility basics.

## Native capability attestation

Explicitly test and record:

- audio playback;
- TTS;
- microphone permission;
- audio recording;
- speech recognition permission/listening/success/failure/retry;
- image/photo picker permissions and result handling;
- SQLite/persistence;
- backup/restore/file APIs;
- AdMob test/production-config separation and banner lifecycle;
- keep-awake behavior where used;
- deep links;
- app resume/background behavior.

A web mock does not count as native attestation.

## Persistence / process-death tests

Test:

- progress survives normal relaunch;
- settings survive relaunch;
- custom words/photos/audio survive relaunch;
- reward state survives relaunch;
- process kill during safe points does not corrupt state;
- restore after OS kills/reclaims app follows current product contract;
- migration/legacy-compatible data remains readable where still required.

## Offline tests

With network unavailable:

- core local learning content still behaves according to current product contract;
- cached/local assets load;
- local audio/TTS behavior is documented;
- ads fail gracefully without layout damage;
- persistence works;
- no infinite loading caused solely by unavailable ad/network services.

Record any deliberately-network-required feature.

## Performance / stability

At minimum:

- cold-start timing observations on one older/compact phone and one modern device;
- screen-transition responsiveness;
- image/background memory behavior;
- game animation/drag responsiveness;
- speech/recording lifecycle;
- 30-minute continuous child-flow soak on at least one representative phone;
- 30-minute parent/media/native-feature soak where practical or one combined scripted/manual soak;
- no unbounded memory growth, repeated listener registration, or crash loop.

Use available profiler/log tools and record methodology rather than inventing numbers.

## Automated release gate

Run at minimum:

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx vitest run
npx expo-doctor
npx expo export --platform web
npx playwright test
```

Run the complete relevant Maestro suite on native builds/devices and all legacy regression still required before cutover.

If existing npm scripts wrap these commands, prefer the repository's canonical scripts and report exact commands.

## Historical Phase 14 reconciliation

Create a table mapping every Phase 14 blocker/major relevant to release to one of:

- RESOLVED — evidence/path/test;
- SUPERSEDED — old claim no longer matches current architecture, with evidence;
- STILL OPEN — release impact;
- NOT APPLICABLE — justified.

Do not mark stale defects resolved merely because code now contains a dependency; validate behavior.

## Defect policy

During Phase 29:

- critical/blocking release defects may be fixed;
- fixes must get focused tests plus full regression;
- unrelated cleanup/refactor is deferred;
- a known crash/data-loss/native-permission failure/core-feature-unreachable defect prevents GO;
- cosmetic deviations may be accepted only if documented and not contrary to the approved design contract.

## Required deliverables

Create/update:

- `docs/migration/phase-29-device-matrix.md`;
- `docs/migration/phase-29-release-checklist.md`;
- `docs/migration/phase-29-report.md`;
- screenshots/video/log references according to repo conventions;
- defect entries/evidence needed for any discovered release issue.

## Acceptance criteria

- [ ] All automated mobile validation is green.
- [ ] Maestro native suite is executed and green for required flows.
- [ ] All five required real-device classes have named evidence.
- [ ] App launch/orientation/safe-area behavior passes on every required device.
- [ ] Every registered game is natively reachable and smoke-tested.
- [ ] Every practice mode is natively reachable and smoke-tested.
- [ ] Vocabulary/custom words/progress/audio are natively verified.
- [ ] Parent Gate/Center and media/backup flows are natively verified.
- [ ] Speech recognition and recording have real native evidence.
- [ ] Ad behavior is verified and does not damage landscape layout.
- [ ] Offline and process-death behavior is verified.
- [ ] 30-minute stability/soak evidence exists.
- [ ] Historical Phase 14 blockers/majors are reconciled.
- [ ] No open release blocker/critical remains.
- [ ] `phase-29-device-matrix.md`, `phase-29-release-checklist.md`, and `phase-29-report.md` exist.

## Release decision

The final report must end with exactly one of:

`LANDSCAPE RELEASE GO`

or

`NO-GO`

`LANDSCAPE RELEASE GO` is allowed only when every mandatory real-device/native gate above has evidence and no release blocker remains.

Then stop. Do not start Phase 30.
