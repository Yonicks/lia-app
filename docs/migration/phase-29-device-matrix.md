# Phase 29 — Required real-device matrix

**Build under test:** `apps/mobile` Talki `1.0.0`  
**Git baseline:** `9e75b97` (`Phase 28: Intro, overlays, ads, a11y polish`) on `master`  
**App id:** `com.yonicks.talki` (production) / `com.yonicks.talki.dev` (development)  
**Orientation contract:** manifest `orientation: 'landscape'` + boot `orientationService.lockLandscape()`  
**QA host:** Cursor Windows sandbox — **no physical devices, no emulators/simulators attached**

## Tooling availability (this run)

| Tool | Status |
|---|---|
| `adb` | **MISSING** — not on PATH; `ANDROID_HOME` / `ANDROID_SDK_ROOT` empty |
| Android emulator | **MISSING** |
| Maestro CLI (`maestro`) | **MISSING** — not installed under `~/.maestro/bin` or PATH |
| `xcrun` / iOS Simulator | **MISSING** (Windows host) |
| Expo prebuild `android/` / `ios/` dirs | **ABSENT** under `apps/mobile/` (EAS config present; no local native projects) |
| Attached USB / wireless devices | **NONE** |

Simulators/emulators may supplement a GO run but **do not replace** the five required real-device classes (`phase-29-plan.md`).

## Required named classes

| # | Required class | Make | Model | OS | Build installed | Result |
|---|---|---|---|---|---|---|
| 1 | Compact / older Android phone | — | — | — | — | **BLOCKED** — device unavailable |
| 2 | Modern Android phone | — | — | — | — | **BLOCKED** — device unavailable |
| 3 | Recent iPhone | — | — | — | — | **BLOCKED** — device unavailable |
| 4 | Android tablet | — | — | — | — | **BLOCKED** — device unavailable |
| 5 | iPad | — | — | — | — | **BLOCKED** — device unavailable |

No make/model/OS was invented. No class was marked PASS.

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

**None of the above were run on hardware in this Phase 29 session.**

## What was collected instead (non-substitutes)

- Automated web gate: `tsc`, `eslint`, `vitest`, `expo export --platform web`, full Playwright (see `phase-29-report.md`).
- Maestro flows exist under `apps/mobile/.maestro/` but were **not executed** (CLI absent).
- Prior landscape phases already marked native rows BLOCKED; this matrix confirms the same hardware gap for the release gate.

## Gate implication

Because **all five** required real-device classes are **BLOCKED / unavailable**, Phase 29 cannot produce `LANDSCAPE RELEASE GO`.
