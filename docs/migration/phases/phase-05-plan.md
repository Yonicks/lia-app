# Phase 5 — Talki native design system and app shell

**Prompt:** [../prompts/phase-05.md](../prompts/phase-05.md)
**Creates:** `apps/mobile/src/design-system/`, shared shell components
**Ships:** a developer-only component gallery. No product screen yet.

---

## Goal and rationale

Build the visual foundation once, so that eleven game screens and six practice
screens do not each invent their own spacing, colour and typography.

The failure mode this prevents is specific and common: a design system that
arrives after the screens. Each screen gets styled locally, then someone
extracts a `Button` from the third screen, and the first two never get updated.
Two years later there are four button styles and nobody can change the brand
colour.

The phase also crosses the migration's most misunderstood boundary. The legacy
app has roughly 1200 lines of CSS. The point of this phase is emphatically not
to translate it.

## Entry conditions

- `docs/migration/phase-04-report.md` exists and its go/no-go recommendation is
  proceed.
- The technical gate has been passed.

## Design decisions

### Port the tokens, not the CSS

The `:root` block at index.html 28-68 holds the actual design decisions: the
palette, the radii, the shadows, the spacing rhythm. Those port directly into a
typed theme.

Everything else in the stylesheet — the flex declarations, the media queries,
the pseudo-element tricks, the `position: sticky` topbar — is a set of answers
to browser layout problems. React Native does not have those problems and has
different ones. Translating that code produces something that works badly in
both worlds.

The rule: colours, radii, shadows, spacing and font families are transcribed
exactly. Layout is written fresh.

Rejected alternative: a CSS-to-StyleSheet conversion pass. It produces
plausible-looking code that encodes browser assumptions, and it is much harder
to review than fresh code because every line looks intentional.

### Two palettes coexist, exactly as they do today

The legacy `:root` carries a V2 palette (`--v2-*`, plus the older `--cream`,
`--berry`, `--grape` family) and a newer V3 Talki palette (`--talki-*`). Both
are live: V3 drives the redesigned Home, V2 still drives game screens.

Both are ported. Collapsing them into one palette during the migration would
mean re-deciding the colour of every game screen while also porting its logic,
which is two risky changes at once. The consolidation is a design decision for
later.

### Bundle the fonts

Legacy loads Rubik and Assistant from the Google Fonts CDN
(index.html line 26). A native app must not depend on a network fetch for its
typeface — Talki works offline, and a font that arrives late causes a visible
reflow on every cold start.

Assistant 400/600/700/800 and Rubik 500/700/800/900 are bundled through
`expo-font`. The gallery asserts the real font is applied rather than a system
fallback, because a silent fallback to a system Hebrew face is easy to miss and
changes every metric on the screen.

### Responsive is centralised, not per-component

One module answers "what size is this device and which way is it facing". The
legacy app scatters this across media queries at 430 px and 768 px plus
JS-measured `--barh` and `--ad-h` variables.

```ts
type DeviceClass = 'phone' | 'largePhone' | 'smallTablet' | 'largeTablet';
type Orientation = 'portrait' | 'landscape';
```

Components ask the hook. No component reads `Dimensions` directly.

### RTL through logical properties, always

Talki is Hebrew and right-to-left. Every layout uses `start`/`end`, never
`left`/`right`. Every icon that implies direction is mirrored.

This is stated as an absolute rule because RTL bugs are invisible to a
developer reading English code — `marginLeft: 8` looks completely normal and is
wrong on every screen. A lint rule enforcing this is worth adding if one is
available.

### The gallery is a test surface, not documentation

`app/dev/gallery.tsx` renders every primitive in every state. It exists so
`toHaveScreenshot` has something to baseline and so a reviewer can see the
whole system on one screen at ten sizes.

## Legacy source mapping

| What | Legacy location |
|---|---|
| Font CDN link, families | index.html 26, 78, 85 |
| V2 and legacy tokens | index.html 29-40 |
| Talki V3 palette | index.html 42-55 |
| Shadow scale | index.html 57-63 |
| Home spacing tokens | index.html 65 |
| Breakpoint overrides at 430 and 768 | index.html 67-68 |
| `--barh`, `--ad-h` | index.html 83 |
| `--tb-side-clear` | index.html 97, 121 |
| Topbar structure and behaviour | index.html 98-125 |
| Main content insets and safe areas | index.html 127-129 |
| Bottom navigation | index.html 1347-1350 |
| Per-view backgrounds | index.html 184-205 |
| Approved visual target | docs/design/talki-home-approved.png |
| Newer hero mock | docs/design/talki-home-hero-mockup.png |

## Files to be created

```
apps/mobile/src/design-system/
├── theme/
│   ├── colors.ts          both palettes, transcribed exactly
│   ├── spacing.ts
│   ├── radii.ts
│   ├── shadows.ts
│   ├── typography.ts
│   └── index.ts
├── responsive/
│   ├── breakpoints.ts
│   ├── useDevice.ts
│   └── useSafeLayout.ts
├── rtl/
│   └── logical.ts         start/end helpers
└── components/
    ├── TalkiScreen.tsx
    ├── TalkiText.tsx
    ├── TalkiHeading.tsx
    ├── TalkiButton.tsx
    ├── TalkiCard.tsx
    ├── TalkiIconButton.tsx
    ├── TalkiProgress.tsx
    ├── TalkiPill.tsx
    └── TalkiImageCard.tsx

apps/mobile/src/components/shell/
├── TopBar.tsx
├── BottomNavigation.tsx
├── GameHeader.tsx
├── ParentGate.tsx          shell only, logic in Phase 12
├── ToastHost.tsx
└── RewardOverlay.tsx

apps/mobile/assets/fonts/    Assistant and Rubik, bundled
app/dev/gallery.tsx
apps/mobile/tests/unit/theme.test.ts
apps/mobile/tests/unit/responsive.test.ts
apps/mobile/tests/e2e/gallery.spec.ts
```

## The token block to transcribe

Verbatim from index.html 29-65. Every value is transcribed exactly; none is
adjusted, rounded or "improved".

```
V2 and legacy
  --cream #FFF8EA        --paper #FFFFFF        --ink #3A2A52       --ink-soft #7B6E8C
  --berry #FF8FA8        --berry-dark #E85E85   --sun #FFD75A       --sun-dark #E8B93A
  --leaf #8FD3C1         --leaf-dark #4FA893    --sky #6FA3DE       --sky-dark #3D78B5
  --grape #7C4CD6        --grape-dark #6D3BA6   --clay #FFCDA1      --clay-dark #F0A868
  --teal #6FC2B4         --teal-dark #3D8F82    --wood #8B5FC9      --wood-dark #6D3BA6
  --line #F1E4CE
  --v2-purple #6D3BA6    --v2-purple-bright #7C4CD6                 --v2-mint #8FD3C1
  --v2-peach #FFCDA1     --v2-gold #FFD75A      --v2-pink #FFD9E6   --v2-pink-dark #F2A8C4
  --v2-radius-card 18px  --v2-radius-btn 16px   --v2-radius-hero 24px

Talki V3
  --talki-purple-900 #44206F   --talki-purple-800 #542780   --talki-purple-700 #6D3BA6
  --talki-purple-600 #7C4CD6   --talki-purple-500 #9366E5   --talki-purple-200 #DED0FA
  --talki-purple-100 #EEE6FF   --talki-purple-050 #F7F2FF
  --talki-mint-500 #8FD3C1     --talki-mint-200 #CFEDE5     --talki-mint-100 #EAF8F4
  --talki-pink-500 #F46B91     --talki-pink-300 #FFA8C2     --talki-pink-200 #FFD9E6
  --talki-pink-100 #FFF0F5
  --talki-peach-500 #FFB977    --talki-peach-300 #FFCDA1    --talki-peach-100 #FFF1E2
  --talki-gold-500 #FFD75A     --talki-gold-300 #FFE796     --talki-gold-100 #FFF8DC
  --talki-blue-500 #69B7EF     --talki-blue-200 #CFEAFB     --talki-blue-100 #EEF8FF
  --talki-green-500 #79CFAE    --talki-green-100 #EAF8F1
  --talki-bg #FFF9EF           --talki-surface #FFFFFF      --talki-surface-soft #FFFCF8
  --talki-text-primary #241735 --talki-text-heading #4E2A72
  --talki-text-secondary #746887                            --talki-text-muted #9B91A7
  --talki-border-soft #F1E7D7  --talki-track #F3EEE6

Shadows
  --shadow             0 10px 24px rgba(109,59,166,.12), 0 2px 6px rgba(58,42,82,.06)
  --shadow-sm          0 2px 6px rgba(65,39,26,.06)
  --shadow-card        0 6px 16px rgba(73,46,25,.09)
  --shadow-floating    0 10px 28px rgba(73,46,25,.13)
  --shadow-topbar      0 6px 18px -6px rgba(109,59,96,.10), 0 2px 8px -2px rgba(160,120,90,.08)

Spacing
  --home-padding-inline  16px, 18px at >=430, 24px at >=768
  --home-section-gap     28px
  --home-grid-gap        12px, 14px at >=430

Measured at runtime
  --barh 68px            top bar height
  --ad-h 0px             ad banner height, set by AdMob
  --tb-side-clear 104px  106px at <=430

Fonts
  body      Assistant, weights 400 600 700 800
  headings  Rubik,     weights 500 700 800 900
```

## Behaviour to preserve exactly

- Every colour hex, exactly.
- Both palettes present.
- Radii 18 / 16 / 24.
- The breakpoints 430 and 768.
- Top bar minimum height 68.
- Assistant for body, Rubik for headings and display text.
- Every child-facing control at least 48 x 48.

## Deliberate deviations

- Fonts bundled instead of fetched from a CDN.
- Shadows become native elevation and shadow props; the visual weight matches
  but the values are platform-appropriate rather than CSS box-shadow strings.

## Test plan

### Tier 1

`theme.test.ts`
- every colour token from the block above is present with the exact hex
- both palettes exist
- radii and spacing values match
- no token is `undefined`
- a snapshot of the whole theme object, so any accidental change is visible in
  review

`responsive.test.ts`
- each of the ten viewport sizes maps to the expected `DeviceClass` and
  `Orientation`
- boundaries at 430 and 768 classify correctly on both sides
- `useSafeLayout` composes safe-area insets, top bar and ad height without
  double counting

### Tier 2

`gallery.spec.ts` at all ten viewports
- every primitive renders in every documented state
- `toHaveScreenshot()` baselines each primitive group per viewport
- `auditTouchTargets` returns no violations
- `auditReachability` returns no violations
- Hebrew sample text lays out right to left; a known first character appears at
  the visual start
- the loaded font family is Assistant or Rubik, not a system fallback
- `captureMatrix(page, '05', 'gallery-<group>')`

### Tier 3

Light. Confirm on one Android device that fonts render, Hebrew is right to
left, and safe areas are respected on a notched screen. Name the device.

## Screenshot manifest

```
docs/migration/screenshots/phase-05/
    <viewport>-gallery-typography.png
    <viewport>-gallery-buttons.png
    <viewport>-gallery-cards.png
    <viewport>-gallery-progress.png
    <viewport>-gallery-shell.png
    <viewport>-gallery-colors.png
    android-device-gallery.png
```

Six groups times ten viewports is 60 files, plus one device capture.

## Risks and open questions

**Two palettes look like duplication.** Default: port both. Consolidation is a
design decision, not a migration decision, and doing it here means re-deciding
every game screen's colour while also porting its logic.

**CSS box-shadow does not map cleanly to native.** Default: match perceived
weight rather than numeric values, keep the four-step scale
(sm / card / floating / topbar), and record the chosen native values in the
report.

**`cls` from Phase 2.** Each category carries a CSS class name such as
`c-animals`. Default: build an explicit `categoryTheme` map keyed by
`CategoryId`, seeded from what those classes resolve to in the legacy
stylesheet. Do not parse CSS at runtime.

**Do not build Home.** The gallery is the deliverable. It is tempting to
assemble a Home preview to see the system in context; that is Phase 7 and
building it here means building it twice.

**Font licensing.** Assistant and Rubik are both SIL Open Font License. Confirm
and note it in the report.

## Exit criteria

- [ ] Every colour token transcribed with the exact hex, verified by test
- [ ] Both palettes present
- [ ] Assistant and Rubik bundled, not CDN-loaded
- [ ] A test proves the real font is applied, not a system fallback
- [ ] Responsive module centralised; no component reads `Dimensions` directly
- [ ] All layout uses logical start/end, never left/right
- [ ] All nine primitives and six shell components exist
- [ ] Gallery renders every primitive in every state at all ten viewports
- [ ] Visual baselines established
- [ ] Touch-target and reachability audits clean
- [ ] Hebrew RTL verified visually and by assertion
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 60 gallery screenshots plus one device capture committed
- [ ] No Home, category or game screen was built
- [ ] No legacy CSS was translated line by line
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-05-report.md` written
