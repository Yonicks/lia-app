# Phase 13 — AdMob and native application configuration

**Prompt:** [../prompts/phase-13.md](../prompts/phase-13.md)
**Creates:** ad service, native config, icons, splash, permission strings
**Ships:** a releasable application shell

---

## Goal and rationale

Turn a working app into a shippable one: ads configured correctly for a
children's product, icons and splash, permissions declared with honest reasons,
and both platforms building in release mode.

The ads work is not a monetisation feature. It is a compliance feature. Talki
serves children under 13, which places it under COPPA in the United States,
GDPR-K in Europe, and Google Play's Families policy. Getting the ad
configuration wrong is not a bug, it is a legal and store-listing problem, and
an app removed from Play for a Families policy violation is a much worse outcome
than one showing fewer ads.

## Entry conditions

- `docs/migration/phase-12-report.md` exists with no critical FAIL.
- Every feature exists.

## Design decisions

### Every child-safety flag ports verbatim

Legacy sets these (index.html 4092-4131) and every one carries over:

```
tagForChildDirectedTreatment: true      COPPA
maxAdContentRating: 'General'           G-rated only
npa: true                               non-personalised
adSize: 'ADAPTIVE_BANNER'
position: 'BOTTOM_CENTER'
margin: 0
```

These are not defaults to be re-derived from the new library's documentation.
They are the existing, deliberate configuration of a shipping children's app.

The legacy code also uses the Google **sample** ad unit
`ca-app-pub-3940256099942544/6300978111`. Real unit ids come from the AdMob
console and are a product decision. Default: keep test ids, wire real ones
through configuration, and flag it in the report. Never hardcode a real unit id.

### Ads never occlude content

Legacy reserves banner height in the layout through the `--ad-h` CSS variable,
updated from the `bannerAdSizeChanged` event (index.html 4114-4118), and falls
back to 50 px.

The native equivalent goes into `useSafeLayout` from Phase 5. `auditReachability`
already proves nothing is covered; with a banner present it must still pass.

An ad covering a game control in a toddler app means accidental taps on the ad.
That is bad for the child, bad for the parent, and bad for the ad account.

### Ads are absent, not broken, when unavailable

No network, ad load failure, or a region where ads do not serve must leave the
app fully usable with the space reclaimed. Legacy already swallows AdMob errors
(index.html 4130).

### Permissions are declared honestly

The app requests microphone, and camera or photo library for custom word
photos. Each needs a clear, child-safety-appropriate usage string in Hebrew and
English, and each must degrade gracefully on denial — already proven in Phases 4
and 12.

### Icons and splash come from the real brand assets

`assets/v2/brand/talki-app-icon.png` and `talki-splash-star.png` exist.
Splash background is `#FFF6E4` and the status bar is DARK on `#FFF8EA`
(capacitor.config.ts, index.html 4137-4138). Note that those two cream values
differ slightly in the legacy app; carry both as-is and record the discrepancy
rather than silently unifying them.

Android needs an adaptive icon with foreground and background layers.

### Distinct app identifiers, still

`com.yonicks.talki.dev` for development, `com.yonicks.talki` for production, so
the migration build coexists with the shipping app during Phase 14 parity
testing.

## Legacy source mapping

| What | Legacy location |
|---|---|
| `ADMOB` unit ids | index.html 4095-4097 |
| `nativeAdMob()` platform guard | index.html 4098-4103 |
| `startAds()` with all safety flags | index.html 4105-4131 |
| `bannerAdSizeChanged` and `--ad-h` | index.html 4113-4118 |
| 50 px fallback height | index.html 4127-4129 |
| Error swallowing | index.html 4130 |
| `polishNativeShell()` status bar and splash | index.html 4132-4143 |
| Wake lock | index.html 4085-4087 |
| App id, splash duration and colour | capacitor.config.ts |
| PWA icons and theme | manifest.json |
| Privacy policy URL | index.html 3288 |

## Files to be created

```
apps/mobile/src/services/ads/
├── AdService.ts             the interface
├── admobAds.ts              react-native-google-mobile-ads
├── noopAds.ts               web and unavailable
└── adConfig.ts              unit ids by environment

apps/mobile/src/components/shell/
└── AdBanner.tsx             reserves height, never occludes

apps/mobile/assets/
├── icon.png                 from talki-app-icon.png
├── adaptive-icon-fg.png
├── adaptive-icon-bg.png
└── splash.png               from talki-splash-star.png

app.config.ts                permissions, icons, splash, orientation, ids
eas.json                     build profiles

apps/mobile/tests/unit/ad-layout.test.ts
apps/mobile/tests/e2e/ad-layout.spec.ts
apps/mobile/.maestro/ads.yaml
docs/migration/phase-13-compliance.md
```

## Behaviour to preserve exactly

- `tagForChildDirectedTreatment: true`
- `maxAdContentRating: 'General'`
- `npa: true`
- Adaptive banner, bottom centre, margin 0
- Banner height reserved in layout; 50 px fallback
- Ad failure never breaks the app
- No ads on the web target
- Status bar DARK
- Splash `#FFF6E4`
- Wake lock while in use
- App id `com.yonicks.talki` for production

## Test plan

### Tier 1

`ad-layout.test.ts`
- reserved height is 0 when no ad is present
- reserved height equals the reported banner height when present
- the fallback is 50 when the height is unknown
- safe area, tab bar and ad height compose without double counting
- `noopAds` is selected on web

### Tier 2

`ad-layout.spec.ts` at all ten viewports, with a simulated banner
- content is not occluded by the reserved area
- `auditReachability` passes with a banner present
- removing the banner reclaims the space
- no ad element renders on web
- `toHaveScreenshot()` with and without the reserved area

### Tier 3 — the real substance

Ads cannot be verified on web at all.

Manual attestation, device named:
- the test banner loads on Android and on iOS
- it sits at the bottom centre and covers no control
- rotating keeps the layout correct
- with no network, the app works and the space is reclaimed
- an ad load failure does not break the app
- the child-directed and G-rating flags are confirmed in the AdMob request,
  evidenced by a log line
- the release build installs and runs on both platforms
- icons render correctly, including the Android adaptive icon
- the splash shows the correct colour with no flash
- permission prompts show the correct usage strings
- the wake lock keeps the screen on during use

### Compliance document

`docs/migration/phase-13-compliance.md` records:
- every ad configuration flag and where it is set
- COPPA, GDPR-K and Play Families considerations
- every permission requested and its justification
- the privacy policy URL
- data collected and stored, and whether anything leaves the device
- the Play Data Safety declaration this implies

This exists because store review will ask, and reconstructing the answers later
from code is slow and error-prone.

## Screenshot manifest

```
docs/migration/screenshots/phase-13/
    <viewport>-with-ad-space.png
    <viewport>-without-ad-space.png
    android-device-banner.png
    android-device-banner-landscape.png
    android-device-icon.png
    android-device-splash.png
    ios-device-banner.png              if an iOS device is available
```

Two states times ten viewports is 20 files, plus device captures.

## Risks and open questions

**Real ad unit ids.** Default: keep Google test ids, wire real ones through
environment configuration, and flag prominently that they must be set before
release. Never hardcode a real unit id in the repository.

**AdMob SDK and Families policy.** Default: verify the library version is
current and that the child-directed flags are actually applied at the request
level, not just passed to an initialiser. Evidence goes in the report.

**iOS App Tracking Transparency.** With `npa: true` and child-directed
tagging, ATT should not be required. Default: verify and record. Do not add an
ATT prompt to a children's app without a specific reason.

**Two different cream values.** `#FFF6E4` for splash, `#FFF8EA` for the status
bar. Default: carry both exactly as legacy has them and record the
discrepancy. Do not unify them silently.

**Ads in landscape games.** Default: reserve the height in landscape too, and
verify the game board still fits at the smallest landscape viewport.

## Exit criteria

- [ ] All child-safety flags set exactly as legacy
- [ ] Test ad unit ids in use, real ids wired through configuration and flagged
- [ ] Adaptive banner, bottom centre, margin 0
- [ ] Banner height reserved; 50 px fallback
- [ ] Content never occluded, with `auditReachability` passing with a banner
- [ ] Ad failure or no network leaves the app fully usable
- [ ] No ads on the web target
- [ ] Icons configured including the Android adaptive icon
- [ ] Splash `#FFF6E4`, status bar DARK, both discrepant creams recorded
- [ ] Every permission has a clear Hebrew and English usage string
- [ ] Denial handled gracefully for every permission
- [ ] Wake lock works
- [ ] Android release build succeeds
- [ ] iOS release build succeeds, or its blocker is recorded
- [ ] Both app identifiers configured and coexisting
- [ ] `docs/migration/phase-13-compliance.md` written
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 20 screenshots plus device captures committed
- [ ] Banner behaviour attested on a real device on both platforms
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-13-report.md` written
