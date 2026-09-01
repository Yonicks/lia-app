# Validation contract

Every phase of the Talki migration obeys this document. Phase prompts reference
it rather than restating it.

The purpose is narrow and specific: make it impossible for a phase to be
reported complete on the strength of "I built the screen and it rendered".

---

## 1. Why three tiers

No single tool can validate a React Native application end to end.

- Pure logic needs no rendering at all, and testing it through a UI is slow and
  flaky.
- Layout, RTL, navigation, touch targets and visual regression need a real
  rendering engine and a viewport.
- Audio, microphone, orientation locks, SQLite durability across a process
  kill, and AdMob only exist on a device.

So there are three tiers, and each phase declares its coverage in all three.

```
Tier 1   vitest + differential tests        logic, no rendering
Tier 2   Playwright against Expo web        layout, RTL, interaction, screenshots
Tier 3   Maestro + device + manual          native-only truth
```

---

## 2. Tier 1 — logic

Runner: `vitest`, from `apps/mobile/`.

Location: `apps/mobile/tests/unit/`.

### Differential testing is the primary technique

Hand-written expectations encode what the author *believes* the legacy app
does. For a migration that is the wrong instrument — the whole risk is that the
belief is wrong. So wherever the legacy behaviour is expressible as a pure
function, the new implementation is compared directly against the old one.

Three differential harnesses exist.

**Domain data.** `tools/extract-legacy-domain.mjs` reads `index.html`, isolates
the constant declarations, evaluates them in a `node:vm` sandbox with a stub for
`art()`, and writes `docs/migration/fixtures/legacy-domain.json`. It extracts:

- `CATEGORIES` (index.html 1480-1592)
- `PRACTICE_LIST` (2218-2225)
- `MIN_ITEMS` (2489-2490)
- `STICKERS` (2417-2442)
- `CARRIERS` (1597), `CLOZE` (1600-1609), `PAIRS` (1612-1620), `MODIFIERS` (1623-1628)
- `K` storage key patterns (1633-1637)
- the `settings` defaults literal (1647)

A vitest spec then asserts the TypeScript port deep-equals that fixture. This is
what catches a single transposed niqqud mark in one of 182 Hebrew words, which
no human review reliably catches.

**Audio policy.** `assets/audio/audio-logic.js` is already DOM-free CommonJS, so
the test can `require()` the real legacy module and the TypeScript port side by
side and compare them over an exhaustive matrix:

- `computeDuckTarget` over all 8 combinations of `{speaking, listening, voicePrompt}`
- `shouldPlaySfx` over all 22 events crossed with cooldown boundaries at
  `t-1`, `t`, `t+1` for each of the 60 / 400 / 800 ms classes, and with
  `activeSfxCount` of 0 through 4
- `resolveMusicFile` over all 10 mapped keys plus `rewardScreen`, `null`, and
  unknown strings
- `effectiveMusicVolume` and `effectiveSfxVolume` over a grid of master, user
  and duck multipliers including out-of-range values that must clamp
- `cooldownFor` and `releaseDurationFor` over every event and reason

**Progress semantics.** `currentCategory`, `catLearned`, `totalWords`, `key`,
`plain` and `display` are compared against extracted legacy implementations
across generated scenarios that reach all four `currentCategory` branches,
including the `lastCat` branch.

### What Tier 1 does not do

It does not touch React, does not render, and does not import anything from
`app/`. If a test needs a component, it belongs in Tier 2.

---

## 3. Tier 2 — UI via the Expo web target

Expo builds the same application for web through `react-native-web`. A `testID`
prop renders as a `data-testid` attribute, so Playwright selectors are stable
and do not depend on text content, which is Hebrew and changes with the niqqud
setting.

### Commands

```bash
cd apps/mobile
npx expo export --platform web     # produces dist/
npx playwright test                # config starts `npx expo serve` on :8081
```

`playwright.config.ts` owns the server:

```ts
webServer: {
  command: 'npx expo serve --port 8081',
  url: 'http://localhost:8081',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
}
```

### Viewport matrix

Ten projects. The first eight are the exact `DEVICES` list from
`tests/interaction_suite.py`, so mobile results are directly comparable to
legacy results. The last two are added because games are landscape in the
native app and the legacy matrix has no landscape tablet.

| Project | Size | Notes |
|---|---|---|
| `iphone-se1` | 320 x 568 | smallest supported, layout stress |
| `android-compact` | 360 x 800 | most common Android |
| `iphone-13` | 390 x 844 | primary reference, legacy screenshots use it |
| `iphone-pro-max` | 430 x 932 | large phone |
| `ipad-mini` | 768 x 1024 | tablet portrait |
| `ipad-air` | 834 x 1112 | tablet portrait |
| `landscape-844` | 844 x 390 | phone landscape |
| `landscape-932` | 932 x 430 | large phone landscape |
| `tablet-4-3` | 1024 x 768 | iPad-shaped landscape, games |
| `tablet-16-10` | 1280 x 800 | Android-tablet-shaped landscape, games |

Projects below 900 px wide set `hasTouch: true` and `isMobile: true`, matching
the legacy suites.

### Shared helpers

`apps/mobile/tests/e2e/_helpers.ts` ports the audits that already exist in
`tests/interaction_suite.py` so the native app is held to the same bar:

- `openApp(page, { skipIntro = true })` — navigates, skips the opening
  sequence, waits for the home route to be interactive.
- `auditTouchTargets(page)` — every element carrying a child-facing `testID`
  must measure at least **48 x 48** including pseudo-element padding. Mirrors
  legacy `MIN_TOUCH = 48`.
- `auditReachability(page)` — scrolls each interactive control to the centre
  and hit-tests it with `elementFromPoint`. Fails if anything is covered by a
  header, a bottom bar or an ad slot.
- `burst(page, testId, n)` — fires `n` synchronous clicks with no delay, for
  rapid-toddler-tap assertions. Mirrors legacy `test_rapid_taps`.
- `countListeners(page, testId)` — wraps `addEventListener` to detect handler
  growth across re-renders. Mirrors legacy `test_no_listener_growth`.
- `speechSpy(page)` — installs an init script that records every call made to
  the speech service, so "speaks exactly once on entry" is assertable. Mirrors
  legacy `SPEECH_SPY`.
- `degradeNativeApis(page)` — stubs the service layer into its unavailable
  state so screens can be proven to survive missing TTS, missing microphone and
  missing recognition. Mirrors legacy `STRIP_AUDIO`.
- `captureMatrix(page, phase, name)` — writes
  `docs/migration/screenshots/phase-NN/<project>-<name>.png`.

### Visual regression

Baselines live in `apps/mobile/tests/e2e/__screenshots__/` and are committed.
`expect(page).toHaveScreenshot()` guards against unintended visual drift
between phases. A deliberate visual change means updating the baseline in the
same commit, and saying so in the report.

This is separate from the evidence screenshots under
`docs/migration/screenshots/`, which are for human review and are never
compared automatically.

### testID convention

`apps/mobile/src/testing/testIds.ts` is the single registry. Phase prompts name
the exact identifiers to add, so no agent invents its own scheme.

```
<surface>-<element>            home-continue-card
<surface>-<element>-<key>      home-category-animals
<game>-<element>-<index>       quiz-option-2
<game>-<element>               quiz-replay-button
parent-<tab>-<element>         parent-settings-niqqud-toggle
```

Identifiers are stable, lowercase, hyphenated, and never contain Hebrew.

---

## 4. Tier 3 — what Playwright provably cannot check

This list is inlined into every prompt. An agent may not claim any of these on
the strength of a web run.

- Real `expo-audio` playback: music start, crossfade, SFX pooling, the duck
  ramps, and the reward-screen volume multiplier.
- `expo-speech` Hebrew TTS: whether a `he-IL` voice exists on the device at
  all, and how it behaves when it does not.
- Microphone recording, the permission dialog, and permission denial.
- `expo-screen-orientation` locks, and how they interact with iPad
  multitasking.
- `expo-sqlite` durability across a genuine process kill, as opposed to a page
  reload.
- AdMob banner rendering, sizing, and the `--ad-h` equivalent layout inset.
- App background and resume: timers, audio session, and game state.
- Cold start with no network.
- Real frame rate and memory under animation.

Coverage for these comes from:

- Maestro flows in `apps/mobile/.maestro/`, run against a device or emulator.
- `adb exec-out screencap -p > out.png` for Android evidence screenshots.
- `xcrun simctl io booted screenshot out.png` for iOS evidence screenshots.
- A short manual checklist that the phase report fills in **with device names
  and OS versions**. "Tested on Android" is not acceptable; "Pixel 6a, Android
  15" is.

---

## 5. The legacy regression guard

Every phase re-runs the legacy suites and records the result. This is what
enforces "the migration is parallel, not destructive".

```bash
node tools/dev-server.js &                     # serves repo root on :8000
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```

If the legacy suites were already failing before the phase started, that is
recorded as the phase's inherited baseline and must not get worse.

---

## 6. The seven gate items

A phase is complete when all seven are true and evidenced in the report.

1. **Static checks clean.**
   `npx tsc --noEmit`, `npx eslint .`, `npx expo-doctor`.
2. **Tier 1 green.**
   `npx vitest run`, including every differential test.
3. **Web bundle builds.**
   `npx expo export --platform web`.
4. **Tier 2 green.**
   `npx playwright test` across all ten viewport projects.
5. **Screenshots committed.**
   Every screen the phase touched, at every viewport, under
   `docs/migration/screenshots/phase-NN/`, matching the plan's screenshot
   manifest. Phases 2 and 3 have no UI and substitute a generated artifact
   report.
6. **Legacy still green.**
   Both Python suites plus the audio-logic unit tests, per section 5.
7. **Report written.**
   `docs/migration/phase-NN-report.md` with PASS or FAIL per acceptance item
   and a native-coverage section naming real devices or stating "not
   applicable, no native surface in this phase".

---

## 7. Report format

Every phase report uses these headings, in this order, so phases chain
predictably and Phase 14 can machine-read them.

```markdown
# Phase NN report — <title>

## Summary
One paragraph. What now exists that did not before.

## Acceptance criteria
- [PASS|FAIL] <criterion text copied verbatim from the prompt>
...

## Gate results
1. Static checks: PASS|FAIL  <paste output>
2. Tier 1 vitest: PASS|FAIL  <paste summary line>
3. Web export: PASS|FAIL
4. Tier 2 playwright: PASS|FAIL  <paste summary line, per project>
5. Screenshots: PASS|FAIL  <count, path>
6. Legacy regression: PASS|FAIL  <paste both suite summary lines>
7. This report: PASS

## Native coverage
Device: <make, model, OS version> or "not applicable, no native surface"
Checks performed: ...
Checks NOT possible and why: ...

## Files created
<path> — <one line purpose>

## Dependencies added
<package>@<version> — <why>

## Deviations from the phase plan
<what, and why> or "none"

## Findings and drift
Anything in the legacy app or existing docs that turned out to be different
from what was documented.

## Risks carried into the next phase
...

## Commands to reproduce
<literal shell block>
```

---

## 8. CI

A `mobile` job is added to `.github/workflows/` from Phase 1. It does not alter
the existing `test` and `deploy` jobs, which continue to guard the legacy app.

The mobile job: Node 22.13 or newer, `npm ci`, `tsc --noEmit`, `eslint`,
`vitest run`, `expo export --platform web`, `playwright test`, then uploads the
Playwright HTML report and the phase screenshot directory as artifacts.

Maestro does not run in CI. Tier 3 stays manual and device-attested until
Phase 14 evaluates whether a hosted device farm is worth adding.

---

## 9. Known defects in the legacy harness — do not reproduce these

The existing harness has four bugs. The mobile harness must not inherit them.

- `tests/interaction_suite.py` declares `SHOT_DIR` and never writes a
  screenshot. The mobile suites must actually write every screenshot they
  claim.
- `tools/sweep.js` and `tools/audio-check.js` default to port `5173`, a
  leftover from a Vite setup, while the app and CI use `8000`. Port defaults in
  the mobile harness come from one shared constant.
- `tools/make_store.py` hardcodes `ROOT = /home/claude/build/lia-app`, which
  does not exist. No absolute paths outside the repository.
- `tools/screenshot.js` documents a `--wait=selector` flag that is not
  implemented. Documented flags must exist.
