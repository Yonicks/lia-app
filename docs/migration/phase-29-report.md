# Phase 29 report — Full Landscape Native QA and Release Gate

## Summary

Phase 29 is the landscape **release evidence gate**, not a redesign sprint. Phase 28 correctly ended with `PRODUCT COMPLETION GATE PASSED`, so this phase was allowed to run.

This Cursor Windows sandbox has **no physical devices, no emulators/simulators, no `adb`, and no Maestro CLI**. All five required real-device classes are therefore **BLOCKED / unavailable**. Automated checks that *can* run were executed and recorded. Native capability, Maestro, offline/process-death, and 30-minute soak evidence were **not** obtained. Capacitor/legacy was not touched. Phase 30 was not started.

**Release decision: NO-GO** (mandatory hardware matrix missing; cannot soft-GO from web evidence).

## Pre-flight inventory

### Build / version / branch baseline

| Field | Value |
|---|---|
| Branch | `master` |
| Commit | `9e75b97db3af1203921ac25f8b0f44dfac44d525` |
| Commit subject | `Phase 28: Intro, overlays, ads, a11y polish` |
| Package | `apps/mobile` `mobile@1.0.0` |
| Expo app version | `1.0.0` (`app.config.ts`) |
| Bundle ids | `com.yonicks.talki` / `com.yonicks.talki.dev` |
| EAS | `eas.json` present (development / preview / production) |
| Local native projects | `apps/mobile/android` and `apps/mobile/ios` **absent** |

### Available real devices

**None.** No USB/wireless devices; `adb` not installed; Android SDK env empty; no iOS tooling on Windows; Maestro absent.

### Missing required device classes

1. Compact / older Android phone — **missing**  
2. Modern Android phone — **missing**  
3. Recent iPhone — **missing**  
4. Android tablet — **missing**  
5. iPad — **missing**

### Automated / native test harness

| Harness | Location / command | Status this run |
|---|---|---|
| Typecheck | `npm run typecheck` → `tsc --noEmit` | Ran — PASS |
| Lint | `npm run lint` → `eslint .` | Ran — PASS |
| Unit | `npm run test` → `vitest run` | Ran — PASS |
| Doctor | `npm run doctor` → `expo-doctor` | Ran — FAIL (2 checks) |
| Web export | `npm run export:web` | Ran — PASS |
| Playwright | `npm run e2e` → `playwright test` | Ran — FAIL |
| Maestro full | `npm run maestro:full` | **BLOCKED** — CLI missing |
| Maestro device-qa | `npm run maestro:device-qa` | **BLOCKED** — CLI missing |
| Maestro flows on disk | `apps/mobile/.maestro/*.yaml` | Present, not executed |

### Phase 14 blockers / majors to re-verify

From `docs/migration/phase-14-defects.md`: BLOCKERS P14-B1–B8 and MAJORS P14-M1–M16. Full reconciliation table below. Historical Phase 15 stopped cutover on Phase 14 NO-GO and left Capacitor intact (`phase-15-report.md`) — still true.

### Native capabilities requiring attestation

Audio, TTS, mic, recording, speech recognition, image picker, SQLite durability, backup/restore, AdMob banner lifecycle, keep-awake, deep links, resume/background — all require real devices. Web Playwright is explicitly **not** attestation.

### Proposed QA order and evidence paths

1. Automated gate (done) → record in this report.  
2. Maestro on attached devices (blocked).  
3. Five-class matrix + orientation/smoke (blocked) → `phase-29-device-matrix.md`.  
4. Native capabilities / offline / process-death / soak (blocked).  
5. Phase 14 reconciliation (code + prior landscape reports; device rows remain open).  
6. Checklist + GO/NO-GO (this report + `phase-29-release-checklist.md`).

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| All automated mobile validation is green | **FAIL** | `tsc`/`eslint`/`vitest`/`export` PASS; `expo-doctor` FAIL; full Playwright FAIL |
| Maestro native suite executed and green | **BLOCKED** | Maestro CLI absent; flows not run |
| All five required real-device classes have named evidence | **BLOCKED** | `phase-29-device-matrix.md` — all BLOCKED |
| Launch/orientation/safe-area on every required device | **BLOCKED** | No devices |
| Every registered game natively smoke-tested | **BLOCKED** | No devices |
| Every practice mode natively smoke-tested | **BLOCKED** | No devices |
| Vocabulary/custom words/progress/audio natively verified | **BLOCKED** | No devices |
| Parent Gate/Center + media/backup natively verified | **BLOCKED** | No devices |
| Speech recognition + recording real native evidence | **BLOCKED** | No devices |
| Ad behavior verified; no landscape layout damage | **BLOCKED** native / web placement covered in Phase 28 | Device AdMob not run |
| Offline + process-death verified | **BLOCKED** | No devices |
| 30-minute soak evidence exists | **BLOCKED** | Not run |
| Historical Phase 14 blockers/majors reconciled | **PASS** (mapping) | Table below — several still open / native-pending |
| No open release blocker/critical remains | **FAIL** | Missing five-device matrix alone is release-blocking |
| Device matrix, checklist, and this report exist | **PASS** | Files written this phase |

## Historical Phase 14 reconciliation

Sources: `phase-14-defects.md`, `phase-14-report.md`, `phase-14-device-qa.md`, current `apps/mobile` code, landscape phase 16–28 reports.

### BLOCKERS

| Id | Historical defect | Status | Notes |
|---|---|---|---|
| P14-B1 | No named device matrix | **STILL OPEN** | Repeated as Phase 29 matrix — all five classes BLOCKED |
| P14-B2 | 30-minute memory soak not run | **STILL OPEN** | Not run this phase |
| P14-B3 | Speech recognition not device-attested | **STILL OPEN** | `expo-speech-recognition` wired; no device pass |
| P14-B4 | Parent recording not device-attested | **STILL OPEN** | Recording services exist; no hardware evidence |
| P14-B5 | AdMob library missing / not attested | **SUPERSEDED** (library) / **STILL OPEN** (device) | `react-native-google-mobile-ads` present; Phase 28 placement policy; **no native banner attestation** |
| P14-B6 | Perf targets not measured on two device classes | **STILL OPEN** | Web timings only (`PHASE14_COLD_START_MS` ~1050–1114 in this Playwright run) |
| P14-B7 | Offline-after-first-load not attested | **STILL OPEN** | Not run offline on device |
| P14-B8 | Maestro full-regression not executed | **STILL OPEN** | CLI still absent |

### MAJORS

| Id | Historical defect | Status | Notes |
|---|---|---|---|
| P14-M1 | Sticker art emoji tiles | **RESOLVED** (code/assets) | `stickerArt.ts` + 24 `assets/v2/stickers/talki-sticker-*.png` in `v2.generated.ts`; native visual QA still pending |
| P14-M2 | `PhotoService.pick` stub | **RESOLVED** (code) | `expo-image-picker` + 320×320 JPEG manipulate in `services/photos`; **native permission path BLOCKED** |
| P14-M3 | Storage engine/quota not shown | **RESOLVED** (code) | `SettingsTab` + `readStorageInfo` / `formatStorageInfo` |
| P14-M4 | `?game=` cold-start deep link | **RESOLVED** (code/web) | `parseGameDeepLink` + `DeepLinkAfterIntro` in `app/_layout.tsx`; Phase 28 e2e; **native deep-link BLOCKED** |
| P14-M5 | Unknown-route fallback not Home | **RESOLVED** | `app/+not-found.tsx` → `Redirect` `/` |
| P14-M6 | `celebrate()` missing on category path | **RESOLVED** (code) | `CategoryScreen` uses `shouldCelebrate` / `celebrateTitle` |
| P14-M7 | `NEVER_COMBINE` not enforced | **RESOLVED** (code) | `audioPolicy.shouldPlaySfx` + unit parity |
| P14-M8 | Wake lock not ported | **RESOLVED** (code) | `expo-keep-awake` via `useTalkiKeepAwake` in root layout; soak still BLOCKED |
| P14-M9 | Native splash / `expo-splash-screen` | **RESOLVED** (code) | Plugin + 1400 ms hide path in `_layout.tsx` |
| P14-M10 | Process-kill SQLite durability | **STILL OPEN** | Needs device force-stop evidence |
| P14-M11 | Screen-reader labels TalkBack/VoiceOver | **STILL OPEN** | Labels present in code; no a11y device pass |
| P14-M12 | Reduce-motion only on intro | **SUPERSEDED** (architecture) / **STILL OPEN** (OS) | Phase 28 centralized `design-system/motion`; OS reduce-motion on device still BLOCKED |
| P14-M13 | Colour contrast not measured | **STILL OPEN** | No WCAG audit this phase |
| P14-M14 | `START_GAME_TOAST` always “4 words” | **RESOLVED** (code) | `startGameToastFor(need)` with `minItemsFor` |
| P14-M15 | Real AdMob unit still Google sample | **STILL OPEN** | `bannerUnitId()` falls back to `TEST_BANNER_UNIT_ID` unless `EXPO_PUBLIC_ADMOB_BANNER_ID` set |
| P14-M16 | Dual TopBars / stacked tabs | **SUPERSEDED** | Landscape redesign removed child `BottomNavigation`; side/top shell (Phases 19–28) |

### Phase 15 historical note

Phase 15 correctly **NO-GO**’d cutover and preserved Capacitor. That decision remains valid until a future Phase 29 produces `LANDSCAPE RELEASE GO` on real hardware.

## Automated commands and results

Working directory: `apps/mobile` (unless noted).

### Static / unit / export (reconfirmed this session)

```
$ npx tsc --noEmit
EXIT=0

$ npx eslint .
EXIT=0

$ npx vitest run
 Test Files  53 passed (53)
      Tests  5551 passed (5551)
EXIT=0

$ npx expo export --platform web
› web bundles (1): entry-ec10472c7d6a513a43e776aa9f0ebd8a.js (2.8MB)
Exported: dist
EXIT=0
# dist ≈ 94 MB
```

### Expo doctor (earlier this session)

```
$ npx expo-doctor
19/21 checks passed. 2 checks failed.
- app.json present but unused by app.config.ts
- patch version mismatches: expo 57.0.19 (expected ~57.0.20),
  expo-image-manipulator / expo-image-picker / expo-router one patch behind
EXIT=1
```

Not treated as fixed in this gate (NO-GO already mandatory from hardware; no drive-by dependency churn).

### Playwright full suite

```
$ npx playwright test
  1197 passed (8.8m)
  259 failed
EXIT=1
```

Failure profile (honest):

- **Majority:** stale Phase 14 `full-sweep.spec.ts` screenshot baselines vs post-landscape UI; Phase 5 gallery group baselines; some intro settled-frame baselines.
- **Non-baseline functional/visual:** `quiz.spec` “full playthrough reaches the 3-star done card” and `memory.spec` “matching all six pairs reaches the done card…” failed across viewports (done-card screenshot/assert path); some `landscape-shell` visual baselines; full-sweep also logged sort/puzzle `measureInWindow` page errors on web.
- **Not weakened:** failures were recorded, not skipped or baseline-rewritten to force green.

### Playwright landscape-relevant subset

```
$ npx playwright test --grep-invert "Phase 14 full sweep|captures the .* group baseline|captures the final settled frame baseline"
  1103 passed (6.5m)
EXIT=1
```

Remaining failures still include quiz/memory done-card playthroughs and other non-excluded cases. Useful as a regression signal; **not** a substitute for native GO.

### Maestro

```
$ maestro --version
'maestro' is not recognized ... EXIT=1

$ npm run maestro:full
# Windows npm script uses Unix PATH=… injection; Maestro binary absent.
# Documented BLOCKED — not accepted as a green native suite.
```

### Device tooling

```
$ adb devices
'adb' is not recognized ...
ANDROID_HOME=
ANDROID_SDK_ROOT=
```

## Maestro results

| Suite | Result |
|---|---|
| `.maestro/full-regression.yaml` | **BLOCKED** — not executed |
| `.maestro/device-qa.yaml` | **BLOCKED** — not executed |
| Other flows (`smoke`, `home`, `games-*`, `practice`, `parent`, `ads`, `intro`, …) | **BLOCKED** — not executed |

## Native capability attestation

| Capability | Result | Notes |
|---|---|---|
| Audio playback | BLOCKED | |
| TTS | BLOCKED | |
| Microphone permission | BLOCKED | |
| Audio recording | BLOCKED | |
| Speech recognition | BLOCKED | |
| Image / photo picker | BLOCKED | Code path exists; device grant/deny not proven |
| SQLite / persistence | BLOCKED | |
| Backup / restore / files | BLOCKED | |
| AdMob banner lifecycle | BLOCKED | Sample unit id default; Families forms still a store risk |
| Keep-awake | BLOCKED | Hook mounted; not soak-proven |
| Deep links | BLOCKED | |
| Resume / background | BLOCKED | |

## Offline / process-death results

| Scenario | Result |
|---|---|
| Progress survives relaunch | BLOCKED |
| Settings survive relaunch | BLOCKED |
| Custom words/photos/audio survive | BLOCKED |
| Reward state survives | BLOCKED |
| Process kill at safe points | BLOCKED |
| Offline core content / ads fail-soft | BLOCKED |

## Soak / performance methodology and results

**Methodology planned:** cold-start + transition observations on one compact and one modern device; 30-minute continuous child-flow soak; optional parent/media soak; profiler/log capture.

**Executed:** none on hardware.

**Web-only incidental timings** (Playwright full run, not device targets):

- `PHASE14_COLD_START_MS` ≈ 1050–1114  
- `PHASE14_GAME_TRANSITION_MS` ≈ 199–282  
- `PHASE14_CHILD_SIM_EXTRA_BACK=left-app` (web history; not native back)

These do **not** satisfy Phase 29 performance gates.

## Defects found / fixed / open

### Fixed in Phase 29

None. No release-blocking code fixes were applied (hardware absence already forces NO-GO; no scope to soft-pass via web-only patches).

### Open / release-blocking

1. **P29-B1** — Required five-device hardware matrix entirely unavailable (critical).  
2. **P29-B2** — Maestro not executable.  
3. **P29-B3** — All native capability / offline / process-death / soak rows BLOCKED.  
4. **P29-B4** — Production AdMob unit id still sample unless env supplied (P14-M15).  
5. **P29-A1** — Full Playwright not green (stale baselines + quiz/memory done-card failures) — must be triaged on a device-capable host before GO.  
6. **P29-A2** — `expo-doctor` 2 failing checks (config/package patch skew).

### Deferred (not Phase 29 redesign)

- Re-baselining historical Phase 14 full-sweep / gallery snapshots for landscape.  
- Package patch bumps from expo-doctor.  
- Capacitor retirement (Phase 30 only after GO).

## Screenshots / log / video evidence index

| Evidence | Path / note |
|---|---|
| Device matrix | `docs/migration/phase-29-device-matrix.md` |
| Release checklist | `docs/migration/phase-29-release-checklist.md` |
| This report | `docs/migration/phase-29-report.md` |
| Prior landscape web screenshots | `docs/migration/screenshots/phase-16` … `phase-28` (historical; not native) |
| Native device photos / video / soak logs | **NONE** — not captured |
| Maestro reports | **NONE** |
| Accidental e2e screenshot churn | Reverted / deleted; not kept as Phase 29 evidence |

## Compact phone / modern phone / tablet (native)

| Class | Result |
|---|---|
| Compact / older Android phone | BLOCKED — unavailable |
| Modern Android phone | BLOCKED — unavailable |
| Recent iPhone | BLOCKED — unavailable |
| Android tablet | BLOCKED — unavailable |
| iPad | BLOCKED — unavailable |

## Native coverage

| Area | This run |
|---|---|
| iOS / Android device attach | **BLOCKED** |
| Orientation / safe areas | **BLOCKED** |
| Games / practice / parent / ads on device | **BLOCKED** |
| Speech / mic / picker / AdMob | **BLOCKED** |
| Offline / process-death / soak | **BLOCKED** |
| Maestro | **BLOCKED** |

Do not treat Expo web or Playwright as native attestation.

## Assets still missing / store risks

- Yonicks Studios bumper logo assets (optional; bumper skips — carried from Phase 28).  
- Production AdMob banner unit id via env + Families / child-directed store forms.  
- No new production art invented this phase.

## Deviations / blockers

- Mandatory device classes unavailable → gate cannot GO.  
- Continued collection of automated web evidence only; no waiver of missing native rows.  
- `npm run maestro:full` on Windows must not be misread as a green native suite when Maestro is absent.

## Risks carried forward (block Phase 30)

1. Real-device orientation lock + splash → intro without portrait flash.  
2. Native AdMob on eligible hubs only; gameplay strip reclaim.  
3. OS reduce-motion on iOS/Android.  
4. Mic / image picker / backup share / OSK on parent forms.  
5. Process-death SQLite durability + offline ads fail-soft.  
6. 30-minute soak on Hermes + Reanimated.  
7. Store production ad unit + Families forms.  
8. Triage Playwright quiz/memory done-card failures and stale Phase 14 baselines on a capable host.

## Files changed (this phase)

- `docs/migration/phase-29-device-matrix.md` (new)  
- `docs/migration/phase-29-release-checklist.md` (new)  
- `docs/migration/phase-29-report.md` (new)  
- `docs/migration/CURSOR-RUN-LOG.md` (updated)

No application code, Capacitor, or Phase 30 cutover files modified.

## Explicit release decision

Entry gate from Phase 28: **passed**.  
Automated static/unit/export: **mostly green** (doctor + Playwright not green).  
Required five-device native matrix + Maestro + native attestation + soak: **BLOCKED**.  

Therefore Phase 29 ends **NO-GO**. Do **not** begin Phase 30. Do **not** retire Capacitor.

NO-GO
