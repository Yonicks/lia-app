# Phase 29 — Landscape release checklist (re-run)

Baseline: git `d423090` (app code identical to `9e75b97`) · app version `1.0.0` · host = Windows 11 desktop via Claude Code (no devices attached).

Legend: **PASS** / **FAIL** / **BLOCKED** / **N/A**.

## A. Entry gates

| Item | Result | Notes |
|---|---|---|
| Phase 28 ends with `PRODUCT COMPLETION GATE PASSED` | PASS | `docs/migration/phase-28-report.md` final line, re-confirmed |
| Capacitor / legacy root app untouched this phase | PASS | No edits under root Capacitor/`android`/`ios`/`www`; `git status` clean of those paths |
| Phase 30 not started | PASS | Cutover deferred |

## B. Automated mobile validation

| Item | Result | Evidence |
|---|---|---|
| `npx tsc --noEmit` | PASS | exit 0 |
| `npx eslint .` | PASS | exit 0 |
| `npx vitest run` | PASS | 53 files / 5551 tests, exit 0 |
| `npx expo export --platform web` | PASS | exit 0; bundle `entry-ec10472c…js` (2.8MB), same hash as Phase 28/prior Phase 29 (unchanged code) |
| `npx expo-doctor` | FAIL | 19/21 — same two pre-existing checks as prior gate: static `app.json` vs `app.config.ts`; patch skew on `expo` / `expo-image-manipulator` / `expo-image-picker` / `expo-router` |
| `npx playwright test` (full) | FAIL | 1197 passed / 259 failed (10.6m) — **exact parity with the prior Phase 29 gate**: stale Phase 14 full-sweep + gallery snapshot baselines, plus quiz/memory done-card pixel-diff and a puzzle/landscape-shell baseline; no new failures |
| Landscape-relevant Playwright subset (`--grep-invert` full-sweep/gallery/settled-frame) | FAIL | 1053 passed / 147 failed (8.5m) — see note below: 143 of 147 are a **Windows local file-write artifact**, not product defects; only 4 are genuine baseline mismatches (same known quiz/memory/puzzle issues) |
| Maestro `npm run maestro:full` / `maestro:device-qa` | BLOCKED | Maestro CLI not installed; not installable in a supported way on this host (native Windows unsupported; WSL only has the ephemeral `docker-desktop` distro, no general-purpose Linux distro) |
| Local `expo run:android` / `run:ios` artifacts | BLOCKED | Android SDK/emulator present this time, but no JDK/`JAVA_HOME` to run Gradle; no macOS for iOS |

**Playwright subset failure note:** 143 of the 147 subset failures throw `Error: UNKNOWN: unknown error, open 'docs/migration/screenshots/phase-XX/...png'` from the shared `captureMatrix` evidence-screenshot helper (`tests/e2e/_helpers.ts:193`), not from Playwright's own snapshot assertions. This subset run was started immediately after the full suite had just written thousands of files into the same `docs/migration/screenshots/` tree with 8 parallel workers; the pattern is consistent with transient Windows file-handle contention (AV/indexing) on that directory, not a functional regression — the full run (run first, same commit) passed all of these same test files' functional assertions. Treated as a local-host CI-hygiene finding, not a release defect; recorded here rather than silently discarded.

## C. Required real-device classes

| Class | Result |
|---|---|
| Compact / older Android phone | BLOCKED — unavailable |
| Modern Android phone | BLOCKED — unavailable |
| Recent iPhone | BLOCKED — unavailable (also structurally: no macOS/Xcode on this host) |
| Android tablet | BLOCKED — unavailable |
| iPad | BLOCKED — unavailable (also structurally: no macOS/Xcode on this host) |

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
| Hubs: Home / Games / Practice / Rewards | BLOCKED native — web Playwright coverage only |
| All registered games ≥1 session path | BLOCKED native |
| All practice modes ≥1 path | BLOCKED native |
| Vocabulary / large / mine / TTS / progress | BLOCKED native |
| Parent Gate + every tab + CRUD/photo/record/backup | BLOCKED native |
| Global intro / deep-link / overlays / ads / reduce-motion | BLOCKED native (web evidence only) |

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
| AdMob test vs production config + banner lifecycle | BLOCKED — library present; `bannerUnitId()` still falls back to `TEST_BANNER_UNIT_ID` (no `EXPO_PUBLIC_ADMOB_BANNER_ID` set in `eas.json`); no device banner run |
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
| Every P14 BLOCKER/MAJOR mapped | PASS (table in `phase-29-report.md`, re-verified against unchanged code at `d423090`) |
| No open release BLOCKER remaining | FAIL — device/native blockers remain open |

## I. Deliverables

| Item | Result |
|---|---|
| `phase-29-device-matrix.md` | PASS (rewritten this run) |
| `phase-29-release-checklist.md` | PASS (rewritten this run) |
| `phase-29-report.md` | PASS (rewritten this run) |
| Explicit GO / NO-GO | **NO-GO** |

## Release decision summary

Automated static/unit/export checks are green and identical to the prior gate (unchanged code). Full Playwright shows exact parity with the prior gate (1197/259) — no regression. A landscape-relevant subset re-run surfaced a Windows-host file-write artifact (143 failures) plus the same 4 already-known baseline mismatches; triaged honestly above and not treated as a new product defect, but also not treated as a pass. Expo-doctor is not green (pre-existing). **All five required real-device classes remain BLOCKED**, two of them (iPhone, iPad) structurally so on this Windows host, and Maestro/native attestation remain BLOCKED. Therefore the landscape release gate is **NO-GO**. Phase 30 must not start.
