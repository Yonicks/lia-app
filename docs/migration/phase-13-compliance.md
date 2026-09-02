# Phase 13 compliance — ads, data, and permissions

Talki is a children's product (under 13). This document is what store review
will ask for. Real AdMob unit ids must be set before a store release; they
are **not** in this repository.

**Where real ids go:** `EXPO_PUBLIC_ADMOB_BANNER_ID` at build time
(`apps/mobile/src/services/ads/adConfig.ts` `bannerUnitId()`). Until that
env var is set, the Google **sample** unit
`ca-app-pub-3940256099942544/6300978111` is used.

## Ad configuration flags

Ported verbatim from `index.html` 4105–4124. Set in
`apps/mobile/src/services/ads/adConfig.ts` as `CHILD_SAFETY_FLAGS`.
`admobAds.start()` logs them on the request line
`Talki AdMob request {…}` — that log is the evidence the flags are on the
request, not only an initialiser.

| Flag | Value | Why |
|---|---|---|
| `tagForChildDirectedTreatment` | `true` | COPPA child-directed treatment |
| `maxAdContentRating` | `'General'` | G-rated inventory only |
| `npa` | `true` | Non-personalised ads |
| `adSize` | `'ADAPTIVE_BANNER'` | Adaptive banner |
| `position` | `'BOTTOM_CENTER'` | Bottom centre |
| `margin` | `0` | Flush to the bottom edge |

Do not relax any of these because a library README suggests a different default.

## COPPA, GDPR-K, Play Families

- The app is directed at children. Ads are child-directed, G-rated, and
  non-personalised.
- No account, no server of our own, no analytics SDK in this phase.
- ATT is **not** added. With `npa: true` and child-directed tagging, an
  App Tracking Transparency prompt is not required and would be
  inappropriate in a children's app without a specific recorded reason.
- Play Families: mixed-audience / designed-for-families listing must
  declare ads as non-personalised and child-directed. This file is the
  source for that form.

## Permissions

| Permission | Platforms | Justification | Denial |
|---|---|---|---|
| Microphone | iOS `NSMicrophoneUsageDescription`; Android `RECORD_AUDIO`; expo-audio / expo-speech-recognition | Parent voice recordings and speech-practice games | Record tab and speech game stay usable (Phase 4 / 11 / 12) |
| Camera | iOS `NSCameraUsageDescription`; Android `CAMERA` | Optional photo for a custom word, parent-only | PhotoPicker returns null; word can use an emoji |
| Photo library | iOS `NSPhotoLibraryUsageDescription` | Optional library pick for a custom word, parent-only | Same as camera denial |

Usage strings are bilingual (English / Hebrew) in `app.config.ts`.

No location, no contacts, no tracking, no ATT.

## Privacy policy

https://yonicks.github.io/talki/privacy.html  
(`index.html` 3288; parent Settings tab.)

## What is stored, and what leaves the device

**On device only**

- Progress (`lia:progress`), stats (`lia:stats`), last category
- Settings including speech rate and audio toggles
- Custom words and their photos (`lia:custom:*`)
- Parent voice recordings (`lia:rec:*`)
- Backup files the parent exports

**Leaves the device**

- Ad requests to Google AdMob, tagged child-directed + NPA + G-rated.
  No Talki account identifier is attached.
- Nothing else. There is no Talki backend.

## Play Data Safety (implied answers)

- Data collected: AdMob may collect device advertising identifiers under
  Google's child-directed / NPA policy. Talki itself does not collect
  name, email, location, or user-generated content onto a server.
- Data encrypted in transit: AdMob's HTTPS. Talki local data does not
  leave the device except a parent-initiated backup file.
- Data sold: no.
- Data shared: AdMob only, for serving the banner, child-directed.
- Users can request deletion: progress reset and uninstall; recordings
  and custom words are local and deleted with the app.
