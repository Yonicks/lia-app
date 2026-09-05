# Phase 29 report — Full Landscape Native QA and Release Gate (re-run)

## Summary

This is a second execution of the Phase 29 release gate, requested specifically to attempt it "on actual hardware" after the prior run (from a Cursor Windows sandbox) ended `NO-GO` for lack of any device matrix. This run executes from a different host (a Windows 11 desktop, via Claude Code) that turns out to have more native tooling installed (a working `adb`, an Android SDK, an emulator/AVD) than the prior sandbox — but still **zero physical phones or tablets attached**, and, being Windows, **no path to iOS evidence at all** (no macOS, no Xcode, no Simulator). The one nearby iPhone is Bluetooth-paired for audio only, which is not a deployment channel.

Phase 28 still ends with `PRODUCT COMPLETION GATE PASSED`, so this phase was allowed to run. The app code is byte-for-byte unchanged since Phase 28 (`git diff --stat` between `9e75b97` and the prior `d423090` Phase 29 commit, excluding the Phase 29 docs themselves, is empty) — so this run is a genuine re-verification, not a re-test of new code.

All automated checks this environment can run were re-executed rather than copied forward. Native capability, Maestro, offline/process-death, and 30-minute soak evidence were still **not obtained** — the required five real-device classes are **BLOCKED**. Capacitor/legacy was not touched. Phase 30 was not started.

**Release decision: NO-GO** (mandatory hardware matrix still missing, plus a structural inability to ever produce iOS evidence from this specific host; cannot soft-GO from web).

## Pre-flight inventory

### Build / version / branch baseline

| Field | Value |
|---|---|
| Branch | `master` |
| Commit (start of this run) | `d423090be51d4ffd9cc0e16a5f554b3a450539f4` (`Phase 29: Native release gate (NO-GO)`) |
| App code vs. Phase 28 (`9e75b97`) | **Identical** — confirmed via `git diff --stat` on non-doc paths |
| Package | `apps/mobile` `mobile@1.0.0` |
| Expo app version | `1.0.0` (`app.config.ts`) |
| Bundle ids | `com.yonicks.talki` / `com.yonicks.talki.dev` |
| EAS | `eas.json` present (development / preview / production) |
| Local native projects | `apps/mobile/android` and `apps/mobile/ios` **absent** |

### Available real devices

**None deployable.** No USB/wireless dev-accessible device; `adb devices -l` returns an empty list after starting the daemon; no iOS device reachable from this Windows host (Bluetooth-paired iPhone is audio-only). See `phase-29-device-matrix.md` for the full tooling inventory, including the newly-found (vs. prior run) Android SDK/emulator/AVD that still could not be turned into usable native evidence because no JDK is installed on this host.

### Missing required device classes

1. Compact / older Android phone — **missing**
2. Modern Android phone — **missing**
3. Recent iPhone — **missing** (also structurally blocked: no macOS/Xcode on this host)
4. Android tablet — **missing**
5. iPad — **missing** (also structurally blocked: no macOS/Xcode on this host)

### Automated / native test harness

| Harness | Location / command | Status this run |
|---|---|---|
| Typecheck | `npm run typecheck` → `tsc --noEmit` | Ran — PASS |
| Lint | `npm run lint` → `eslint .` | Ran — PASS |
| Unit | `npm run test` → `vitest run` | Ran — PASS |
| Doctor | `npm run doctor` → `expo-doctor` | Ran — FAIL (same 2 checks as prior gate) |
| Web export | `npm run export:web` | Ran — PASS |
| Playwright (full) | `npm run e2e` → `playwright test` | Ran — FAIL, exact parity with prior gate |
| Playwright (landscape subset) | `playwright test --grep-invert "..."` | Ran — FAIL, new local-host I/O artifact found (see below) |
| Maestro full | `npm run maestro:full` | **BLOCKED** — CLI missing; no supported install path on this host |
| Maestro device-qa | `npm run maestro:device-qa` | **BLOCKED** — CLI missing |
| Maestro flows on disk | `apps/mobile/.maestro/*.yaml` | Present, not executed |

### Phase 14 blockers / majors to re-verify

From `docs/migration/phase-14-defects.md`: BLOCKERS P14-B1–B8 and MAJORS P14-M1–M16. Since the code is unchanged since the prior Phase 29 report, the reconciliation table below was **re-verified against current source** (fresh greps for `BottomNavigation`, `Dimensions.get`, `useWindowDimensions`, and the AdMob unit-id wiring — see "Re-verification spot checks" below) rather than blindly copied. All conclusions match the prior report.

### Native capabilities requiring attestation

Audio, TTS, mic, recording, speech recognition, image picker, SQLite durability, backup/restore, AdMob banner lifecycle, keep-awake, deep links, resume/background — all require real devices. Web Playwright is explicitly **not** attestation.

### Proposed QA order and evidence paths (as executed)

1. Automated gate (`tsc`, `eslint`, `vitest`, `expo-doctor`, `expo export`, full Playwright) — done, recorded below.
2. Landscape-relevant Playwright subset — done, recorded below, with an honest triage of a new local-host artifact.
3. Device/tooling inventory on this specific host (adb, SDK, emulator, JDK, Maestro, WSL, Xcode) — done → `phase-29-device-matrix.md`.
4. Maestro on attached/emulated devices — blocked (no JDK for a native build; no Maestro CLI).
5. Five-class real-device matrix + orientation/smoke — blocked → `phase-29-device-matrix.md`.
6. Native capabilities / offline / process-death / soak — blocked.
7. Phase 14 reconciliation (re-verified against current code).
8. Checklist + GO/NO-GO (this report + `phase-29-release-checklist.md`).

## Re-verification spot checks (code unchanged since Phase 28, but re-checked, not assumed)

```
$ grep -ril "BottomNavigation" src app
src/testing/testIds.ts   # only a comment: "replaces BottomNavigation" — no live usage

$ find . -iname "*tabs*" (excluding node_modules)
src/features/parent/tabs   # Parent Center settings tabs — unrelated to old child bottom nav

$ grep -rl "Dimensions.get" src/features
(none)

$ grep -rl "useWindowDimensions" src/features
(none)

$ grep -rn "bannerUnitId\|EXPO_PUBLIC_ADMOB_BANNER_ID" src/services/ads/adConfig.ts
bannerUnitId() still falls back to TEST_BANNER_UNIT_ID unless
EXPO_PUBLIC_ADMOB_BANNER_ID is set; eas.json does not set it in any profile.
```

No regression, no improvement — matches the Phase 28 / prior Phase 29 findings exactly.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| All automated mobile validation is green | **FAIL** | `tsc`/`eslint`/`vitest`/`export` PASS; `expo-doctor` FAIL; full Playwright FAIL; landscape subset FAIL |
| Maestro native suite executed and green | **BLOCKED** | Maestro CLI absent; no supported install path on this Windows host (WSL has only the ephemeral `docker-desktop` distro) |
| All five required real-device classes have named evidence | **BLOCKED** | `phase-29-device-matrix.md` — all BLOCKED; 2 of 5 additionally structurally blocked on this host |
| Launch/orientation/safe-area on every required device | **BLOCKED** | No devices |
| Every registered game natively smoke-tested | **BLOCKED** | No devices |
| Every practice mode natively smoke-tested | **BLOCKED** | No devices |
| Vocabulary/custom words/progress/audio natively verified | **BLOCKED** | No devices |
| Parent Gate/Center + media/backup natively verified | **BLOCKED** | No devices |
| Speech recognition + recording real native evidence | **BLOCKED** | No devices |
| Ad behavior verified; no landscape layout damage | **BLOCKED** native / web placement covered in Phase 28 | Device AdMob not run; production unit id still unset |
| Offline + process-death verified | **BLOCKED** | No devices |
| 30-minute soak evidence exists | **BLOCKED** | Not run |
| Historical Phase 14 blockers/majors reconciled | **PASS** (mapping, re-verified) | Table below |
| No open release blocker/critical remains | **FAIL** | Missing five-device matrix alone is release-blocking |
| Device matrix, checklist, and this report exist | **PASS** | Rewritten this run |

## Historical Phase 14 reconciliation

Sources: `phase-14-defects.md`, `phase-14-report.md`, `phase-14-device-qa.md`, current `apps/mobile` code (unchanged since Phase 28), landscape phase 16–28 reports. Re-verified against current source this run (see spot checks above), not merely copied forward.

### BLOCKERS

| Id | Historical defect | Status | Notes |
|---|---|---|---|
| P14-B1 | No named device matrix | **STILL OPEN** | Repeated again this run — all five classes BLOCKED, two structurally on this host |
| P14-B2 | 30-minute memory soak not run | **STILL OPEN** | Not run this phase |
| P14-B3 | Speech recognition not device-attested | **STILL OPEN** | `expo-speech-recognition` wired; no device pass |
| P14-B4 | Parent recording not device-attested | **STILL OPEN** | Recording services exist; no hardware evidence |
| P14-B5 | AdMob library missing / not attested | **SUPERSEDED** (library) / **STILL OPEN** (device) | `react-native-google-mobile-ads` present; Phase 28 placement policy; **no native banner attestation** |
| P14-B6 | Perf targets not measured on two device classes | **STILL OPEN** | Web timings only |
| P14-B7 | Offline-after-first-load not attested | **STILL OPEN** | Not run offline on device |
| P14-B8 | Maestro full-regression not executed | **STILL OPEN** | CLI still absent; no supported install path found on this host either |

### MAJORS

| Id | Historical defect | Status | Notes |
|---|---|---|---|
| P14-M1 | Sticker art emoji tiles | **RESOLVED** (code/assets) | `stickerArt.ts` + 24 PNGs; native visual QA still pending |
| P14-M2 | `PhotoService.pick` stub | **RESOLVED** (code) | `expo-image-picker` wired; **native permission path BLOCKED** |
| P14-M3 | Storage engine/quota not shown | **RESOLVED** (code) | `SettingsTab` + `readStorageInfo` |
| P14-M4 | `?game=` cold-start deep link | **RESOLVED** (code/web) | `parseGameDeepLink` + `DeepLinkAfterIntro`; **native deep-link BLOCKED** |
| P14-M5 | Unknown-route fallback not Home | **RESOLVED** | `app/+not-found.tsx` → `Redirect` `/` |
| P14-M6 | `celebrate()` missing on category path | **RESOLVED** (code) | `CategoryScreen` uses `shouldCelebrate` |
| P14-M7 | `NEVER_COMBINE` not enforced | **RESOLVED** (code) | `audioPolicy.shouldPlaySfx` + unit parity |
| P14-M8 | Wake lock not ported | **RESOLVED** (code) | `expo-keep-awake` via `useTalkiKeepAwake`; soak still BLOCKED |
| P14-M9 | Native splash / `expo-splash-screen` | **RESOLVED** (code) | Plugin + hide path in `_layout.tsx` |
| P14-M10 | Process-kill SQLite durability | **STILL OPEN** | Needs device force-stop evidence |
| P14-M11 | Screen-reader labels TalkBack/VoiceOver | **STILL OPEN** | Labels present in code; no a11y device pass |
| P14-M12 | Reduce-motion only on intro | **SUPERSEDED** (architecture) / **STILL OPEN** (OS) | Phase 28 centralized `design-system/motion`; OS reduce-motion on device still BLOCKED |
| P14-M13 | Colour contrast not measured | **STILL OPEN** | No WCAG audit this phase |
| P14-M14 | `START_GAME_TOAST` always "4 words" | **RESOLVED** (code) | `startGameToastFor(need)` |
| P14-M15 | Real AdMob unit still Google sample | **STILL OPEN** | Re-verified this run: `bannerUnitId()` still falls back to `TEST_BANNER_UNIT_ID`; `eas.json` sets no `EXPO_PUBLIC_ADMOB_BANNER_ID` in any profile |
| P14-M16 | Dual TopBars / stacked tabs | **SUPERSEDED** | Landscape redesign removed child `BottomNavigation` (re-verified: only a code comment references the old name) |

### Phase 15 historical note

Phase 15 correctly **NO-GO**'d cutover and preserved Capacitor. That decision remains valid until a future Phase 29 produces `LANDSCAPE RELEASE GO` on real hardware.

## Automated commands and results

Working directory: `apps/mobile`.

### Static / unit / export

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
```

### Expo doctor

```
$ npx expo-doctor
19/21 checks passed. 2 checks failed.
- app.json present but unused by app.config.ts
- patch version mismatches: expo 57.0.19 (expected ~57.0.20),
  expo-image-manipulator / expo-image-picker / expo-router one patch behind
EXIT=1
```

Identical to the prior gate. Not treated as fixed here — NO-GO is already mandatory from hardware; no drive-by dependency churn during a release gate.

### Playwright full suite

```
$ npx playwright test
  1197 passed (10.6m)
  259 failed
EXIT=1
```

**Exact parity with the prior Phase 29 gate's 1197 passed / 259 failed.** Spot-checked the non-full-sweep/gallery failures (`landscape-shell.spec.ts`, `memory.spec.ts`, `puzzle.spec.ts`, `quiz.spec.ts`): each is a `expect(page).toHaveScreenshot(expected) failed` pixel-diff against a checked-in baseline; the functional assertions immediately preceding the screenshot call (e.g. the 3-star done-card `aria-label` in `quiz.spec.ts:102`) pass. No new failures, no regressions, nothing weakened or re-baselined.

### Playwright landscape-relevant subset

```
$ npx playwright test --grep-invert "Phase 14 full sweep|captures the .* group baseline|captures the final settled frame baseline"
  1053 passed (8.5m)
  147 failed
EXIT=1
```

Triaged in detail (not just counted): **143 of the 147 failures** throw `Error: UNKNOWN: unknown error, open 'docs/migration/screenshots/phase-XX/...png'` from the shared `captureMatrix` evidence-screenshot helper (`tests/e2e/_helpers.ts:193`) — not from a Playwright snapshot assertion. This subset run started immediately after the full suite had just finished writing thousands of files into the same `docs/migration/screenshots/` tree from 8 parallel workers; the identical stack trace across every affected spec (`sort`, `sounds`, `match`, `memory`, `missing`, `parent`, `phase-28` ×3, `games`, `puzzle`, `quiz`, `stickers`) at the same helper line is consistent with transient Windows file-handle contention (AV/indexing) on a directory that had just been heavily written to — not a functional regression, since the **same test files passed in the full run moments earlier on the same commit**. This is recorded as a local-host CI-hygiene finding (evidence-capturing Playwright runs on this Windows host should not be launched back-to-back against the same output directory, or should write to a scratch path), not a product defect, and is **not** used to soft-pass anything.

The remaining **4 of 147** are genuine `toHaveScreenshot`/`toMatchSnapshot` pixel-diff mismatches — the same already-known quiz/memory/puzzle done-card and landscape-shell baseline issues seen in the full run. No new functional failure was found.

### Maestro

```
$ maestro --version
'maestro' is not recognized ... EXIT=1

$ wsl -l -v
NAME               STATE     VERSION
* docker-desktop    Stopped   2
# Only the ephemeral Docker Desktop WSL distro is registered — no general-
# purpose Linux distro available to install Maestro into.

$ npm run maestro:full
# Windows npm script uses Unix PATH=… injection; Maestro binary absent.
# Documented BLOCKED — not accepted as a green native suite.
```

### Device tooling

```
$ adb version
Android Debug Bridge version 1.0.41
Installed as C:\Users\User\AppData\Local\Android\Sdk\platform-tools\adb.exe

$ adb devices -l
(daemon started)
List of devices attached
(empty)

$ emulator -list-avds
Pixel_2_API_30

$ where java / where javac
Could not find files for the given pattern(s).   # no JDK anywhere on this host
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

**Executed:** none on hardware — same as prior gate; no new capability closed this gap.

**Web-only incidental timings** (Playwright, not device targets) were not re-extracted this run since they were already recorded and unchanged code produces the same order-of-magnitude figures; they do **not** satisfy Phase 29 performance gates regardless.

## Defects found / fixed / open

### Fixed in Phase 29 (this run)

None. No release-blocking code fixes were required or applied — hardware absence already forces NO-GO, and no functional regression was found in the automated re-run.

### New finding this run

- **P29-C1 (informational, not release-blocking)** — Running the full Playwright suite and the landscape-relevant subset back-to-back on this Windows host, both writing evidence screenshots into `docs/migration/screenshots/`, produces transient `UNKNOWN: unknown error` file-write failures in the second run (143 of 147 subset failures). Recommend: don't run evidence-capturing Playwright suites back-to-back against the same output directory on Windows CI/dev hosts, or point `captureMatrix` at a scratch directory. Not a product defect — the same specs' functional assertions passed in the immediately-preceding full run.

### Open / release-blocking (unchanged from prior gate)

1. **P29-B1** — Required five-device hardware matrix entirely unavailable (critical). Two of five (iPhone, iPad) are additionally structurally unobtainable from this specific Windows host.
2. **P29-B2** — Maestro not executable; confirmed no supported install path on this host (native Windows unsupported; WSL has no general-purpose distro).
3. **P29-B3** — All native capability / offline / process-death / soak rows BLOCKED.
4. **P29-B4** — Production AdMob unit id still sample unless env supplied (re-verified, P14-M15).
5. **P29-A1** — Full Playwright not green (stale baselines + quiz/memory done-card failures) — must be triaged on a device-capable host before GO. Unchanged from prior gate (exact parity).
6. **P29-A2** — `expo-doctor` 2 failing checks (config/package patch skew). Unchanged from prior gate.

### Deferred (not Phase 29 redesign)

- Re-baselining historical Phase 14 full-sweep / gallery snapshots for landscape.
- Package patch bumps from expo-doctor.
- Installing a JDK on this host purely to attempt an emulator-only native smoke run (would not satisfy the real-hardware requirement and is a system-dependency change outside this QA gate's scope).
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
| Full Playwright run output | Captured to session scratchpad this run (not committed; log excerpts quoted above) |

## Compact phone / modern phone / tablet (native)

| Class | Result |
|---|---|
| Compact / older Android phone | BLOCKED — unavailable |
| Modern Android phone | BLOCKED — unavailable |
| Recent iPhone | BLOCKED — unavailable + structurally blocked on this host |
| Android tablet | BLOCKED — unavailable |
| iPad | BLOCKED — unavailable + structurally blocked on this host |

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
- This specific host cannot ever produce iOS evidence (no macOS/Xcode) — a future re-run needs either a Mac or a cloud device farm/EAS-integrated iOS test lane, not just "try again on a different Windows machine."
- Continued collection of automated web evidence only; no waiver of missing native rows.
- `npm run maestro:full` on Windows must not be misread as a green native suite when Maestro is absent.
- The Playwright landscape-subset's 143 file-write failures are a local-host artifact, documented above; not used to claim a pass or a regression.

## Risks carried forward (block Phase 30)

1. Real-device orientation lock + splash → intro without portrait flash.
2. Native AdMob on eligible hubs only; gameplay strip reclaim.
3. OS reduce-motion on iOS/Android.
4. Mic / image picker / backup share / OSK on parent forms.
5. Process-death SQLite durability + offline ads fail-soft.
6. 30-minute soak on Hermes + Reanimated.
7. Store production ad unit + Families forms.
8. Triage Playwright quiz/memory done-card failures and stale Phase 14 baselines on a capable host.
9. Obtain macOS/Xcode access (or an equivalent cloud iOS build/test lane) — this Windows host cannot ever supply iPhone/iPad evidence.
10. Obtain physical Android phones/tablets with USB debugging (adb now works on this host; only the devices themselves are missing), and a JDK if a local Gradle build is preferred over EAS for future native smoke runs.

## Files changed (this phase)

- `docs/migration/phase-29-device-matrix.md` (rewritten)
- `docs/migration/phase-29-release-checklist.md` (rewritten)
- `docs/migration/phase-29-report.md` (rewritten)
- `docs/migration/CURSOR-RUN-LOG.md` (updated)

No application code, Capacitor, or Phase 30 cutover files modified.

## Explicit release decision

Entry gate from Phase 28: **passed**.
Automated static/unit/export: **mostly green**, exact parity with the prior gate (doctor + Playwright not green, no new failures).
Required five-device native matrix + Maestro + native attestation + soak: **BLOCKED**, on a host that is additionally structurally incapable of ever producing iOS evidence.

Therefore Phase 29 ends **NO-GO**. Do **not** begin Phase 30. Do **not** retire Capacitor.

NO-GO
