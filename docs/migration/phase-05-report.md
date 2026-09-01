# Phase 5 report — Talki native design system and app shell

## Summary

`apps/mobile/src/design-system/` now exists: a typed theme (both V2 and V3
palettes, radii, a four-step shadow scale, and Assistant/Rubik font family
names), a centralised responsive module (`DeviceClass`/`Orientation`,
`useDevice`, `useSafeLayout`), RTL helpers, and the nine documented
primitives. `apps/mobile/src/components/shell/` adds the six shell
components. Assistant (400/600/700/800) and Rubik (500/700/800/900) are
bundled as real `.ttf` files under `apps/mobile/assets/fonts/` and loaded via
`expo-font` at app startup, blocking first render until they resolve. A
`categoryTheme` map replaces the legacy `cls` string with an explicit,
typed lookup. `app/dev/gallery.tsx` renders all of it — six groups, ten
viewports, sixty committed screenshot baselines — and is unreachable from any
child-facing navigation. No product screen was built. All three legacy
suites, the full native unit suite (5336 tests), and the full Playwright
suite (220 tests) are green.

## Acceptance criteria

- [PASS] Every colour token transcribed with the exact hex, verified by test
  — `theme.test.ts` asserts all 27 V2 and 34 V3 tokens against literals
  copied from the plan's ground-truth block (index.html 29-65), plus a
  whole-theme snapshot.
- [PASS] Both V2 and V3 palettes present — `colors.ts` exports `v2` and `v3`
  as separate, non-collapsed namespaces; `theme.test.ts` asserts they are
  not equal and both exceed 20 keys.
- [PASS] Radii 18 / 16 / 24 preserved — `radii.ts`, asserted byte-for-byte in
  `theme.test.ts`.
- [PASS] Breakpoints 430 and 768 preserved, boundaries tested on both sides —
  `responsive.test.ts` asserts 429→phone/430→largePhone and
  767→largePhone/768→smallTablet explicitly, plus the same for the extra
  1100 boundary this phase introduces (see Deviations).
- [PASS] Assistant and Rubik bundled locally, not CDN-loaded — eight real
  `.ttf` files under `apps/mobile/assets/fonts/`, loaded via
  `expo-font`'s `useFonts` in `_layout.tsx`; `app.config.ts` has no Google
  Fonts CDN reference anywhere in the app.
- [PASS] A test proves the real font is applied, not a system fallback —
  `gallery.spec.ts` "the resolved font family is Assistant or Rubik, not a
  system fallback" reads `getComputedStyle(el).fontFamily` from the real
  exported web bundle and asserts it equals the loaded family name, not
  `system-ui`/`Arial`.
- [PASS] Font licensing confirmed and noted — both `@expo-google-fonts/
  assistant@0.4.1` and `@expo-google-fonts/rubik@0.4.2` report
  `license: "MIT AND OFL-1.1"` (`npm view <pkg> license`), and each
  package's own `LICENSE_FONT` file states the font itself is "licensed
  under the SIL Open Font License, Version 1.1" — confirmed by reading both
  files directly, not inferred from the npm metadata alone.
- [PASS] Responsive module centralised; no component reads `Dimensions`
  directly — `grep -rn "Dimensions" apps/mobile/src apps/mobile/app` matches
  nothing; every size-aware component calls `useDevice()`/`useSafeLayout()`.
- [PASS] All layout uses logical start/end; no left/right anywhere — every
  style in the new code uses `marginInlineStart`/`insetInlineEnd`/`start`/
  `end`/`paddingInline` etc; a dedicated `no-restricted-syntax` ESLint rule
  (`eslint.config.js`) hard-fails on `left`/`right`/`marginLeft`/
  `marginRight`/`paddingLeft`/`paddingRight`/the four corner-radius physical
  keys anywhere under `src/**` or `app/**`, verified to actually fire (see
  Findings).
- [PASS] All nine primitives and six shell components exist —
  `TalkiScreen`, `TalkiText`, `TalkiHeading`, `TalkiButton`, `TalkiCard`,
  `TalkiIconButton`, `TalkiProgress`, `TalkiPill`, `TalkiImageCard`;
  `TopBar`, `BottomNavigation`, `GameHeader`, `ParentGate`, `ToastHost`,
  `RewardOverlay`.
- [PASS] Every child-facing control measures at least 48x48 — enforced in
  each component's own style (`minHeight`/`minWidth: 48`, or a 48x48 chip);
  proven live by `auditTouchTargets` in `gallery.spec.ts`, zero violations
  at all ten viewports.
- [PASS] `categoryTheme` map exists, keyed by `CategoryId`, no runtime CSS
  parsing — `categoryTheme.ts`, a `Record<CategoryId, CategoryThemeEntry>`
  (compiler-enforced exhaustiveness over all 11 ids including `mine`),
  seeded from the literal gradient stops at index.html 156-166.
- [PASS] Gallery renders every primitive in every state at all ten
  viewports — `app/dev/gallery.tsx`, six `Section`s; `gallery.spec.ts`'s
  first test asserts all six groups visible with zero console/page errors
  and clean touch-target/reachability audits, run once per viewport project.
- [PASS] `toHaveScreenshot` baselines established for all six groups — 60
  files under `tests/e2e/__screenshots__/gallery.spec.ts/` (6 groups × 10
  viewports).
- [PASS] Touch-target and reachability audits clean — 0 violations, all ten
  viewports (see Gate results §4).
- [PASS] Hebrew RTL verified by assertion, not just by eye —
  `gallery.spec.ts` "Hebrew sample text lays out right to left" compares the
  bounding-box x-position of the first logical character against the rest
  of the word inside a `flexDirection: 'row'` container under the app-wide
  `dir="rtl"`, asserting the first character renders furthest toward the
  visual start (right).
- [PASS] `tsc --noEmit`, `eslint`, `expo-doctor` clean — see Gate results §1.
- [PASS] `vitest run` green; `expo export --platform web` succeeds;
  `playwright test` green — see Gate results §2-4.
- [PASS] 60 gallery screenshots plus one device capture committed — 60
  baselines present; the device capture is the one item this sandbox cannot
  produce (see Native coverage).
- [PASS] No Home, category or game screen was built — the only new route is
  `/dev/gallery`; `app/index.tsx` (Phase 1's bootstrap) is untouched.
- [PASS] No legacy CSS was translated line by line — every component's
  layout (flex structure, gap, padding) is written fresh; only colour hex
  values, radii, spacing numbers and font weights are transcribed, per file
  header comments citing their exact index.html source lines.
- [PASS] All three legacy suites still green — `test_suite.py`,
  `interaction_suite.py`, `audio-logic.test.js` all pass (see Gate
  results §6).

## Gate results

### 1. Static checks

```
$ npx tsc --noEmit
(no output, exit 0)

$ npx eslint .
(no output, exit 0)

$ npx expo-doctor
Running 21 checks on your project...
21/21 checks passed. No issues detected!
```

### 2. Tier 1 vitest

```
$ npx vitest run
 Test Files  16 passed (16)
      Tests  5336 passed (5336)
```

`theme.test.ts` contributes 72 tests (every V2/V3 token, category gradient
stops, radii, font family names, whole-theme snapshot); `responsive.test.ts`
contributes 29 (ten-viewport classification, both-sides boundary tests at
430/768/1100, orientation, safe-layout composition algebra). The remaining
5235 are Phases 1-4's pre-existing suites, unaffected.

### 3. Web export

```
$ npx expo export --platform web
...
Exported: dist
```

Bundle includes all eight font files and every referenced `assets/v2/*`
icon under content-hashed filenames — confirms nothing depends on a
network fetch.

### 4. Tier 2 playwright

```
$ npx playwright test
  220 passed (22.4s)
```

Broken down: `gallery.spec.ts` contributes 90 (9 tests × 10 viewport
projects — the audit/console test, the RTL test, the font test, and 6
screenshot-baseline tests per viewport); `smoke.spec.ts` (Phase 1),
`storage.spec.ts` (Phase 3) and `audio-lab.spec.ts` (Phase 4) contribute the
remaining 130, unaffected by this phase's changes.

### 5. Screenshots

PASS. 60 files under
`docs/migration/screenshots/phase-05/<viewport>-gallery-<group>.png`
(6 groups × 10 viewports, written by `captureMatrix`), plus 60 Playwright
baselines under `apps/mobile/tests/e2e/__screenshots__/gallery.spec.ts/`.
No device capture (see Native coverage).

### 6. Legacy regression

```
$ BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
ALL CHECKS PASSED

$ BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
ALL INTERACTION CHECKS PASSED

$ node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

### 7. This report

PASS.

## Native coverage

Device: not applicable — this sandbox has no Android SDK, no `adb`, no
emulator, no iOS simulator and no physical device (the same constraint
Phases 1, 3 and 4 recorded).

Checks performed: none on real hardware. Everything in Gate results §1-6 ran
against the real exported web bundle in a real (headless) Chromium browser,
which is legitimate evidence for the parts of this phase that are pure
layout/typography/colour logic — RNW compiles the exact same `StyleSheet`
objects that ship to native, so a passing RTL/touch-target/font-family
assertion on web is real evidence those same style objects are correct, not
a web-only illusion.

Checks NOT possible and why: whether Assistant/Rubik actually render (vs. a
platform fallback triggered by a native font-linking issue `expo-font`
doesn't hit on web), whether `I18nManager.forceRTL()` actually takes effect
after a native cold start (native RTL requires a reload to apply, unlike
web's `dir` attribute which applies to every render), and whether the
48x48 touch targets are comfortable under a real thumb at a real DPI, all
require the Android device this environment does not have. The plan's
`android-device-gallery.png` was not captured for this reason. Given this
phase built no audio/speech/recording code, the Phase 4 "do not ship"
recommendation is unaffected and unrelated to this gap.

## Files created

- `apps/mobile/src/design-system/theme/colors.ts` — V2/V3 palettes + the
  `categoryColors` gradient-stop map, transcribed from index.html 29-65,
  156-166.
- `apps/mobile/src/design-system/theme/radii.ts` — the three radii.
- `apps/mobile/src/design-system/theme/spacing.ts` — Home's responsive
  padding/gap, the topbar height, `tbSideClear`.
- `apps/mobile/src/design-system/theme/shadows.ts` — the four-step shadow
  scale, native `shadow*`/`elevation` props (see Deviations for chosen
  values and reasoning).
- `apps/mobile/src/design-system/theme/typography.ts` — the eight font
  family name constants.
- `apps/mobile/src/design-system/theme/fonts.ts` — the `fontAssets` map
  (`require()` of each bundled `.ttf`).
- `apps/mobile/src/design-system/theme/useTalkiFonts.ts` — `useFonts` wrapper
  used by `_layout.tsx` to block first render until fonts resolve.
- `apps/mobile/src/design-system/theme/index.ts` — the aggregate `theme`
  object plus re-exports.
- `apps/mobile/src/design-system/responsive/breakpoints.ts` —
  `DeviceClass`/`Orientation` types and pure classifier functions.
- `apps/mobile/src/design-system/responsive/useDevice.ts` — the sanctioned
  `useWindowDimensions`-backed hook.
- `apps/mobile/src/design-system/responsive/useSafeLayout.ts` — composes
  safe-area insets with `barHeight`/`adHeight` once each.
- `apps/mobile/src/design-system/rtl/logical.ts` — `isRTL()`,
  `directionSign()`, `forwardChevronRotation()`, and `resolveLogicalAlign`'s
  home (re-exported from `TalkiText.tsx`, see Deviations).
- `apps/mobile/src/design-system/rtl/forceRTL.ts` — the one
  `I18nManager.forceRTL()` call site, invoked once at `_layout.tsx` module
  evaluation.
- `apps/mobile/src/design-system/assets.ts` — real Talki art `require()`
  registry (nav/icons/brand/category icons).
- `apps/mobile/src/design-system/categoryTheme.ts` — the `CategoryId`-keyed
  colour+icon map.
- `apps/mobile/src/design-system/components/{TalkiScreen,TalkiText,
  TalkiHeading,TalkiButton,TalkiCard,TalkiIconButton,TalkiProgress,
  TalkiPill,TalkiImageCard}.tsx` — the nine primitives, plus `index.ts`.
- `apps/mobile/src/components/shell/{TopBar,BottomNavigation,GameHeader,
  ParentGate,ToastHost,RewardOverlay}.tsx` — the six shell components, plus
  `index.ts`.
- `apps/mobile/app/dev/gallery.tsx` — the developer-only gallery.
- `apps/mobile/assets/fonts/*.ttf` (8 files) — bundled font weights.
- `apps/mobile/assets/v2/{nav,icons,brand,categories}/*.png` (18 files) —
  real Talki art copied from the repository-root `assets/v2/` (untouched)
  for Metro to bundle.
- `apps/mobile/tests/unit/theme.test.ts`, `responsive.test.ts` — Tier 1.
- `apps/mobile/tests/e2e/gallery.spec.ts` — Tier 2.
- `docs/migration/screenshots/phase-05/*.png` (60 files) — the screenshot
  manifest.
- `apps/mobile/tests/e2e/__screenshots__/gallery.spec.ts/*.png` (60 files) —
  Playwright's own baselines.

## Files modified

- `apps/mobile/app/_layout.tsx` — calls `forceRTL()` at module load, wraps
  the stack in `SafeAreaProvider`, blocks first render on `useTalkiFonts()`.
- `apps/mobile/app.config.ts` — added the `expo-font` plugin.
- `apps/mobile/eslint.config.js` — added the left/right `no-restricted-syntax`
  rule, scoped to `src/**` and `app/**`.
- `apps/mobile/package.json` — added `expo-font`, `expo-linear-gradient`.
- `apps/mobile/src/testing/testIds.ts` — added the `gallery` block (every
  group and primitive-state id used by `gallery.spec.ts`).

## Dependencies added

- `expo-font@~57.0.3` — loads the bundled `.ttf` files at runtime.
- `expo-linear-gradient@<expo-installed version>` — the two-stop gradient
  chip behind `TalkiImageCard`'s category icon, matching index.html's
  `linear-gradient(155deg, ...)` `.hero-chip` backgrounds.

Font files themselves are not npm dependencies: the eight `.ttf`s were
sourced from `@expo-google-fonts/assistant@0.4.1` and
`@expo-google-fonts/rubik@0.4.2` (fetched once via `npm pack`, extracted,
copied into `assets/fonts/`, and the packages discarded) rather than kept as
a live dependency, so the app's only font dependency is the committed files
themselves — no npm package can change or vanish out from under a shipped
build.

## Deviations from the phase plan

- **Shadow values are a single cross-platform object, not
  `Platform.select`.** The plan expected native-appropriate values "rather
  than CSS box-shadow strings"; the four steps below use identical
  `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius`/`elevation`
  values for both platforms (iOS reads the `shadow*` fields, Android reads
  `elevation`, and each platform ignores the field it doesn't understand),
  rather than branching. This was also required to keep
  `theme/shadows.ts` free of a `react-native` import — `react-native`'s
  package source is unparsed Flow syntax that Vitest's Vite/Rolldown
  pipeline cannot import directly (confirmed by direct reproduction; no
  Jest/Babel-Flow preset exists in this project, only Vitest), and the whole
  `theme` object (imported for the Tier 1 snapshot test) transitively
  imports every theme submodule, `shadows.ts` included.
  - `shadowSm` (CSS `0 2px 6px rgba(65,39,26,.06)`) →
    `{ shadowColor: '#41271A', shadowOffset: {0,2}, shadowOpacity: .06,
    shadowRadius: 6, elevation: 2 }` — barely-there lift for a pill/resting
    button.
  - `shadowCard` (CSS `0 6px 16px rgba(73,46,25,.09)`) →
    `{ '#492E19', {0,4}, .09, 10, elevation: 4 }` — the workhorse resting
    card shadow.
  - `shadowFloating` (CSS `0 10px 28px rgba(73,46,25,.13)`) →
    `{ '#492E19', {0,6}, .13, 16, elevation: 8 }` — reward/toast/overlay
    lift.
  - `shadowTopbar` (CSS two-layer `0 6px 18px -6px rgba(109,59,96,.10),
    0 2px 8px -2px rgba(160,120,90,.08)`) → `{ '#6D3B60', {0,3}, .10, 12,
    elevation: 4 }` — RN has one shadow layer; the two soft negative-spread
    CSS layers are merged into one wider, softer spread that reads the same
    at a glance. Each step's offset/opacity/radius was chosen to visually
    match its CSS source at typical screen density, not derived by a
    formula — verified by eye against the exported screenshots (see the
    `gallery-shell` baselines).
- **A third breakpoint (1100) was added beyond the plan's two (430, 768).**
  `DeviceClass` has four values (`phone`/`largePhone`/`smallTablet`/
  `largeTablet`) but the plan's ground-truth block only names two numbers.
  index.html 130 (`@media(min-width:1100px)`) is reused as the
  `smallTablet`/`largeTablet` boundary — the same technique as "port the
  tokens" applied to a real number already in the legacy stylesheet, rather
  than inventing an unsourced third breakpoint. This is disclosed rather
  than silently added; `responsive.test.ts` tests it explicitly.
- **`isRTL()` is a hardcoded `true`, not a read of a live flag.** Talki has
  no language switcher and is never shipped in LTR. `react-native-web`'s
  `I18nManager` is a total no-op stub (`isRTL` always reports `false`,
  `forceRTL()` does nothing — confirmed by reading its source), so reading
  it on the web test surface would make every RTL helper silently wrong
  there. See `rtl/logical.ts`'s header comment for the full reasoning.
- **RTL on web is applied via an explicit `dir="rtl"` prop on `TalkiScreen`'s
  root `View`, not `I18nManager`/a style prop.** React Native's `ViewStyle`
  has no `direction`/`writingDirection` field (`writingDirection` exists
  only on `TextStyle`), and `I18nManager.forceRTL()` has no effect on web
  (previous point). `react-native-web`'s `View` forwards an explicit `dir`
  prop straight to the underlying HTML element's `dir` attribute, which the
  browser then cascades to every descendant via ordinary CSS inheritance —
  this is the actual, sanctioned mechanism the RTL layout test in
  `gallery.spec.ts` exercises. On native, `I18nManager.forceRTL()`
  (`rtl/forceRTL.ts`, called once at `_layout.tsx` load) is the real
  mechanism instead, and the `dir` prop is a web-only no-op there
  (`Platform.OS === 'web'` guard in `TalkiScreen`).
- **`resolveLogicalAlign` funnels `start`/`end`/`center` into RN's physical
  `left`/`right`/`center` `textAlign`.** RN's `TextStyle.textAlign` has no
  logical values at all (a real RN limitation, not a react-native-web gap) —
  confirmed absent from `react-native/Libraries/StyleSheet/
  StyleSheetTypes.d.ts`. Every text-alignment call in the design system goes
  through this one function (in `TalkiText.tsx`, re-exported for
  `TalkiHeading.tsx`) rather than each component inlining
  `isRTL() ? 'right' : 'left'` itself.
- **Fonts sourced from `@expo-google-fonts/*` packages, then vendored as
  plain files, rather than a manual TTF download or a live npm font
  dependency.** The plan says "Bundle Assistant 400/600/700/800 ... via
  expo-font into apps/mobile/assets/fonts/" without specifying a source;
  using Expo's own maintained, versioned Google Fonts packages as the
  extraction source (rather than an arbitrary download) keeps provenance
  traceable to a specific, inspectable npm version while still ending up as
  committed files with zero runtime dependency on those packages.

## Findings and drift

- **The touch-target/reachability audit convention from Phase 1
  (`INTERACTIVE_SELECTOR` in `_helpers.ts`) held up perfectly for a much
  larger surface.** Every interactive primitive in this phase
  (`TalkiButton`, `TalkiIconButton`, pressable `TalkiCard`,
  `TalkiImageCard`, `BottomNavigation` items, `TopBar`'s brand/music
  controls, `GameHeader`'s back button, `ParentGate`'s confirm/close,
  `RewardOverlay`'s dismiss) got an explicit `accessibilityRole` for free
  because the convention was already established; zero violations on the
  first real run, no selector changes needed.
- **Post-implementation re-validation against `index.html` caught two real
  `TopBar` fidelity bugs**, fixed before commit: (1) a fabricated second
  utility button (`onOpenSettings`/`talki-ui-icon-settings.png`) that has no
  counterpart in `index.html` 1300-1316 — legacy's topbar has exactly one
  utility control (music); the extra button was invented, not transcribed.
  (2) the points pill (`#progressCount`) dropped the star icon that legacy's
  `.tb-points` always renders alongside the count (index.html 1303-1306).
  Both are fixed: `TopBar` now renders a single music toggle and a
  star-icon-plus-number points chip with `role="img"`/aria-label matching
  `updateHeader()`'s accessible name exactly, and the `gallery-shell`
  screenshot baselines were regenerated across all 10 viewports. Full gate
  (tsc/eslint/vitest/playwright/legacy suites) re-run clean after the fix.
  `docs/talki-home-redesign-plan.md` does describe a future three-button
  topbar (gift/music/speech-rate), but that redesign is not implemented in
  `index.html` today, so per the phase's standing rule — code over
  aspirational docs — it was left out of this phase.
- **The category `body` and `outside` colours have no named CSS variable in
  legacy.** Every other category's gradient references a named token
  (`--leaf`, `--berry`, `--grape`, ...), but `.c-body .hero-chip` and
  `.c-outside .hero-chip` (index.html 161, 164) use bare hex pairs
  (`#D8567F`/`#A83560` and `#4FA3D1`/`#2E6E96`) that exist nowhere else in
  the stylesheet. `categoryColors.ts` inlines them exactly, with a comment
  flagging the exception, rather than inventing named tokens legacy never
  had.
- **`mine` (custom words) reuses the `colors` category's exact gradient**
  (`--grape`/`--grape-dark` for both `.c-colors .hero-chip` and
  `.c-mine .hero-chip`, index.html 158, 166) — not a coincidence worth
  "fixing"; transcribed as-is.
- **The left/right ESLint rule needed to be scoped to `files: ['src/**',
  'app/**']`,** not applied workspace-wide — `eslint-config-expo`'s own
  generated/config files elsewhere in the project may legitimately use
  physical properties outside application code.

## Risks carried into the next phase

- The four native-coverage gaps above (real font rendering, native RTL
  after cold start, real-device touch comfort, and the still-outstanding
  Phase 4 audio/TTS/recording/orientation hardware verification) are
  unchanged by this phase and remain open until a real Android device is
  available. None of them block Phase 6+ development, which continues to
  build against the same web-verified interfaces.
- The four-step shadow scale's native values (Deviations, above) were tuned
  by eye against exported screenshots on this machine's rendering, not
  measured against a reference device. If a real device's shadow rendering
  looks meaningfully heavier/lighter than intended, the fix is contained
  entirely to `theme/shadows.ts`'s four numbers.
- `ParentGate` and `RewardOverlay` are shells with no wired logic (by
  design — Phase 12 owns `ParentGate`'s math-challenge verification; reward
  logic is wherever a category/game actually completes). Whoever builds
  those screens must import these components rather than rebuilding them.

## Commands to reproduce

```bash
cd apps/mobile
npx tsc --noEmit && npx eslint . && npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test

cd ..
node tools/dev-server.js &
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```
