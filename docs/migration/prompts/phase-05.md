# Phase 5 prompt — Talki native design system and app shell

Plan: [../phases/phase-05-plan.md](../phases/phase-05-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 5 of the Talki migration to Expo React Native.

Phase 5 builds the visual foundation once, so that eleven game screens and six
practice screens do not each invent their own spacing, colour and typography.
It ships a developer-only component gallery and no product screen.

Execute ONLY Phase 5.

The most important thing to understand: you are porting DESIGN TOKENS, not CSS.
The legacy app has roughly 1200 lines of stylesheet. The :root block holds the
real design decisions and transcribes directly. Everything else is answers to
browser layout problems that React Native does not have. Translating it produces
code that works badly in both worlds and is harder to review than fresh code,
because every line looks intentional.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename or refactor index.html, audio-manager.js, assets/,
  tests/, android/, ios/, capacitor.config.ts or manifest.json.
- Do not edit legacy source to make a new test pass.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Do not make a decision for the browser's benefit.

FORBIDDEN
- No line-by-line translation of CSS into StyleSheet objects.
- No NativeWind.
- No DOM terminology, no HTML, no .css files, no WebView.
- No left/right in any layout. Logical start/end only.
- No component reading Dimensions directly.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not build Home, categories, games or practice screens.
- If you finish early, deepen the gallery coverage. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-05-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-05-plan.md   — your plan, read it fully
2. docs/migration/validation.md             — section 3
3. docs/migration/phase-04-report.md        — confirm the go/no-go said proceed
4. index.html lines 26-130                  — the :root block and topbar
5. index.html lines 184-205                 — per-view backgrounds
6. index.html lines 1347-1350               — bottom navigation
7. docs/design/talki-home-approved.png      — the approved visual target
8. docs/design/talki-home-hero-mockup.png   — the newer hero mock
9. docs/talki-home-redesign-plan.md         — context, but the CODE wins
10. assets/v2/                              — the real Talki art

GROUND TRUTH — the token block, verbatim from index.html 29-65.
Transcribe EVERY value exactly. Do not adjust, round, rename or "improve" any
of them. A test will verify each hex.

V2 and legacy palette
  cream #FFF8EA        paper #FFFFFF        ink #3A2A52       inkSoft #7B6E8C
  berry #FF8FA8        berryDark #E85E85    sun #FFD75A       sunDark #E8B93A
  leaf #8FD3C1         leafDark #4FA893     sky #6FA3DE       skyDark #3D78B5
  grape #7C4CD6        grapeDark #6D3BA6    clay #FFCDA1      clayDark #F0A868
  teal #6FC2B4         tealDark #3D8F82     wood #8B5FC9      woodDark #6D3BA6
  line #F1E4CE
  v2Purple #6D3BA6     v2PurpleBright #7C4CD6                 v2Mint #8FD3C1
  v2Peach #FFCDA1      v2Gold #FFD75A       v2Pink #FFD9E6    v2PinkDark #F2A8C4
  radiusCard 18        radiusBtn 16         radiusHero 24

Talki V3 palette
  purple900 #44206F    purple800 #542780    purple700 #6D3BA6
  purple600 #7C4CD6    purple500 #9366E5    purple200 #DED0FA
  purple100 #EEE6FF    purple050 #F7F2FF
  mint500 #8FD3C1      mint200 #CFEDE5      mint100 #EAF8F4
  pink500 #F46B91      pink300 #FFA8C2      pink200 #FFD9E6   pink100 #FFF0F5
  peach500 #FFB977     peach300 #FFCDA1     peach100 #FFF1E2
  gold500 #FFD75A      gold300 #FFE796      gold100 #FFF8DC
  blue500 #69B7EF      blue200 #CFEAFB      blue100 #EEF8FF
  green500 #79CFAE     green100 #EAF8F1
  bg #FFF9EF           surface #FFFFFF      surfaceSoft #FFFCF8
  textPrimary #241735  textHeading #4E2A72
  textSecondary #746887                     textMuted #9B91A7
  borderSoft #F1E7D7   track #F3EEE6

Shadows (CSS source; produce native equivalents of matching perceived weight)
  shadow         0 10px 24px rgba(109,59,166,.12), 0 2px 6px rgba(58,42,82,.06)
  shadowSm       0 2px 6px rgba(65,39,26,.06)
  shadowCard     0 6px 16px rgba(73,46,25,.09)
  shadowFloating 0 10px 28px rgba(73,46,25,.13)
  shadowTopbar   0 6px 18px -6px rgba(109,59,96,.10), 0 2px 8px -2px rgba(160,120,90,.08)

Spacing
  homePaddingInline  16, 18 at >=430, 24 at >=768
  homeSectionGap     28
  homeGridGap        12, 14 at >=430

Runtime-measured in legacy
  barh 68            top bar height
  adH 0              ad banner height, set by AdMob
  tbSideClear 104    106 at <=430

Fonts (index.html 26, 78, 85)
  body      Assistant   weights 400 600 700 800
  headings  Rubik       weights 500 700 800 900

BOTH palettes are live today: V3 drives the redesigned Home, V2 still drives
game screens. Port BOTH. Do not collapse them. Consolidation is a design
decision, not a migration decision, and doing it here means re-deciding every
game screen's colour while also porting its logic.

WORK ITEMS

1. Build apps/mobile/src/design-system/theme/ with colors, spacing, radii,
   shadows and typography, transcribed exactly from the block above.

2. Bundle the fonts. Legacy fetches Rubik and Assistant from the Google Fonts
   CDN (index.html line 26). A native app must not depend on a network fetch
   for its typeface: Talki works offline, and a late-arriving font causes a
   visible reflow on every cold start.

   Bundle Assistant 400/600/700/800 and Rubik 500/700/800/900 via expo-font
   into apps/mobile/assets/fonts/. Write a test proving the REAL font is
   applied rather than a system fallback — a silent fallback to a system Hebrew
   face is easy to miss and changes every metric on screen.

   Both faces are SIL Open Font License. Confirm and note it in the report.

3. Build the responsive module. ONE place answers "what size is this device and
   which way is it facing":
     type DeviceClass = 'phone' | 'largePhone' | 'smallTablet' | 'largeTablet';
     type Orientation = 'portrait' | 'landscape';
   Components ask the hook. No component reads Dimensions directly.
   Breakpoints are 430 and 768, from index.html 67-68.

   Also provide useSafeLayout composing safe-area insets, top bar height and ad
   height without double counting. Legacy does this with runtime-measured
   --barh and --ad-h CSS variables (index.html 83).

4. Build the RTL helpers. Talki is Hebrew and right-to-left. EVERY layout uses
   logical start/end, never left/right. Every direction-implying icon mirrors.

   This is absolute because RTL bugs are invisible to a developer reading
   English code: marginLeft: 8 looks completely normal and is wrong on every
   screen. Add a lint rule forbidding left/right layout props if one is
   available.

5. Build the nine primitives:
     TalkiScreen  TalkiText  TalkiHeading  TalkiButton  TalkiCard
     TalkiIconButton  TalkiProgress  TalkiPill  TalkiImageCard
   And the six shell components:
     TopBar  BottomNavigation  GameHeader  ParentGate  ToastHost  RewardOverlay
   ParentGate is SHELL ONLY in this phase. Its logic is Phase 12.

   Every child-facing control must measure at least 48x48.
   Use real Talki art from assets/v2/. No emoji placeholders.

6. Handle the category colour mapping. Phase 2 carried a `cls` field on each
   category (c-animals, c-food, ...) because it is the existing key from
   category identity to colour. Build an explicit categoryTheme map keyed by
   CategoryId, seeded from what those classes resolve to in the legacy
   stylesheet. Do NOT parse CSS at runtime.

7. Build app/dev/gallery.tsx rendering every primitive in every documented
   state, grouped as: typography, buttons, cards, progress, shell, colors.
   It exists so toHaveScreenshot has something to baseline and so a reviewer
   can see the whole system at ten sizes. Not reachable from child navigation.

8. Add testIds for every gallery group and every primitive state to
   src/testing/testIds.ts.

9. Tier 1 tests:
   theme.test.ts       — every colour token present with the exact hex; both
                         palettes exist; radii and spacing match; no token
                         undefined; a snapshot of the whole theme object so any
                         accidental change shows up in review
   responsive.test.ts  — each of the ten viewport sizes maps to the expected
                         DeviceClass and Orientation; the 430 and 768
                         boundaries classify correctly on BOTH sides;
                         useSafeLayout does not double count

10. Tier 2: apps/mobile/tests/e2e/gallery.spec.ts at all ten viewports
      - every primitive renders in every documented state
      - toHaveScreenshot() baselines each of the six groups per viewport
      - auditTouchTargets returns no violations
      - auditReachability returns no violations
      - Hebrew sample text lays out right to left: assert a known first
        character appears at the visual start
      - the resolved font family is Assistant or Rubik, not a system fallback
      - captureMatrix(page, '05', 'gallery-<group>') for all six groups

11. Tier 3 (light): on one Android device confirm fonts render, Hebrew is
    right to left, and safe areas are respected on a notched screen. Capture
    android-device-gallery.png. Name the device and OS version.

12. Run the gate:
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
- Do not build Home. It is tempting to assemble a Home preview to see the
  system in context. That is Phase 7, and building it here means building it
  twice.
- Do not translate the legacy stylesheet. Port tokens; write layout fresh.
- Do not collapse the two palettes.
- Do not adjust a single colour value, even one that looks wrong.
- Do not use emoji where a real Talki asset exists.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] Every colour token transcribed with the exact hex, verified by test
- [ ] Both V2 and V3 palettes present
- [ ] Radii 18 / 16 / 24 preserved
- [ ] Breakpoints 430 and 768 preserved, boundaries tested on both sides
- [ ] Assistant and Rubik bundled locally, not CDN-loaded
- [ ] A test proves the real font is applied, not a system fallback
- [ ] Font licensing confirmed and noted
- [ ] Responsive module centralised; no component reads Dimensions directly
- [ ] All layout uses logical start/end; no left/right anywhere
- [ ] All nine primitives and six shell components exist
- [ ] Every child-facing control measures at least 48x48
- [ ] categoryTheme map exists, keyed by CategoryId, no runtime CSS parsing
- [ ] Gallery renders every primitive in every state at all ten viewports
- [ ] toHaveScreenshot baselines established for all six groups
- [ ] Touch-target and reachability audits clean
- [ ] Hebrew RTL verified by assertion, not just by eye
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 60 gallery screenshots plus one device capture committed
- [ ] No Home, category or game screen was built
- [ ] No legacy CSS translated line by line
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-05-report.md using the headings in
docs/migration/validation.md section 7. Include the native shadow values you
chose for each of the four shadow steps and why. Name the Android device and OS
version in the native-coverage section.

Then stop. Do not begin Phase 6.
````
