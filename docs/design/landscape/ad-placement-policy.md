# Landscape ad placement policy

Durable, route-aware banner policy for the Talki Expo app.

Companion implementation:

- `apps/mobile/src/services/ads/adPlacement.ts` — eligibility API
- `apps/mobile/src/components/shell/AdBanner.tsx` (+ `.web.tsx`) — render
- `apps/mobile/app/_layout.tsx` — mounts banner only when eligible

Child-safety / unit-id / COPPA flags remain in
`docs/migration/phase-13-compliance.md` and `adConfig.ts`. This document
owns **where** a banner may appear in landscape — not what inventory is
requested.

## Format

Only the existing adaptive banner is supported. No interstitial, rewarded,
or app-open formats are enabled in this product phase.

| Setting | Value |
|---|---|
| Format | Anchored adaptive banner |
| Position when shown | Bottom center, below the Stack (not overlaid on play controls) |
| App-open / interstitial | **Disabled** (not implemented) |
| Test vs production unit ids | `bannerUnitId()` — sample unless `EXPO_PUBLIC_ADMOB_BANNER_ID` |

## Eligible routes (banner may reserve bottom strip)

Exact pathnames only (no prefix match for hubs):

| Path | Surface |
|---|---|
| `/` | Home hub |
| `/games` | Games menu hub |
| `/practice` | Practice menu hub |
| `/rewards` | Stickers / rewards |
| `/parent` | Parent gate + center |

On these routes the root layout may mount `AdBanner` beneath a `flex:1`
Stack. The banner **never** paints on top of hub controls; it consumes a
dedicated bottom strip. Failure to load reclaims the strip (`reserved = 0`).

## Ineligible routes (banner must not mount)

| Path pattern | Reason |
|---|---|
| Opening stages (`bumper` / `intro` before app) | Opening sequence — no ads |
| `/intro` | Isolated intro route |
| `/game/*` | Active gameplay — no overlay, no play-area shrink |
| `/practice/<id>` | Active practice detail |
| `/category/*` | Category play / word grid |
| `/cards/*` | Flashcards detail |
| `/dev/*` | Developer surfaces |
| Any other path | No compliant landscape placement |

When ineligible, reserved ad height is forced to `0` and `AdBanner` is not
mounted. Hub chrome is therefore **not** uniformly shrunk by an always-on
banner across the whole app.

## Layout stability

1. Eligible + loading (native): reserve `AD_FALLBACK_PX` (50) until a real
   height is reported.
2. Eligible + load failure: reserved height → `0` (strip collapses once).
3. Eligible → ineligible navigation: unmount banner, reserved → `0`.
4. Web: no AdMob element; reserved height is only for E2E simulation via
   `__talkiAdReservedPx` / `__talkiSetAdReserved`.

Landscape world shells pad OS safe-area bottom only. They do **not** add
`adReserved` again — the root column already shrinks the Stack when the
banner strip is present (avoids double-counting).

## Non-negotiables

- Ads must never overlay active child controls or game objects.
- The landscape shell must not be globally shrunk for an always-on banner.
- No new ad format in landscape polish phases.
- If a future commercial requirement demands banners on gameplay, that is
  a product decision requiring a new policy revision — do not “fix it”
  by overlaying the play area.

## Intro / app-open advertising

Not enabled. The Yonicks/Talki opening sequence completes before the app
stage mounts; no ad request runs during bumper/intro.
