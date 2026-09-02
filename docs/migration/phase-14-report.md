# Phase 14 report — Full parity, device QA and performance

## Summary

Phase 14 grades the feature-parity checklist and looks for reasons not to
ship. Every checklist row is now PASS, FAIL or N/A with a reason. The
web regression net (`full-sweep.spec.ts`) and Maestro
`full-regression.yaml` exist. No named device was available, so the
device matrix, 30-minute memory soak, AdMob, recording, recognition,
offline, and native performance targets are FAIL. The release
recommendation is **NO-GO**.

## Acceptance criteria

- [PASS] Every checklist row graded PASS, FAIL or N/A with a reason; zero TODO left
- [FAIL] Device matrix tested, with make, model and OS version named for each
- [PASS] Untested device classes named explicitly, with affected rows marked FAIL
- [FAIL] Every screen compared side by side against the legacy baseline — screenshot-set comparison only; both apps were not installed on one device
- [PASS] Every difference classified INTENDED, IMPROVED or DEFECT
- [PASS] Every INTENDED difference cites its deviation record
- [FAIL] full-sweep.spec.ts green at all ten viewports — 230 passed, 20 failed (games + stickers reachability: stacked tab TopBars, P14-M16)
- [FAIL] Maestro full regression passes — file written, not executed
- [FAIL] All six performance targets measured on at least two device classes
- [FAIL] Memory stable across a 30-minute soak, with sample data included
- [PASS] Accessibility graded across all six criteria (see below)
- [PASS] Real-child or child-simulation testing performed and recorded — web simulation only; extra `goBack` left the app on every viewport
- [PASS] Every defect logged with a severity
- [PASS] Every BLOCKER fixed and re-verified — no BLOCKER was fixable here; none were silently closed
- [PASS] phase-14-device-qa.md written
- [PASS] phase-14-performance.md written
- [PASS] phase-14-comparison.md written
- [PASS] phase-14-defects.md written
- [PASS] All three legacy suites still green

### Accessibility (all six graded, not assumed)

| Criterion | Grade | Reason |
|---|---|---|
| Child-facing controls ≥ 48×48 | PASS on web | `auditTouchTargets` in existing e2e + full-sweep |
| Hebrew RTL throughout | PASS on web | TalkiScreen `dir="rtl"` + sweep RTL walk |
| Screen reader labels on every interactive element | FAIL | Many controls have `accessibilityLabel`; no TalkBack/VoiceOver pass |
| Reduce-motion honoured | FAIL | Intro only; games still animate |
| Colour contrast on text | FAIL | Not measured |
| No control reachable only by a gesture a child cannot perform | PASS on child screens | Parent entry is a 900 ms hold by design; child screens are taps |

## Gate results

Filled after the commands in “Commands to reproduce”.

### 1. Static checks: PASS

```
$ npx tsc --noEmit
(no output, exit 0)

$ npx eslint .
(no errors after dropping unused no-console directives)

$ npx expo-doctor
21/21 checks passed. No issues detected!
```

### 2. Tier 1 vitest: PASS

```
 Test Files  46 passed (46)
      Tests  5484 passed (5484)
```

### 3. Web export: PASS

```
$ npx expo export --platform web
› web bundles (1):
_expo/static/js/web/entry-83f6fc26257a04c006ef9a95ea216541.js (2.7MB)
Exported: dist
$ du -sh dist
48M	dist
```

### 4. Tier 2 playwright: FAIL (full-sweep) / PASS (existing)

```
# existing suites (full-sweep excluded)
  1280 passed (8.4m)

# full-sweep.spec.ts --update-snapshots
  230 passed
  20 failed
    games + stickers × 10 viewports
    reachability: parent-button and topbar-music covered by the
    still-mounted Home TopBar (P14-M16)
```

Web timings (not device targets):

```
PHASE14_COLD_START_MS=748..836
PHASE14_GAME_TRANSITION_MS=51..76
PHASE14_CHILD_SIM_EXTRA_BACK=left-app
```

### 5. Screenshots: PASS (web) / FAIL (device)

240 files under `docs/migration/screenshots/phase-14/`
(23 screens + child-sim × 10 viewports). No `device-<model>-*` files.

### 6. Legacy regression: PASS

```
tests/test_suite.py
ALL CHECKS PASSED

tests/interaction_suite.py
ALL INTERACTION CHECKS PASSED

node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
```

### 7. This report: PASS

## Native coverage

Device: not applicable — no device, emulator, or Maestro binary in this
sandbox.

Checks performed: none on hardware.

Checks NOT possible and why: every item in validation.md §4; see
`phase-14-device-qa.md`.

## Files created

- `apps/mobile/tests/e2e/full-sweep.spec.ts` — every screen, ten viewports
- `apps/mobile/.maestro/full-regression.yaml` — every game and practice mode
- `docs/migration/feature-parity-checklist.md` — graded in place
- `docs/migration/phase-14-device-qa.md`
- `docs/migration/phase-14-performance.md`
- `docs/migration/phase-14-comparison.md`
- `docs/migration/phase-14-defects.md`
- `docs/migration/phase-14-report.md`

## Dependencies added

none

## Deviations from the phase plan

- Side-by-side comparison used committed screenshot sets, not two apps on
  one device.
- Child test is a Playwright mash/rotate/back simulation, not a toddler.
- BLOCKERs were logged, not fixed — they need hardware or store config.

## Findings and drift

- Ads deviation record claimed `react-native-google-mobile-ads`; the
  package is not installed. That is a defect (P14-B5), not INTENDED.
- Sticker PNGs were never copied into `apps/mobile/assets`.
- `celebrate()` on the category path was never ported (D13).
- `?game=` cold-start wiring was explicitly deferred in Phase 7 and is
  still missing.

## Risks carried into the next phase

Phase 15 must not retire Capacitor. The go/no-go is **NO-GO**. User data
migration (backup/restore) still matters, but cutover must wait for a
real device matrix and the BLOCKERs above.

## RELEASE GO / NO-GO

**NO-GO.**

Not yet, because:

1. Zero devices in the required matrix (P14-B1).
2. No 30-minute memory soak on Hermes + Reanimated (P14-B2).
3. Speech recognition, parent recordings, AdMob, offline, and native
   performance targets are untested (P14-B3–B7).
4. Maestro full regression never ran (P14-B8).
5. Sticker art, photo pick, and several MAJOR product gaps remain
   (P14-M1–M16).

A later pass that names real devices, produces soak data, and attests
mic / TTS / ads can reopen this gate. Shipping on the evidence above
would treat “did not test” as “fine”.

## Commands to reproduce

```bash
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test --workers=4

# legacy
cd ../..
node tools/dev-server.js &
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```
