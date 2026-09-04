# Phase 29 — Landscape release checklist

Baseline: git `9e75b97` · app version `1.0.0` · host = Cursor Windows sandbox (no devices).

Legend: **PASS** / **FAIL** / **BLOCKED** / **N/A**.

## A. Entry gates

| Item | Result | Notes |
|---|---|---|
| Phase 28 ends with `PRODUCT COMPLETION GATE PASSED` | PASS | `docs/migration/phase-28-report.md` final line |
| Capacitor / legacy root app untouched this phase | PASS | No edits under root Capacitor/`android`/`ios`/`www` |
| Phase 30 not started | PASS | Cutover deferred |

## B. Automated mobile validation

| Item | Result | Evidence |
|---|---|---|
| `npx tsc --noEmit` | PASS | exit 0 (reconfirmed this session) |
| `npx eslint .` | PASS | exit 0 |
| `npx vitest run` | PASS | 53 files / 5551 tests, exit 0 |
| `npx expo export --platform web` | PASS | exit 0; `dist` ~94 MB; bundle `entry-ec10472c…js` |
| `npx expo-doctor` | FAIL | 19/21 — static `app.json` vs `app.config.ts`; patch skew on `expo` / `expo-image-*` / `expo-router` |
| `npx playwright test` (full) | FAIL | 1197 passed / 259 failed (8.8m) — mostly stale Phase 14 full-sweep + gallery snapshot baselines; also quiz/memory done-card snapshot playthroughs × viewports; full-sweep sort/puzzle `measureInWindow` page errors |
| Landscape-relevant Playwright subset | FAIL | 1103 passed, exit 1 after excluding Phase 14 full-sweep / gallery group baselines / intro settled-frame; remaining failures include quiz/memory playthrough done-card asserts |
| Maestro `npm run maestro:full` / `maestro:device-qa` | BLOCKED | Maestro CLI not installed; Unix PATH script is not a native run on this host |
| Local `expo run:android` / `run:ios` artifacts | BLOCKED | No SDK/devices; no checked-in `apps/mobile/android` or `ios` trees |

## C. Required real-device classes

| Class | Result |
|---|---|
| Compact / older Android phone | BLOCKED — unavailable |
| Modern Android phone | BLOCKED — unavailable |
| Recent iPhone | BLOCKED — unavailable |
| Android tablet | BLOCKED — unavailable |
| iPad | BLOCKED — unavailable |

See `phase-29-device-matrix.md`.

## D. Landscape / orientation (native)

| Item | Result |
|---|---|
| Cold launch landscape, no portrait flash | BLOCKED |
| Supported landscape orientations only | BLOCKED (code/manifest present; not device-proven) |
| No portrait child UI on rotation attempts | BLOCKED |
| L/R landscape safe areas / cutouts | BLOCKED |
| Background/foreground orientation | BLOCKED |
| iPad multitasking / windowing policy | BLOCKED |
| Parent landscape software keyboard | BLOCKED |

## E. Feature smoke (native)

| Area | Result |
|---|---|
| Hubs: Home / Games / Practice / Rewards | BLOCKED native — web Playwright covered in prior phases + this full run |
| All registered games ≥1 session path | BLOCKED native |
| All practice modes ≥1 path | BLOCKED native |
| Vocabulary / large / mine / TTS / progress | BLOCKED native |
| Parent Gate + every tab + CRUD/photo/record/backup | BLOCKED native |
| Global intro / deep-link / overlays / ads / reduce-motion | BLOCKED native (web evidence in Phase 28; not native) |

## F. Native capability attestation

| Capability | Result |
|---|---|
| Audio playback | BLOCKED |
| TTS | BLOCKED |
| Microphone permission | BLOCKED |
| Audio recording | BLOCKED |
| Speech recognition (he-IL) | BLOCKED |
| Image / photo picker | BLOCKED |
| SQLite / persistence | BLOCKED (engine wired; not process-kill proven) |
| Backup / restore / file APIs | BLOCKED |
| AdMob test vs production config + banner lifecycle | BLOCKED (library present; sample unit id default; no device banner) |
| Keep-awake | BLOCKED (`expo-keep-awake` mounted in root layout; not soak-proven) |
| Deep links | BLOCKED native (`?game=` wired in `_layout`; web e2e only) |
| App resume / background | BLOCKED |

Web mocks / Playwright do **not** count as native attestation.

## G. Persistence / process-death / offline / soak

| Item | Result |
|---|---|
| Progress/settings/custom media survive relaunch | BLOCKED |
| Process kill at safe points | BLOCKED |
| Offline core learning / ads fail-soft | BLOCKED |
| 30-minute child-flow soak | BLOCKED |
| Cold-start / transition timings on older + modern devices | BLOCKED |

## H. Historical Phase 14 reconciliation

| Item | Result |
|---|---|
| Every P14 BLOCKER/MAJOR mapped | PASS (table in `phase-29-report.md`) |
| No open release BLOCKER remaining | FAIL — device/native blockers remain open |

## I. Deliverables

| Item | Result |
|---|---|
| `phase-29-device-matrix.md` | PASS |
| `phase-29-release-checklist.md` | PASS |
| `phase-29-report.md` | PASS |
| Explicit GO / NO-GO | **NO-GO** |

## Release decision summary

Automated static/unit/export checks are green. Full Playwright is not green (stale baselines + residual playthrough snapshot failures). Expo-doctor is not green. **All five required real-device classes and Maestro/native attestation are BLOCKED.** Therefore the landscape release gate is **NO-GO**. Phase 30 must not start.
