# Phase 14 device QA

Phase 14 requires a named hardware matrix. This sandbox has **no Android
SDK, no Xcode, no Maestro binary, and no attached device**. Every class
below is therefore untested. Corresponding parity rows that need a device
are graded FAIL in `feature-parity-checklist.md`.

## Matrix

| Class | Make | Model | OS version | Result |
|---|---|---|---|---|
| Low-end Android (2–3 GB RAM) | — | — | — | FAIL — no device |
| Mid Android | — | — | — | FAIL — no device |
| Recent Android | — | — | — | FAIL — no device |
| Android tablet | — | — | — | FAIL — no device |
| iPhone (small) | — | — | — | FAIL — no device |
| iPhone (recent) | — | — | — | FAIL — no device |
| iPad | — | — | — | FAIL — no device |

"Tested on Android" does not appear anywhere above. No make/model was
invented.

## Per-device checklist (not executed)

For each named device the prompt required: every screen, every game, every
practice mode, audio, recording, recognition, backup, ads, offline,
background and resume, force-stop persistence, rotation, and permission
denial.

None of those were run on hardware. Maestro flow
`apps/mobile/.maestro/full-regression.yaml` is written and was **not**
executed.

## What was tested instead

- Expo web at ten Playwright viewports (see `full-sweep.spec.ts`).
- Child-simulation on web: burst taps, viewport rotate mid-quiz, repeated
  `goBack`, `visibilitychange` / `pagehide` / `pageshow`.
- Unit + existing per-screen e2e from phases 7–13.

## What this does not prove

Anything in `docs/migration/validation.md` section 4: real `expo-audio`,
Hebrew TTS voices, microphone, orientation locks, SQLite after process
kill, AdMob, background audio session, cold start offline, frame rate,
memory.
