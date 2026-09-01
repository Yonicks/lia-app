# Phase 00 report — Audit and legacy baseline

## Summary

The migration now has a factual foundation instead of an assumed one.
`00-current-state.md` documents the legacy app across 19 sections with every
claim tied to a line range, the feature-parity checklist has been verified
against the running app rather than the source alone, and 250 deterministic
reference screenshots of the legacy UI are committed. All three legacy test
suites were run and all pass; that is the regression baseline every later phase
must keep green. Fourteen defects and one significant piece of documentation
drift were found and recorded. Nothing in the legacy application was changed.

## Acceptance criteria

- [PASS] `docs/migration/00-current-state.md` exists with all 19 sections
- [PASS] Every count in the self-consistency list independently confirmed, or the
  checklist corrected with an explanation
- [PASS] `docs/migration/feature-parity-checklist.md` verified line by line, with
  corrections applied and listed in the report
- [PASS] 250 baseline screenshots committed
- [PASS] `tools/capture-legacy-baseline.mjs` re-runnable and deterministic
- [PASS] All three legacy test suites run, results recorded verbatim
- [PASS] Documentation drift section names every stale claim found
- [PASS] `git status` shows no modification to any legacy application file
- [PASS] `docs/migration/phase-00-report.md` written

## Gate results

The seven-item gate is written for phases that produce mobile code. Phase 0
produces none, so items 1-4 do not apply and item 5 is satisfied by the legacy
baseline set rather than a phase screenshot directory.

1. **Static checks: N/A** — no TypeScript, ESLint or Expo project exists yet.
   Phase 1 creates them.
2. **Tier 1 vitest: N/A** — no mobile logic yet. The existing Node unit tests
   were run instead and are reported under item 6.
3. **Web export: N/A** — no Expo app yet.
4. **Tier 2 playwright: N/A** — no mobile app to drive. The legacy Playwright
   suites were run instead and are reported under item 6.
5. **Screenshots: PASS** — 250 files in
   `docs/migration/screenshots/legacy-baseline/`, being 25 view names across 10
   viewports. Verified byte-identical across two consecutive runs.
6. **Legacy regression: PASS** — all three suites green:

```
node --test tests/audio-logic.test.js
  ℹ tests 18   ℹ pass 18   ℹ fail 0   ℹ duration_ms 83.184217

python tests/test_suite.py
  ============================================================
  ALL CHECKS PASSED

python tests/interaction_suite.py
  ============================================================
  ALL INTERACTION CHECKS PASSED
```

7. **This report: PASS**

## Native coverage

Not applicable, no native surface in this phase. No device was used and none was
required; the phase produced documentation and reference images only.

Worth carrying forward: `test_suite.py` confirms IndexedDB is the active backend
and that progress, custom words and recordings survive a reload, but browser
IndexedDB is not `expo-sqlite`. Persistence across a real process kill remains
untested by anything in this repository and belongs on the Phase 3 device
checklist.

## Files created

- `docs/migration/00-current-state.md` — the 19-section audit, the factual
  baseline Phase 14 grades against.
- `docs/migration/phase-00-report.md` — this report.
- `tools/capture-legacy-baseline.mjs` — deterministic Playwright capture of the
  legacy UI, 25 views across 10 viewports in a single browser launch.
- `docs/migration/screenshots/legacy-baseline/<viewport>-<view>.png` — 250
  reference images.

Edited in place:

- `docs/migration/feature-parity-checklist.md` — corrections listed below.

## Dependencies added

None. `@playwright/test` and `playwright` were already devDependencies and the
capture script uses the existing installation.

Python `playwright` was installed into a throwaway virtualenv at
`/tmp/talki-venv` in order to run the two legacy Python suites, which CI installs
the same way. Nothing was added to the repository and `package.json` is
untouched.

## Deviations from the phase plan

**Screenshot set is 49 MB, over the plan's 40 MB threshold.** The plan says to
downscale beyond 40 MB. I did not, for two reasons: the images are already at
`deviceScaleFactor: 1`, which is the smallest meaningful size, and the plan's
alternative remedies were worse — dropping viewports is explicitly rejected by
the plan itself, and lossless zlib recompression was measured at only 5.4%
saving, which does not close the gap. Palette quantisation would work but needs a
PNG optimiser, and no such tool is installed while Phase 0 forbids touching
`package.json`. Carried into Phase 1, which may add devDependencies: adding
`sharp` or `pngquant` would cut this set by roughly two thirds without changing
dimensions.

**The capture script suppresses `#toast`.** Not in the plan. Headless Chromium
has no Hebrew speech voice, so the app's genuine "this browser cannot read
Hebrew" warning fires on the speech-bearing views, and it raced the screenshot —
it appeared in some runs and not others. The toast is a transient overlay that
covers the bottom navigation and is not part of any view's layout, so it is
hidden during capture. The underlying behaviour is real and is documented in
audit section 12 rather than being papered over.

**Views were entered by assigning state, not by calling `launch()`.** The plan
offered `launch(type, 'animals')` as the fallback if views did not render
standalone. It was not needed: setting `game = null` and assigning `view` lets
each render function call `startGame` itself, which is the self-healing path
`tools/sweep.js` already relies on. All 25 views rendered with zero errors at all
10 viewports, so no view needed special treatment.

## Findings and drift

### Corrections applied to the feature-parity checklist

1. **Games: 11 → 10.** `cards` was counted as a game. It has a `data-game`
   attribute and a tile on the games menu, but no `startGame` branch and no
   `MIN_ITEMS` entry — it is a browsing view. It is retained in the table marked
   *(not a game)* because it still needs porting. This also reconciles the
   legacy suite's "all 17 games open", which collects `[data-game]` across three
   views and therefore counts 10 games + 6 practice modes + `cards`.
2. **Four music rows added**, covering `welcomeMusicProfile`, the fixed per-game
   assignment, `SPEECH_VIEWS`, and crossfade timings.
3. **Defects D2-D13 added** to section 15, which previously held only D1 and
   five tooling nits.
4. **The `celebrate()` row was narrowed** to its single real call site.

### Documentation drift found

The significant one: **the home screen never plays the `home` music track.**
`resolveMusicState()` falls through to `welcomeMusicProfile`, which is one random
pick per session from the eight *gameplay* tracks (2008-2017). The `home` key is
reachable only via the `rewardScreen` pseudo-state. The key name invites exactly
the wrong implementation, and a port that "obviously" plays `home` on the home
screen would be wrong in a way no test would catch.

The other eight drift items are tabulated in audit section 17, including a stale
line in this phase's own plan, which says "230 files" and "23 views x 10
viewports" under *Files to be created* while its own screenshot manifest
correctly specifies 250 from 25 names.

### New defects found

Fourteen in total, in audit section 18. The ones that matter:

- **D1 (high)** — `tools/prepare_www.js` does not copy `audio-manager.js` into
  `www/`, so every Capacitor build ships an app with no audio runtime:
  `window.AudioManager` is undefined and the `<script>` tag 404s. `sw.js`
  precaches a path that is not in the bundle either. This was known going in and
  is now confirmed by reading the copy list.
- **D8 (medium)** — the `count` game writes neither `learned` nor `stats`. It is
  the only game that contributes nothing to progress.
- **D13 (medium)** — `celebrate()` is documented in a code comment as firing on
  every 10th word learned "anywhere", but its only call site is the category
  word-tile handler. Reaching a multiple of ten inside a game or practice mode
  produces no celebration, and no later tile tap will produce one either, because
  the total has already moved past the boundary.
- **D5 (medium)** — storage write failures are silent everywhere except
  recording, so progress can be lost with no signal to the parent.
- **D3 (medium)** — every AdMob id on all three platforms is a Google test id.

Per the phase contract, none were fixed.

### Determinism

The first two capture runs differed in 9 of 250 files. Two distinct causes, both
now fixed rather than tolerated:

- Eight were sub-0.2%-of-pixels anti-aliasing differences on art-heavy views,
  caused by Chromium's threaded, progressively-refined image rasterisation.
  Fixed by waiting on `document.fonts.ready` and every image's load, then two
  animation frames, and by pinning thirteen Chromium rendering flags including
  `--disable-checker-imaging` and `--disable-partial-raster`.
- One was a genuine content difference: the Hebrew-TTS-unavailable toast,
  described under deviations.

After both fixes, two consecutive full runs produced 250 byte-identical files,
compared by md5.

## Risks carried into the next phase

- **The 49 MB screenshot set** should be optimised in Phase 1 once
  devDependencies can change.
- **`test_suite.py` and `interaction_suite.py` are the real parity oracle**, and
  they are richer than the checklist. Phase 1's Tier 2 helpers must genuinely
  port `auditTouchTargets`, `countListeners`, `speechSpy` and `degradeNativeApis`
  rather than reimplement something weaker, or later phases will pass a lower bar
  than the legacy app already clears.
- **Python 3.14 has no `playwright` wheel issue here**, but the suites were run
  from a `/tmp` virtualenv rather than the system interpreter. Anyone reproducing
  this needs the same setup; CI uses Python 3.12 and installs it directly.
- **D1 remains unfixed** by design. Until it is, no Capacitor build of the legacy
  app has working audio, which means any "compare against the native legacy app"
  check during the migration must use the PWA, not a Capacitor build.

## Commands to reproduce

```bash
# Serve the legacy app (already running on 8000 in this environment)
node tools/dev-server.js &

# Legacy unit tests
node --test tests/audio-logic.test.js

# Legacy Playwright suites (CI uses Python 3.12 and installs playwright directly)
python3 -m venv /tmp/talki-venv
/tmp/talki-venv/bin/pip install playwright
/tmp/talki-venv/bin/python -m playwright install chromium
BASE_URL=http://127.0.0.1:8000 /tmp/talki-venv/bin/python tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 /tmp/talki-venv/bin/python tests/interaction_suite.py

# Capture the legacy baseline (250 files, ~90s)
node tools/capture-legacy-baseline.mjs

# Verify determinism
node tools/capture-legacy-baseline.mjs --out=/tmp/baseline-rerun
cd docs/migration/screenshots/legacy-baseline && md5sum *.png | sort -k2 > /tmp/a.txt
cd /tmp/baseline-rerun && md5sum *.png | sort -k2 > /tmp/b.txt
join -j 2 /tmp/a.txt /tmp/b.txt -o 0,1.1,2.1 | awk '$2!=$3{print $1}'   # expect no output
```
