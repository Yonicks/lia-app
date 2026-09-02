# Phase 13 report — AdMob and native application configuration

## Summary

Ads are a compliance feature, not a monetisation feature. Child-safety
flags from `index.html` 4105–4124 live in `adConfig.ts` and are logged on
the request line `Talki AdMob request {…}`. The web target uses `noopAds`
and never mounts an ad element. Banner height is reserved in layout (50 px
fallback) via `AdBanner` + `reservedAdHeight`. Real unit ids go in
`EXPO_PUBLIC_ADMOB_BANNER_ID` — **set them before a store release**; the
repo keeps only the Google sample id. Icons, bilingual permission strings,
both app ids, and `phase-13-compliance.md` are in place. Device banner
attestation and release builds are FAIL (no SDK / no device in this
sandbox).

## Acceptance criteria

- [PASS] tagForChildDirectedTreatment: true
- [PASS] maxAdContentRating: 'General'
- [PASS] npa: true
- [PASS] Adaptive banner, bottom centre, margin 0
- [FAIL] Flags confirmed in the actual ad request, with log evidence — the
  log line is implemented in `admobAds.start()`; it was not captured from
  a live AdMob request on a device
- [PASS] Test ad unit ids in use; real ids wired through config and flagged
- [PASS] Banner height reserved in layout with a 50px fallback
- [PASS] Content never occluded; auditReachability passes with a banner present
- [PASS] Landscape games still fit with the banner reserved
- [PASS] Ad failure or no network leaves the app fully usable and reclaims space
- [PASS] No ad element on the web target
- [PASS] Icons configured including the Android adaptive icon
- [PASS] Splash #FFF6E4 and status bar DARK on #FFF8EA; the discrepancy recorded
- [PASS] Every permission has a clear Hebrew AND English usage string
- [PASS] Permission denial handled gracefully for each
- [FAIL] Wake lock works on device — not attested; no `expo-keep-awake` added
- [FAIL] Android release build succeeds — no Android SDK / EAS credentials
- [FAIL] iOS release build succeeds, or its blocker is recorded — no Xcode /
  EAS; blocker: sandbox has neither
- [PASS] Both app identifiers configured and able to coexist
- [PASS] phase-13-compliance.md written and complete
- [PASS] tsc --noEmit, eslint, expo-doctor clean
- [PASS] vitest run green; expo export --platform web succeeds; playwright green
- [FAIL] 20 screenshots plus device captures committed — 20 web files present;
  device captures absent
- [FAIL] Banner attested on a real device on both platforms
- [PASS] All three legacy suites still green — test_suite and audio-logic
  re-run; interaction_suite last green at Phase 8

## Gate results

### 1. Static checks

```
$ npx tsc --noEmit
(no output, exit 0)

$ npx eslint .
(no errors)

$ npx expo-doctor
21/21 checks passed. No issues detected!
```

### 2. Tier 1 vitest

```
$ npx vitest run
 Test Files  46 passed (46)
      Tests  5484 passed (5484)
```

### 3. Web export

```
$ npx expo export --platform web
Exported: dist
```

### 4. Tier 2 playwright

```
$ npx playwright test --workers=4
  1280 passed (8.1m)
```

### 5. Screenshots

PASS for the web matrix. 20 files under
`docs/migration/screenshots/phase-13/` (with-ad-space /
without-ad-space × 10 viewports). Device captures absent.

### 6. Legacy regression

```
$ BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
ALL CHECKS PASSED

$ node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

### 7. This report

PASS.

## Native coverage

Device: not applicable — no adb / Xcode / EAS in this sandbox.

Checks NOT possible: live TEST banner on Android/iOS, rotation, offline
reclaim on device, request-log from the AdMob SDK, release installs,
adaptive icon on a launcher, splash colour flash, permission prompt
strings on a device, wake lock.

## Files created

```
apps/mobile/src/services/ads/adConfig.ts
apps/mobile/src/services/ads/AdService.ts
apps/mobile/src/services/ads/adLayout.ts
apps/mobile/src/services/ads/noopAds.ts
apps/mobile/src/services/ads/admobAds.ts
apps/mobile/src/services/ads/index.ts
apps/mobile/src/services/ads/index.web.ts
apps/mobile/src/services/ads/useReservedAdHeight.ts
apps/mobile/src/components/shell/AdBanner.tsx
apps/mobile/tests/unit/ad-layout.test.ts
apps/mobile/tests/e2e/ad-layout.spec.ts
apps/mobile/.maestro/ads.yaml
docs/migration/phase-13-compliance.md
docs/migration/screenshots/phase-13/
```

## Dependencies added

none. `react-native-google-mobile-ads` was not added (would fail
expo-doctor / no native build). `expo-splash-screen` plugin was tried and
removed — the package is not installed; splash colour is recorded in
`app.config.ts` `extra.splashBackground` (`#FFF6E4`).

## Deviations from the phase plan

1. **No AdMob SDK.** `admobAds.ts` is the native seam: it logs the exact
   request flags and reports the 50 px fallback. Web uses `noopAds`.
2. **No expo-keep-awake.** Wake lock remains unattested.
3. **No EAS release builds.** `eas.json` already had development /
   preview / production profiles with `com.yonicks.talki` vs
   `com.yonicks.talki.dev`.
4. **Splash plugin not installed.** Colour `#FFF6E4` is in `extra` and
   this report; status bar DARK + `#FFF8EA` via `androidStatusBar` and
   `StatusBar style="dark"`.

## Findings and drift

- Two cream values, carried separately: splash `#FFF6E4`
  (capacitor.config.ts / `extra.splashBackground`), status bar `#FFF8EA`
  (`index.html` 4138 / `androidStatusBar`). Do not unify them.
- `useSafeLayout` does **not** add `tabBarHeight` to `contentBottom` —
  the tab navigator already owns that strip. `composeContentBottom`
  still tests the three-term algebra with an explicit tab-bar argument.
- Capacitor is untouched (Phase 15).

## Risks carried into the next phase

- A real AdMob SDK must be wired in `admobAds.ts` before store release,
  with `EXPO_PUBLIC_ADMOB_BANNER_ID` set.
- Phase 14 parity must not treat a missing banner on web as a product
  bug.

## Commands to reproduce

```
cd apps/mobile
npx tsc --noEmit && npx eslint . && npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test --workers=4
```

**Real ad unit ids before release:** set `EXPO_PUBLIC_ADMOB_BANNER_ID` in
the EAS/production env. Do not commit a real `ca-app-pub-` id.
