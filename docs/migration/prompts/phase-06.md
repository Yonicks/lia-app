# Phase 6 prompt — Native opening sequence

Plan: [../phases/phase-06-plan.md](../phases/phase-06-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 6 of the Talki migration to Expo React Native.

Phase 6 builds the native opening sequence — the first thing a child sees. It
is also the first phase that uses Reanimated in anger, which is deliberate: if
the animation stack has a problem on this SDK, on the web target, or on a
low-end Android device, it is far better to find out inside a self-contained
1.8-second animation than inside the bubbles game.

Execute ONLY Phase 6.

READ THIS BEFORE ANYTHING ELSE — a false premise in the master plan:

The master plan's Phase 6 tells you to use "the approved separate Yonicks
Studios logo assets in the repository". THOSE ASSETS DO NOT EXIST. A full
search finds no Yonicks branding anywhere except a privacy-policy URL at
index.html 3288 and the Android package path.

What DOES exist is a Talki opening bumper. sw.js lines 18-25 precache this set,
commented "opening bumper art — the intro must survive an offline launch":
    assets/v2/brand/talki-logo-mark.png
    assets/v2/mascot/talki-star-waving.png
    assets/v2/backgrounds/talki-bg-home-hero.png
    assets/v2/effects/talki-particle-star-yellow.png
    assets/v2/effects/talki-particle-star-purple.png
    assets/v2/effects/talki-particle-star-green.png
    assets/v2/effects/talki-particle-star-small.png

So: build the TALKI opening sequence from the assets that exist. Implement the
studio bumper as an OPTIONAL prefix layer that renders nothing when its assets
are absent. Do NOT create a placeholder wordmark. Do NOT set the studio name in
a system font. A missing brand asset is a product decision, not yours. Raise it
as a blocker in your report.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename or refactor index.html, audio-manager.js, assets/,
  tests/, android/, ios/, capacitor.config.ts or manifest.json.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Do not make a decision for the browser's benefit.
- In particular: do NOT simplify an animation to make the web target happy.
  If something cannot be driven on web, keep it native and cover it in Tier 3.

FORBIDDEN
- No video file. No MP4, no GIF, no Lottie-of-a-video.
- No placeholder or system-font stand-in for a missing brand asset.
- No emoji where a real Talki asset exists.
- No randomness or decode-order dependence in the sequence.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not build Home. Transition to a placeholder route.
- If you finish early, deepen the frame testing. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-06-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-06-plan.md   — your plan, read it fully
2. docs/migration/validation.md
3. docs/migration/phase-05-report.md        — the design system you build on
4. sw.js lines 10-30                        — the precached bumper asset list
5. index.html 4239-4247                     — the start gate and ?intro=0
6. index.html 4068-4084                     — the first-gesture audio unlock
7. capacitor.config.ts                      — splash colour #FFF6E4
8. tests/interaction_suite.py               — the existing reduced-motion test
9. assets/v2/brand/, assets/v2/mascot/, assets/v2/effects/

GROUND TRUTH — the timeline. Fixed, deterministic, no randomness:
    0 ms      soft background appears
    150 ms    star enters and scales
    450 ms    surrounding sparkles
    650 ms    Talki wordmark appears
    950 ms    secondary element settles
    1200 ms   gentle final bounce and glow
    1500 ms   begin transition out
    1800 ms   the next route is interactive

Total under two seconds. A toddler app must not make a child wait, and a parent
opening the app for the twentieth time must not be made to sit through
something charming.

Splash background is #FFF6E4 (capacitor.config.ts). The first intro frame must
match it so there is no colour flash between the native splash and your first
frame.

WORK ITEMS

1. Export the timeline as DATA from
   apps/mobile/src/features/intro/timeline.ts:

     export interface IntroStep {
       at: number;            // ms from sequence start
       layer: IntroLayerId;
       action: 'enter' | 'settle' | 'exit' | 'glow';
       durationMs: number;
     }
     export const INTRO_TIMELINE: readonly IntroStep[];
     export const INTRO_TOTAL_MS = 1800;
     export type IntroLayerId =
       'background' | 'star' | 'sparkles' | 'wordmark' | 'secondary';

   Both the component AND the tests read this. A test that hardcodes 650 while
   the component hardcodes 600 proves nothing.

2. Build IntroSequence.tsx with Reanimated, animating real layered assets.

   No video. A video cannot adapt to ten aspect ratios, cannot respect a safe
   area, costs megabytes, and adds a decode dependency at the exact moment the
   app can least afford one.

   Preload every intro asset before the first frame; start only when ready.
   The sequence must be DETERMINISTIC: the same timestamp always produces the
   same frame, because Tier 2 captures frames at fixed times and asserts on them.

3. Compute a safe zone from the Phase 5 responsive module. The failure mode of
   a logo animation is a logo cropped on the smallest phone or squashed on a
   landscape tablet. Nothing may clip at any of the ten viewports.

4. Skip behaviour:
     - tapping anywhere skips immediately to the end state
     - ?intro=0 bypasses the sequence entirely (legacy already uses this
       parameter and tests/test_suite.py relies on it)
     - honour the OS reduce-motion setting: show the final frame and move on

5. Wire an audio hook through AudioEngine. There is no intro sound asset yet;
   build the hook anyway so one can be dropped in later without touching the
   animation. It must not fight the first-gesture audio unlock — an intro that
   plays before any user interaction will be silently blocked on some
   platforms. THE SEQUENCE MUST LOOK CORRECT WITH NO SOUND AT ALL.

6. Implement studioBumper.tsx as an optional prefix that renders nothing when
   its assets are absent. It will render nothing today.

7. Tier 1: intro-timeline.test.ts
     - the timeline is sorted by `at`
     - no step starts before 0 or ends after INTRO_TOTAL_MS
     - every IntroLayerId referenced has a corresponding asset entry
     - total duration is 1800
     - the timeline contains no random or time-dependent value

8. Tier 2: apps/mobile/tests/e2e/intro.spec.ts at all ten viewports. This is
   the phase's main instrument.
     - capture frames at 0, 300, 700, 1000, 1400 and 1800 ms
     - AT EVERY CAPTURED FRAME, assert every visible layer's bounding box lies
       fully inside the viewport. No clipping at any size.
     - the sequence completes and the next route is interactive by 1800 ms plus
       a tolerance
     - tapping at 400 ms skips immediately to the end state
     - ?intro=0 renders with no intro frame at all
     - with prefersReducedMotion 'reduce', the final frame shows immediately
     - no console error during the sequence
     - toHaveScreenshot() on the final frame per viewport
     - captureMatrix(page, '06', 'intro-<ms>') for each captured frame

9. Tier 3: apps/mobile/.maestro/intro.yaml (launch, wait, assert next route),
   plus manual attestation on a real device, named:
     - no dropped frames on a LOW-END Android device
     - no flash of the wrong colour between native splash and first frame
     - backgrounding mid-intro and returning leaves no stuck overlay
     - the app is interactive immediately after the sequence

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
- Do not build Home. Transition to a placeholder route; Phase 7 owns Home.
- Do not invent Yonicks Studios branding.
- Do not add a video, GIF or pre-rendered animation file.
- Do not make the sequence depend on image decode order or on a random value.
- Do not simplify the animation because Reanimated behaves differently on web.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] The sequence renders from real Talki assets; no placeholder, no
      system-font wordmark
- [ ] The studio bumper is optional and skipped cleanly when assets are absent
- [ ] Missing Yonicks Studios assets raised as a BLOCKER in the report
- [ ] The timeline is exported data, shared by the component and the tests
- [ ] Deterministic: identical frames at identical timestamps across two runs
- [ ] No clipping at any of the ten viewports at any of the six captured frames,
      asserted programmatically rather than by eye
- [ ] Tap skips to the end state
- [ ] ?intro=0 bypasses the sequence entirely
- [ ] Reduce-motion shows the final frame immediately
- [ ] First frame background matches the #FFF6E4 splash, no colour flash
- [ ] Audio hook routed through AudioEngine and the sequence is correct in silence
- [ ] No video file was added
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 60 frame screenshots plus one device capture committed
- [ ] Frame rate attested on a real LOW-END Android device, named
- [ ] Backgrounding mid-intro leaves no stuck overlay
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-06-report.md using the headings in
docs/migration/validation.md section 7.

In "Findings and drift", state clearly that the master plan's instruction to use
Yonicks Studios assets could not be followed because those assets are not in the
repository, and list exactly what would be needed to build the studio bumper.

If any Tier 2 assertion was skipped because of a Reanimated web limitation, say
which, why, and how Tier 3 covered it instead.

Then stop. Do not begin Phase 7.
````
