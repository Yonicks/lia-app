# Phase 13 prompt — AdMob and native application configuration

Plan: [../phases/phase-13-plan.md](../phases/phase-13-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 13 of the Talki migration to Expo React Native.

Phase 13 turns a working app into a shippable one: ads configured correctly for
a children's product, icons and splash, permissions declared with honest
reasons, and both platforms building in release mode.

Execute ONLY Phase 13.

THE ADS WORK IS A COMPLIANCE FEATURE, NOT A MONETISATION FEATURE.
Talki serves children under 13, which places it under COPPA in the United
States, GDPR-K in Europe, and Google Play's Families policy. Getting the ad
configuration wrong is not a bug, it is a legal and store-listing problem. An
app removed from Play for a Families policy violation is a far worse outcome
than one showing fewer ads.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename or refactor index.html, audio-manager.js, assets/,
  tests/, android/, ios/, capacitor.config.ts or manifest.json.
- Do not remove Capacitor. Phase 15 owns that.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Ads cannot be verified on web AT ALL. Do not let a green
  Playwright run stand in for native evidence.

FORBIDDEN
- No hardcoded real ad unit id. Test ids only, real ones through configuration.
- No relaxing of any child-safety flag.
- No ad that can occlude a control.
- No ATT prompt in a children's app without a specific recorded reason.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not do the parity sweep. Phase 14.
- Do not retire Capacitor. Phase 15.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-13-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-13-plan.md   — your plan, read it fully
2. docs/migration/validation.md
3. docs/migration/phase-12-report.md
4. index.html 4085-4143                     — ads, wake lock, status bar, splash
5. capacitor.config.ts                      — app id, splash duration and colour
6. manifest.json                            — PWA icons and theme
7. index.html 3288                          — the privacy policy URL
8. assets/v2/brand/                         — talki-app-icon.png, talki-splash-star.png

GROUND TRUTH — every child-safety flag ports VERBATIM from index.html 4105-4131.
These are not defaults to re-derive from the new library's documentation. They
are the existing, deliberate configuration of a shipping children's app.

    tagForChildDirectedTreatment: true      COPPA
    maxAdContentRating: 'General'           G-rated only
    npa: true                               non-personalised
    adSize:   'ADAPTIVE_BANNER'
    position: 'BOTTOM_CENTER'
    margin:   0

Ad unit id: legacy uses the Google SAMPLE unit
    ca-app-pub-3940256099942544/6300978111
Real unit ids come from the AdMob console and are a product decision. Keep test
ids, wire real ones through configuration, and flag prominently that they must
be set before release. NEVER hardcode a real unit id in the repository.

ADS NEVER OCCLUDE CONTENT. Legacy reserves banner height in the layout through
the --ad-h CSS variable, updated from the bannerAdSizeChanged event
(index.html 4113-4118), with a 50px fallback (4127-4129). The native equivalent
goes into useSafeLayout from Phase 5.

  An ad covering a game control in a toddler app means accidental taps on the
  ad. That is bad for the child, bad for the parent, and bad for the ad account.

ADS ARE ABSENT, NOT BROKEN, WHEN UNAVAILABLE. No network, a load failure, or a
region where ads do not serve must leave the app fully usable with the space
reclaimed. Legacy already swallows AdMob errors (index.html 4130).

NATIVE SHELL (index.html 4132-4143, capacitor.config.ts):
    status bar   DARK, background #FFF8EA
    splash       #FFF6E4, 1400 ms
    wake lock    on while in use (index.html 4085-4087)
    app id       com.yonicks.talki  (production)
                 com.yonicks.talki.dev  (development, so the migration build
                 coexists with the shipping app for Phase 14 parity testing)

  NOTE: the two cream values differ — #FFF6E4 for splash, #FFF8EA for the
  status bar. Carry BOTH exactly as legacy has them and RECORD the
  discrepancy. Do not silently unify them.

WORK ITEMS

1. Build the ad service: AdService interface, admobAds via
   react-native-google-mobile-ads, noopAds for web and unavailable cases, and
   adConfig for unit ids by environment. Every safety flag above, verbatim.

2. Build AdBanner that RESERVES height in layout. Compose it in useSafeLayout
   with safe-area insets and the tab bar, without double counting.
   auditReachability already proves nothing is covered; it must still pass with
   a banner present, INCLUDING in landscape games at the smallest landscape
   viewport.

3. Configure icons and splash from the real brand assets. Android needs an
   adaptive icon with foreground and background layers.

4. Declare permissions honestly: microphone, and camera or photo library for
   custom word photos. Each needs a clear, child-safety-appropriate usage
   string in BOTH Hebrew and English. Denial must degrade gracefully — Phases 4
   and 12 already proved that; confirm it still holds.

5. Configure eas.json build profiles and produce release builds for both
   platforms.

6. Write docs/migration/phase-13-compliance.md recording:
     - every ad configuration flag and where it is set
     - COPPA, GDPR-K and Play Families considerations
     - every permission requested and its justification
     - the privacy policy URL
     - what data is collected and stored, and whether anything leaves the device
     - the Play Data Safety declaration this implies
   Store review WILL ask. Reconstructing these answers from code later is slow
   and error-prone.

7. Tier 1: ad-layout.test.ts
     - reserved height is 0 with no ad
     - reserved height equals the reported banner height when present
     - the fallback is 50 when the height is unknown
     - safe area, tab bar and ad height compose without double counting
     - noopAds is selected on web

8. Tier 2: ad-layout.spec.ts at all ten viewports with a simulated banner
     - content is not occluded by the reserved area
     - auditReachability passes with a banner present
     - removing the banner reclaims the space
     - NO ad element renders on web
     - toHaveScreenshot() with and without the reserved area

9. Tier 3 — THE REAL SUBSTANCE. Manual attestation with devices named:
     - the TEST banner loads on Android and on iOS
     - it sits bottom centre and covers NO control
     - rotating keeps the layout correct
     - with no network the app works and the space is reclaimed
     - an ad load failure does not break the app
     - the child-directed and G-rating flags are confirmed IN THE ACTUAL AD
       REQUEST, evidenced by a log line — not merely passed to an initialiser
     - the release build installs and runs on both platforms
     - icons render correctly including the Android adaptive icon
     - the splash shows the correct colour with no flash
     - permission prompts show the correct usage strings
     - the wake lock keeps the screen on during use

10. Run the gate:
      cd apps/mobile
      npx tsc --noEmit && npx eslint . && npx expo-doctor
      npx vitest run
      npx expo export --platform web
      npx playwright test
    Then from the repository root:
      node tools/dev-server.js &
      BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
      BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
      node --test tests/audio-logic.test.js

DO NOT
- Do not hardcode a real ad unit id.
- Do not relax any child-safety flag, even if the library documentation
  suggests a different default.
- Do not let an ad overlap a control.
- Do not add an ATT prompt without recording a specific reason.
- Do not unify the two cream colour values.
- Do not remove Capacitor.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] tagForChildDirectedTreatment: true
- [ ] maxAdContentRating: 'General'
- [ ] npa: true
- [ ] Adaptive banner, bottom centre, margin 0
- [ ] Flags confirmed in the actual ad request, with log evidence
- [ ] Test ad unit ids in use; real ids wired through config and flagged
- [ ] Banner height reserved in layout with a 50px fallback
- [ ] Content never occluded; auditReachability passes with a banner present
- [ ] Landscape games still fit with the banner reserved
- [ ] Ad failure or no network leaves the app fully usable and reclaims space
- [ ] No ad element on the web target
- [ ] Icons configured including the Android adaptive icon
- [ ] Splash #FFF6E4 and status bar DARK on #FFF8EA; the discrepancy recorded
- [ ] Every permission has a clear Hebrew AND English usage string
- [ ] Permission denial handled gracefully for each
- [ ] Wake lock works on device
- [ ] Android release build succeeds
- [ ] iOS release build succeeds, or its blocker is recorded
- [ ] Both app identifiers configured and able to coexist
- [ ] phase-13-compliance.md written and complete
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 20 screenshots plus device captures committed
- [ ] Banner attested on a real device on both platforms
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-13-report.md using the headings in
docs/migration/validation.md section 7.

State prominently that real ad unit ids must be configured before release, and
exactly where they go.

Then stop. Do not begin Phase 14.
````
