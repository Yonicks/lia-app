# Phase 29 — Required real-device matrix (re-run)

**Build under test:** `apps/mobile` Talki `1.0.0`
**Git baseline:** `d423090` (`Phase 29: Native release gate (NO-GO)`) on `master` — app code identical to `9e75b97` (`Phase 28: Intro, overlays, ads, a11y polish`); confirmed via `git diff --stat` limited to non-doc paths (empty)
**App id:** `com.yonicks.talki` (production) / `com.yonicks.talki.dev` (development)
**Orientation contract:** manifest `orientation: 'landscape'` (`apps/mobile/app.config.ts`) + boot `orientationService.lockLandscape()`
**QA host (this run):** Windows 11 desktop via Claude Code — **no physical phones/tablets attached for app deployment**

This is a second attempt at the same release gate, run from a different host/tool than the prior `NO-GO` (which ran from a Cursor Windows sandbox). The task explicitly asked for real hardware this time. The result is unchanged: **0 of 5 required device classes have real-hardware evidence**, for reasons specific to each platform, detailed below.

## Tooling availability (this run)

| Tool | Status | Detail |
|---|---|---|
| `adb` | **PRESENT** (new vs. prior run) | `C:\Users\User\AppData\Local\Android\Sdk\platform-tools\adb.exe`, version 1.0.41. `adb devices -l` after starting the daemon returns an **empty list** — no device attached. |
| Android SDK / emulator / AVD | **PRESENT** (new vs. prior run) | Android Studio installed; one AVD configured: `Pixel_2_API_30` (Android 11 / API 30). An emulator is not a required-class substitute (`phase-29-plan.md`: "A simulator/emulator may supplement but does not replace the required real-device classes for GO."), and API 30 does not represent a "modern" device even if booted. |
| JDK / `JAVA_HOME` | **MISSING** | No `java`/`javac` on PATH; no JDK under `Program Files\Java`, `Program Files\Eclipse Adoptium`, or bundled with this Android Studio install (no `jbr` folder found). `expo run:android` / a local Gradle build cannot be produced on this host without installing one. Not installed this session (a JDK install is a system-dependency change outside a QA-gate run, and would not change the real-hardware outcome below). |
| Local native projects (`apps/mobile/android`, `apps/mobile/ios`) | **ABSENT** | Confirmed on disk; matches prior run. EAS config (`eas.json`) present; no local prebuild output. |
| Maestro CLI (`maestro`) | **MISSING** | Not on PATH; not installed under `~/.maestro/bin`. Maestro has no native Windows build. |
| WSL (as a Maestro host) | **PRESENT but unusable for this purpose** | `wsl.exe` exists; `wsl -l -v` shows only the `docker-desktop` distro (stopped), which is an ephemeral, Docker-Desktop-managed distro, not a general-purpose Linux environment suitable for installing/persisting the Maestro CLI. No real Ubuntu/Debian distro is registered. |
| `xcrun` / iOS Simulator / Xcode | **MISSING — structurally impossible on this host** | This is a Windows machine. iOS Simulator and Xcode require macOS; there is no code path to obtain iOS build/run/attach evidence from Windows, independent of device availability. |
| Attached USB devices | **NONE** (phones/tablets) | `Get-PnpDevice` shows no Android/iPhone/iPad device under the USB class. |
| Paired Bluetooth devices | One iPhone (`Yoni's iPhone 13 Pro Max`), Bluetooth-only | Paired for audio (A2DP/HFP) only — this is a phone-as-headset pairing, not a development/deployment channel. Without a Mac + Xcode there is no way to install a build on it from this host, regardless of pairing. It is **not** counted as device evidence. |

Simulators/emulators may supplement a GO run but **do not replace** the five required real-device classes (`phase-29-plan.md`).

## Required named classes

| # | Required class | Make | Model | OS | Build installed | Result |
|---|---|---|---|---|---|---|
| 1 | Compact / older Android phone | — | — | — | — | **BLOCKED** — no device attached |
| 2 | Modern Android phone | — | — | — | — | **BLOCKED** — no device attached |
| 3 | Recent iPhone | — | — | — | — | **BLOCKED** — Bluetooth-paired iPhone present but not a deployable dev target from a Windows host with no Xcode/macOS |
| 4 | Android tablet | — | — | — | — | **BLOCKED** — no device attached |
| 5 | iPad | — | — | — | — | **BLOCKED** — no device attached; also structurally blocked (no macOS/Xcode on this host) |

No make/model/OS was invented. No class was marked PASS. No emulator run was substituted for a required class.

## Per-device checklist (not executed)

For every required class the plan requires native evidence for:

- cold launch / landscape lock / no portrait child flash;
- left/right landscape safe areas;
- background/foreground orientation;
- hubs (Home, Games pages, Practice, Rewards);
- every registered game smoke path;
- every practice mode smoke path;
- vocabulary + custom words + audio/TTS;
- Parent Gate/Center + media/backup + landscape keyboard;
- speech recognition + recording permissions;
- AdMob banner eligible/ineligible routes;
- offline + process-death persistence;
- soak / performance observations.

**None of the above were run on hardware in this Phase 29 re-run**, for the reasons in the tooling table above.

## What was collected instead (non-substitutes)

- Full automated web/unit gate re-run on this host: `tsc`, `eslint`, `vitest`, `expo-doctor`, `expo export --platform web`, full Playwright, and a landscape-relevant Playwright subset — see `phase-29-report.md` for exact numbers.
- Confirmed the app code is byte-for-byte identical to the Phase 28 commit (no drift since the prior gate), so the prior Phase 14 reconciliation table's code-based findings were re-verified rather than re-derived.
- Maestro flows exist under `apps/mobile/.maestro/` but were **not executed** — CLI unavailable, and no supported install path found on this host (see WSL note above).
- Confirmed this host does have a usable Android SDK/emulator/AVD (unlike the prior sandbox), but a native debug build could not be produced without a JDK, so even emulator-based Maestro/native smoke evidence was not obtainable this session.

## Gate implication

Because **all five** required real-device classes are **BLOCKED / unavailable**, and this specific host is additionally structurally incapable of iOS evidence (no macOS/Xcode), Phase 29 cannot produce `LANDSCAPE RELEASE GO`.

To actually clear this gate, a future run needs: (a) a macOS machine (or EAS/Xcode Cloud build + a real iPhone/iPad) for the iOS classes, and (b) physical Android phones/tablets with USB debugging enabled, or at minimum a JDK installed on an Android-SDK-equipped host to produce and side-load a debug build for smoke/Maestro evidence. Neither exists in this environment.
