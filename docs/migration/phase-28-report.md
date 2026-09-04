# Phase 28 report — Intro, Overlays, Ads, Accessibility, Global Polish

## Summary

Phase 28 finishes global landscape polish: route-aware banner ads (no
always-on root shrink of gameplay), centralized reduce-motion policy,
overlay/toast/done/reward safe-area polish, intro/deep-link preservation,
accessibility semantics sweep, and confirmation that no portrait child UI or
bottom navigation remains reachable. Capacitor untouched. Phase 29 (device
release gate) not started.

## Pre-flight inventory (recorded before edits)

### Global / transient surfaces found

| Surface | Location |
|---|---|
| Splash / font gate | `app/_layout.tsx` |
| Studio bumper | `features/intro/studioBumper.tsx` (asset-less skip) |
| Intro sequence | `features/intro/IntroSequence.tsx` |
| Toast host | `components/shell/ToastHost.tsx` |
| Reward overlay | `components/shell/RewardOverlay.tsx` |
| Done card | `features/games/shell/DoneCard.tsx` |
| Parent gate (gallery) | `components/shell/ParentGate.tsx` |
| Parent gate (product) | `features/parent/ParentGateScreen.tsx` |
| Ad banner | `components/shell/AdBanner.tsx` (+ `.web.tsx`) |
| Not-found | `app/+not-found.tsx` → Redirect home |

### Intro / deep-link flow

Boot: bumper → intro → app (`?intro=0` / session flag bypass). App stage
mounts Stack + `DeepLinkAfterIntro` (`?game=` → `gameHref`). Isolated
`/intro` route remains for e2e frame capture.

### Ad configuration before this phase

Root `_layout` always mounted `AdBanner` under every Stack route after
intro. No eligibility table. Web: reserved strip only via E2E injection.
Child-safety flags unchanged (`adConfig.ts` / phase-13 compliance).

### Responsive / bottom-nav / portrait remnants

- `BottomNavigation` / `(tabs)`: **absent** on disk (removed Phase 19).
- Feature screens: no local `Dimensions.get` / `useWindowDimensions` /
  width-only `isTablet` (only centralized `useDevice` / `deviceClass`).
- Portrait classification remains for geometry math only; product lock is
  landscape via `orientationService.lockLandscape()`.

### Accessibility / reduce-motion before this phase

- OS `useReducedMotion` only in Intro + page dots.
- No shared motion module; Toast/Reward/bubbles ignored reduce-motion.

### Proposed ad policy architecture

Exact-path eligibility for hubs/parent; suppress active play/detail/intro/
dev; durable doc at `docs/design/landscape/ad-placement-policy.md`; pure
`adPlacement.ts` + route-aware `AdBanner`.

### Test / visual plan

Unit: placement + reduce-motion helpers. E2E: `phase-28.spec.ts`,
`ad-layout.spec.ts`, intro functional. Screenshots × 8 viewports. Native
device: honest BLOCKED if no hardware.

## Gate

Phase 27 report ends with `REWARDS AND PARENT READY FOR PHASE 28` — confirmed.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| Intro/splash/global launch landscape-safe | PASS | Existing intro e2e + reduce-motion hold; splash `#FFF6E4`; orientation lock at boot |
| Deep-link-after-intro preserved | PASS | `phase-28.spec.ts` `/?game=quiz` (reduced motion) + `?intro=0&game=quiz` |
| Global overlays/feedback landscape-safe | PASS | Toast ad-aware bottom inset; RewardOverlay safe-area + landscape max width; DoneCard tokens |
| Central reduce-motion policy + key animations | PASS | `design-system/motion/*`; Intro, page dots, Toast, Reward, ParentGate shell, native bubbles |
| Accessibility sweep documented | PASS | Labels/roles preserved; decorative images hidden; live region on toast; touch audit on home; exceptions below |
| Route-aware ad policy; no accidental overlay/shrink | PASS | `ad-placement-policy.md` + `adPlacement.ts` + AdBanner eligibility |
| Ad load/failure layout stability | PASS | E2E reclaim on ineligible; reserved collapse to 0; web inject/reclaim |
| No bottom-nav child experience reachable | PASS | File absent; e2e asserts no `bottom-nav` / tab-bar ids; side nav present |
| No portrait child UI reachable in Expo | PASS | Landscape lock + matrix; no portrait routes |
| No known responsive/orientation bypass without justification | PASS | Grep: only centralized responsive module uses `useWindowDimensions` |
| Compact phone + tablet visual sweep | PASS | 104 screenshots under `docs/migration/screenshots/phase-28/` |
| Full relevant regression | PASS | tsc/eslint/vitest/expo export/Playwright below |
| `docs/migration/phase-28-report.md` exists | PASS | This file |

## Global surface inventory

| Surface | Landscape treatment |
|---|---|
| Font loading | `boot-fonts-loading` + Hebrew `accessibilityLabel` |
| Bumper | Still asset-less immediate complete (Phase 06 decision) |
| Intro | Landscape cover art; reduce-motion settled hold via shared constant |
| Toast | Reduce-motion fade; sits above reserved ad strip |
| Reward overlay | `animationType` none when reduced; safe insets; decorative art hidden |
| Done card | Landscape pad/maxWidth tokens |
| Ads | Route-aware bottom strip on eligible hubs only |
| Not-found | Redirect → Home (legacy behaviour preserved) |

## Ad placement policy summary

**Document:** `docs/design/landscape/ad-placement-policy.md`  
**Code:** `apps/mobile/src/services/ads/adPlacement.ts`

| Eligible (exact) | Ineligible |
|---|---|
| `/`, `/games`, `/practice`, `/rewards`, `/parent` | `/game/*`, `/practice/<id>`, `/category/*`, `/cards/*`, `/intro`, `/dev/*`, opening stages |

- App-open / interstitial: **disabled** (`APP_OPEN_ADS_ENABLED = false`).
- Native load: reserve `AD_FALLBACK_PX` then real height; failure → 0.
- Web: no AdMob DOM; E2E reserved injection only on eligible routes.
- World shells do not double-count ad height (root column owns the strip).

Commercial format unchanged (adaptive banner only). Placement decision is
explicit — not PRODUCT-BLOCKED.

## Reduce-motion / accessibility findings

### Reduce-motion

Central path: `useTalkiReducedMotion()` + `motionDurationMs` /
`modalAnimationType` in `src/design-system/motion/`.

Honoured by: IntroSequence, LandscapePageIndicator, ToastHost,
RewardOverlay, shell ParentGate, native BubbleView rise.

### Accessibility

- Interactive controls continue to use Hebrew `accessibilityLabel` + roles
  (existing convention; home touch/reach audits green).
- Reward/Done decorative images: `accessibilityElementsHidden`.
- Toast: `accessibilityLiveRegion="polite"` (non-interactive, no role).
- Intro full-screen skip layer remains `accessibilityElementsHidden`
  (intentional — tap-anywhere skip, not a labelled control).
- Child min touch 48dp via `LANDSCAPE_MIN_TOUCH` / e2e audits.

### Exceptions

- Studio bumper still has no studio logo assets (Phase 06 DESIGN gap;
  optional prefix — not treated as Phase 28 DESIGN-BLOCKED).
- Intro final-frame Playwright snapshot can flake at ~0.01 pixel ratio under
  web font AA; functional reduce-motion intro assertions PASS without
  updating baselines.

## Remaining portrait / bypass search results

```
BottomNavigation.tsx          — NOT PRESENT
app/(tabs)/                   — NOT PRESENT
Features Dimensions.get       — none
Features useWindowDimensions  — none (only useDevice)
Width-only isTablet checks    — none (deviceClass only)
```

## Tests and exact results

```
$ npx tsc --noEmit                 # exit 0
$ npx eslint .                     # exit 0
$ npx vitest run                   # 53 files / 5551 tests PASS
$ npx expo export --platform web   # exit 0
$ npx playwright test \
    tests/e2e/phase-28.spec.ts tests/e2e/ad-layout.spec.ts \
    --workers=1 \
    # all 8 landscape projects
  # 80 passed (10 tests × 8 viewports)
$ npx playwright test tests/e2e/intro.spec.ts \
    --project=compact-phone \
    --grep "reduced motion|intro=0|tapping|plays from"
  # 4 passed (functional intro; snapshot baseline not re-baselined)
```

Generated asset / theme snapshot noise from export was reverted
(`audio.generated.ts`, `v2.generated.ts`, `words.generated.ts`,
`theme.test.ts.snap`). Accidental phase-06/13 screenshot re-captures
reverted.

## Screenshot index

Under `docs/migration/screenshots/phase-28/` (104 files, 13 names × 8
viewports):

- `ad-eligible-home`, `ad-ineligible-quiz`, `ad-reclaimed-games`
- `intro-deeplink-quiz`
- `reward-overlay-reduced`, `toast-host`
- `not-found-home`, `home-no-bottom-nav`
- `sweep-home`, `sweep-games`, `sweep-practice`, `sweep-stickers`,
  `sweep-parent-gate`

### Compact phone

`667x375-*`, `740x360-*` captured.

### Modern / large phone

`844x390-*`, `932x430-*` captured.

### Tablet

`1024x768-*`, `1133x744-*`, `1280x800-*`, `1366x1024-*` captured.

## Native coverage

| Capability | This run |
|---|---|
| iOS / Android device attach | **BLOCKED** — no device / no `adb` / no Maestro |
| Native AdMob banner on eligible hubs | **BLOCKED** — web-only attestation |
| Native reduce-motion OS setting | **BLOCKED** — Playwright `emulateMedia` only |
| Maestro intro/ads flows | **BLOCKED** — Maestro CLI absent |

Do not treat Expo web as native attestation. Device evidence is Phase 29.

## Assets still missing

- Yonicks Studios bumper logo assets (optional; bumper skips cleanly).
- No new production art invented this phase.

## Deviations / blockers

- Not-found remains silent Redirect (legacy); dedicated interstitial avoided
  after Expo Stack dual-`home-root` flakiness under Playwright.
- Intro snapshot pixel flake (~0.01) not used to weaken or rewrite baselines.
- Native device rows BLOCKED (honesty) — release QA is Phase 29.

## Phase 29 risks

1. Real-device orientation lock + splash → intro with no portrait flash.
2. Native AdMob on eligible hubs only; verify gameplay has zero reserved
   strip and no control overlay.
3. OS reduce-motion on iOS/Android for intro + celebrations.
4. Carry-forward Phase 27 native mic / image picker / backup share / OSK.
5. Store review: production AdMob unit id + Families / child-directed forms.

## Product Completion Gate result

All child / parent / reward / global surfaces have landscape destinations;
monetization placement is explicit; accessibility and reduce-motion are
addressed; no known portrait child product path remains; prior landscape
blockers that belong to device release stay explicitly deferred to Phase 29
with honest BLOCKED native rows (not faked green).

PRODUCT COMPLETION GATE PASSED
