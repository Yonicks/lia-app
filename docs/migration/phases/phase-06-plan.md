# Phase 6 — Native opening sequence

**Prompt:** [../prompts/phase-06.md](../prompts/phase-06.md)
**Creates:** `app/intro/`, `apps/mobile/src/features/intro/`
**Ships:** the first thing a child sees

---

## Blocker found during planning: the Yonicks Studios assets do not exist

The master plan's Phase 6 instructs the agent to "use the approved separate
Yonicks Studios logo assets in the repository", listing three layers:
star/decorations, "Yonicks", and "Studios"/decorations.

A search of the repository finds no such assets. The only occurrence of the
string "yonicks" anywhere outside the Android package path is a privacy-policy
URL at index.html 3288. `assets/v2/brand/` contains six files, all Talki
branding:

```
talki-app-icon.png       talki-header-logo.png    talki-loading-mark.png
talki-logo-mark.png      talki-splash-star.png    talki-star-mark.png
```

Meanwhile `sw.js` lines 18-25 precache a set explicitly commented "opening
bumper art — the intro must survive an offline launch":

```
assets/v2/brand/talki-logo-mark.png
assets/v2/mascot/talki-star-waving.png
assets/v2/backgrounds/talki-bg-home-hero.png
assets/v2/effects/talki-particle-star-yellow.png
assets/v2/effects/talki-particle-star-purple.png
assets/v2/effects/talki-particle-star-green.png
assets/v2/effects/talki-particle-star-small.png
```

So an opening bumper already exists, and it is a **Talki** bumper, not a
Yonicks Studios one.

**Decision:** Phase 6 builds the Talki opening sequence from the assets that
exist. The studio bumper is designed as an optional layer that is skipped
entirely when its assets are absent, and the missing assets are raised as a
product blocker rather than faked. No placeholder wordmark, no system-font
text standing in for a logo.

## Goal and rationale

Make the first three seconds of the native app feel deliberate, and prove the
animation stack works before eleven game screens depend on it.

There is a secondary purpose. Phase 6 is the first phase that uses Reanimated
in anger. If Reanimated has a problem on this SDK, on the web target, or on a
low-end Android device, it is far better to discover that in a self-contained
1.8-second animation than inside the bubbles game.

## Entry conditions

- `docs/migration/phase-05-report.md` exists with no critical FAIL.
- The design system and `AudioEngine` exist.

## Design decisions

### Animate real layers, never render a video

An MP4 would be simpler and is rejected. A video cannot adapt to ten aspect
ratios, cannot respect a safe area, costs several megabytes, and introduces a
decode dependency on startup — the exact moment when the app can least afford
one. Layered images driven by Reanimated scale to any viewport and cost
kilobytes.

### The sequence is deterministic

Fixed durations, no randomness, no dependence on when an image finishes
decoding. All intro assets are preloaded before the first frame; the sequence
starts only once they are ready.

Determinism is what makes this testable. Tier 2 captures frames at fixed
timestamps and asserts on them, which is only meaningful if the same timestamp
always produces the same frame.

### Timings

```
0 ms      soft background appears
150 ms    star enters and scales
450 ms    surrounding sparkles
650 ms    Talki wordmark appears
950 ms    secondary element settles
1200 ms   gentle final bounce and glow
1500 ms   begin transition out
1800 ms   Home is interactive
```

Total under two seconds. A toddler app must not make a child wait, and a parent
opening the app for the twentieth time must not be made to sit through
something charming.

### Skippable, and skipped when it should be

- Tapping anywhere skips to the end immediately.
- `?intro=0` skips it entirely, matching the legacy query parameter that
  `tests/test_suite.py` already relies on.
- Honour the OS reduce-motion setting: show the final frame and move on.
  `tests/interaction_suite.py` already has a reduced-motion test, so the
  precedent exists.

### Audio goes through AudioEngine

The intro has no dedicated sound asset yet. The hook is built anyway so a
sound can be dropped in later without touching the animation, and it goes
through `AudioEngine` like everything else. Critically, it must not fight the
first-gesture audio unlock: an intro that plays before any user interaction
will be silently blocked on some platforms. The sequence must look right with
no sound at all.

### No clipping, ever

The failure mode of a logo animation is a logo cropped on the smallest phone or
squashed on a landscape tablet. The safe zone is computed from the responsive
module, and Tier 2 asserts that every animated layer's bounding box stays
inside the viewport at every one of the ten sizes at every captured frame.

## Legacy source mapping

| What | Legacy location |
|---|---|
| Precached opening bumper asset list | sw.js 18-25 |
| Start gate and `?intro=0` | index.html 4239-4247 |
| First-gesture audio unlock | index.html 4068-4084 |
| Reduced-motion precedent | tests/interaction_suite.py |
| Splash colour `#FFF6E4` | capacitor.config.ts |

## Files to be created

```
app/intro/index.tsx
apps/mobile/src/features/intro/
├── IntroSequence.tsx
├── timeline.ts             the fixed timings, exported for tests
├── layers.ts               which asset is which layer
├── useIntroPreload.ts
└── studioBumper.tsx        optional, skipped when assets are absent

apps/mobile/tests/unit/intro-timeline.test.ts
apps/mobile/tests/e2e/intro.spec.ts
apps/mobile/.maestro/intro.yaml
```

## Contracts introduced

```ts
export interface IntroStep {
  at: number;            // ms from sequence start
  layer: IntroLayerId;
  action: 'enter' | 'settle' | 'exit' | 'glow';
  durationMs: number;
}

export const INTRO_TIMELINE: readonly IntroStep[];
export const INTRO_TOTAL_MS = 1800;

export type IntroLayerId =
  | 'background' | 'star' | 'sparkles' | 'wordmark' | 'secondary';
```

The timeline is data, exported so tests assert against the same source the
animation reads. A test that hardcodes 650 ms while the component hardcodes
600 ms proves nothing.

## Behaviour to preserve exactly

- The intro is skippable by tap.
- `?intro=0` bypasses it, as legacy does.
- All intro assets are precached and work offline.
- Background colour matches the splash `#FFF6E4` so there is no flash between
  native splash and first frame.

## Deliberate deviations

- The sequence is animated rather than static.
- The studio bumper is deferred until its assets exist.

## Test plan

### Tier 1

`intro-timeline.test.ts`
- the timeline is sorted by `at`
- no step starts before 0 or ends after `INTRO_TOTAL_MS`
- every `IntroLayerId` referenced has a corresponding asset entry
- total duration is 1800 ms
- the timeline contains no random or time-dependent value

### Tier 2

`intro.spec.ts` at all ten viewports. This is the phase's main instrument.

- capture frames at 0, 300, 700, 1000, 1400 and 1800 ms
- at every captured frame, assert every visible layer's bounding box lies fully
  inside the viewport — no clipping on any size
- assert the sequence completes and Home becomes interactive by 1800 ms plus a
  tolerance
- tapping at 400 ms skips immediately to the end state
- `?intro=0` renders Home with no intro frame at all
- with `prefersReducedMotion: 'reduce'`, the final frame shows immediately
- no console error during the sequence
- `toHaveScreenshot()` on the final frame per viewport
- `captureMatrix(page, '06', 'intro-<ms>')` for each captured frame

### Tier 3

`.maestro/intro.yaml`: launch, wait, assert Home is visible.

Manual attestation on a real device, naming it:
- no dropped frames on a low-end Android device
- no flash of the wrong colour between native splash and first frame
- backgrounding mid-intro and returning does not leave a stuck overlay
- the app is interactive immediately after the sequence

## Screenshot manifest

```
docs/migration/screenshots/phase-06/
    <viewport>-intro-0000.png
    <viewport>-intro-0300.png
    <viewport>-intro-0700.png
    <viewport>-intro-1000.png
    <viewport>-intro-1400.png
    <viewport>-intro-1800.png
    android-device-intro-final.png
```

Six frames times ten viewports is 60 files, plus one device capture.

## Risks and open questions

**The Yonicks Studios assets do not exist.** Default: build the Talki sequence
from the assets that are present and precached in `sw.js`. Implement
`studioBumper.tsx` as an optional prefix that renders nothing when its assets
are absent. Do not create a placeholder wordmark and do not set the studio name
in a system font — the master plan explicitly forbids both, and a missing brand
asset is a product decision. Raise it as a blocker in the report.

**Reanimated on the web target.** Reanimated's web support is real but not
identical to native. Default: if a specific animation cannot be driven on web,
keep it native-only, mark the corresponding Tier 2 assertion as skipped with a
reason, and cover it in Tier 3. Do not simplify the animation to make the web
target happy — that would be optimising for the test surface, which the
standing rules forbid.

**Audio may be blocked before first interaction.** Default: the sequence must
look correct with no sound. Wire the hook, do not depend on it.

**1800 ms may feel long on the hundredth launch.** Default: keep it for now and
note it. A "skip after first launch" behaviour is a product decision, and the
tap-to-skip already covers the impatient case.

## Exit criteria

- [ ] The sequence renders from real Talki assets, no placeholder, no system-font
      wordmark
- [ ] The studio bumper is optional and skipped cleanly when assets are absent
- [ ] Missing Yonicks Studios assets raised as a blocker in the report
- [ ] Timeline is data, exported, and shared between component and tests
- [ ] Deterministic: identical frames at identical timestamps across runs
- [ ] No clipping at any of the ten viewports at any captured frame, asserted
- [ ] Tap skips to the end
- [ ] `?intro=0` bypasses entirely
- [ ] Reduce-motion shows the final frame immediately
- [ ] Transitions cleanly into the Talki route
- [ ] No video file was added
- [ ] Audio hook routed through `AudioEngine`; the sequence is correct in silence
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 60 frame screenshots plus one device capture committed
- [ ] Frame rate attested on a real low-end Android device
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-06-report.md` written
