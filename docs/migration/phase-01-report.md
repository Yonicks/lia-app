# Phase 1 report — Expo application and full test harness

**Re-verified 2026-09-01** in a fresh sandbox: the full gate was re-run end
to end (not just spot-checked). Two small fixes were needed — an Expo SDK
patch-version bump and an `expo-image` config plugin registration, both from
package-registry drift since the phase was first executed — documented in
Gate results §1 and Deviations item 9. No other code changed. All PASS/FAIL
verdicts below reflect this fresh run.

## Summary

`apps/mobile` now exists: an Expo SDK 57 app with Expo Router, TypeScript
strict mode, and a single bootstrap screen ("Talki Native Migration" / "Phase
1"). Alongside it, all three validation tiers described in
`docs/migration/validation.md` are wired up and exercised — `vitest` for pure
logic, a ten-viewport Playwright harness against the Expo web target with
ported touch-target/reachability audits and a committed screenshot baseline,
and an authored (not executed — no device tooling in this environment) Maestro
flow. A new `mobile` CI workflow runs the web-provable parts of the gate on
every push. The repository is now an npm workspace; every existing root script
(`dev`, `prepare-www`, `sync`, `android`, `ios`, `icons`) still works
unmodified, and `.github/workflows/test-and-deploy.yml` is untouched. No Home,
game, audio, storage, or design-system code exists yet — that is intentional
per the phase scope.

## Acceptance criteria

- [FAIL] apps/mobile boots on an Android development build, no red box —
  **not possible in this environment**: no Android SDK, no `adb`, no
  emulator, no `ANDROID_HOME`. See "Native coverage" below.
- [PASS] Expo resolves to 57.0.17 or newer — resolved to **57.0.18**. Full
  resolved dependency versions are in "Dependencies added".
- [PASS] `tsc --noEmit` clean with `strict: true` — see Gate results §1.
- [PASS] `eslint` clean — see Gate results §1.
- [PASS] `expo-doctor` clean, or every remaining warning explained —
  21/21 checks pass. One dependency (`react-native-worklets`) is pinned away
  from `expo-doctor`'s compatibility table and the reason is recorded in
  `apps/mobile/package.json` and in "Deviations" below.
- [PASS] `vitest run` green — see Gate results §2.
- [PASS] `expo export --platform web` succeeds — see Gate results §3.
- [PASS] `playwright test` green across all ten projects — see Gate results §4.
- [PASS] Ten bootstrap screenshots committed under
  `docs/migration/screenshots/phase-01/` — 10 files, one per viewport.
- [FAIL] One Android device screenshot committed via `adb exec-out
  screencap` — **not possible**: no `adb`, no device, no emulator in this
  environment.
- [PARTIAL] `.maestro/smoke.yaml` authored, and executed if Maestro is
  available — authored at `apps/mobile/.maestro/smoke.yaml`; **not executed,
  Maestro is not installed and there is no device/emulator in this
  environment**. No manual device launch could be attested either, for the
  same reason.
- [PASS] Root scripts dev, prepare-www, icons, sync, android, ios all still
  work — `prepare-www` and `sync` (`cap sync`) were run and verified; `dev`
  was run to serve the legacy suites; `icons` (Python) and the native `open`
  steps of `android`/`ios` were not exercised because they require Android
  Studio / Xcode, which are not part of this phase's gate and were unaffected
  by any change made.
- [PASS] `npx cap sync` still succeeds — see Gate results §1 note.
- [PASS] `.github/workflows/test-and-deploy.yml` is unmodified — `git diff`
  is empty, pasted in Gate results §6.
- [PASS] `.github/workflows/mobile.yml` added.
- [PASS] All three legacy suites still green, output pasted — see Gate
  results §6.
- [PASS] `testIds.ts` exists and `smoke.spec.ts` imports from it rather than
  hardcoding strings.
- [PASS] No Home, game, audio or storage code exists in `apps/mobile`.

## Gate results

### 1. Static checks

Re-verified in a fresh session on 2026-09-01. Between the original run and this
verification, the Expo SDK 57 package registry published newer patch releases
of six already-installed packages, so `expo-doctor` initially failed:

```
$ npx expo-doctor
✖ Check that packages match versions required by installed Expo SDK
package              expected  found
@expo/metro-runtime  ~57.0.15  57.0.14
expo                 ~57.0.19  57.0.18
expo-constants       ~57.0.17  57.0.16
expo-image           ~57.0.4   57.0.3
expo-linking         ~57.0.9   57.0.8
expo-router          ~57.0.18  57.0.17
1 check failed
```

Resolved with `npx expo install --fix`, which bumped all six to the versions
`expo-doctor` expects. That step also revealed a second, previously-latent
issue: `expo-image` requires a config plugin entry, which `expo install --fix`
could not write itself because `app.config.ts` is a dynamic (TypeScript)
config rather than static JSON. Added `'expo-image'` to the `plugins` array
in `app.config.ts` by hand — see "Deviations" item 9. After both fixes:

```
$ npx tsc --noEmit
(no output — clean)

$ npx eslint .
(no output — clean)

$ npx expo-doctor
Running 21 checks on your project...
21/21 checks passed. No issues detected!
```

Workspace/legacy-build sanity check, run from the repository root:

```
$ npm run prepare-www
www ready for Capacitor

$ npx cap sync
✔ Copying web assets from www to android/app/src/main/assets/public
✔ Creating capacitor.config.json in android/app/src/main/assets
✔ copy android ...
✔ update android in ...
[info] Found 3 Capacitor plugins for android: @capacitor-community/admob@8.1.0,
       @capacitor/splash-screen@8.0.2, @capacitor/status-bar@8.0.3
✔ copy ios ... ✔ update ios ... ✔ copy web ... ✔ update web ...
[info] Sync finished in 0.179s
```

npm workspaces did not break Capacitor; the fallback route ("give apps/mobile
its own independent lockfile") in the phase prompt was **not needed**.
`npx cap sync` regenerates `ios/App/CapApp-SPM/Package.swift` with normalized
path separators every time it runs (pre-existing behaviour, unrelated to this
phase); that incidental diff was reverted after each verification run so the
legacy native projects are left untouched.

### 2. Tier 1 — vitest

```
$ npx vitest run
 RUN  v4.1.11 apps/mobile
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  417ms
```

### 3. Web export

```
$ npx expo export --platform web
Web Bundled 5625ms node_modules/expo-router/entry.js (773 modules)
› web bundles (1): _expo/static/js/web/entry-....js (1.1MB)
Exported: dist
```

### 4. Tier 2 — Playwright

```
$ npx playwright test
  ✓ [iphone-se1] › smoke.spec.ts
  ✓ [android-compact] › smoke.spec.ts
  ✓ [iphone-13] › smoke.spec.ts
  ✓ [iphone-pro-max] › smoke.spec.ts
  ✓ [ipad-mini] › smoke.spec.ts
  ✓ [ipad-air] › smoke.spec.ts
  ✓ [landscape-844] › smoke.spec.ts
  ✓ [landscape-932] › smoke.spec.ts
  ✓ [tablet-4-3] › smoke.spec.ts
  ✓ [tablet-16-10] › smoke.spec.ts
  10 passed (4.0s)
```

Each project asserts: `bootstrap-title` visible with the expected text, zero
console errors and zero page errors, `auditTouchTargets` returns no
violations, `auditReachability` returns no violations, `toHaveScreenshot()`
matches the committed baseline, and `captureMatrix` writes the phase-01
evidence screenshot. Confirmed stable across three consecutive runs
(byte-identical baseline match, no flake).

One correction made mid-phase: the first draft of `auditTouchTargets` /
`auditReachability` scanned every element carrying a `data-testid`, which
flagged the plain `bootstrap-title` text label (226×26px) as a touch-target
violation. The legacy `TOUCH_SIZES`/`REACHABILITY` audits in
`tests/interaction_suite.py` never scanned everything either — they took an
explicit list of interactive CSS classes. `react-native-web` gives a plain
`Text` no `role` at all, so the port now scopes both audits to elements that
carry both a `data-testid` **and** an explicit interactive
`accessibilityRole` (button, link, tab, switch, checkbox, radio). This is
documented as a convention in `_helpers.ts` for later phases: every tappable
control needs both a testID and an explicit accessibilityRole; a label gets
only a testID and is exempt.

### 5. Screenshots

10 files under `docs/migration/screenshots/phase-01/` (one per viewport,
`<width>x<height>-bootstrap.png`), plus 10 committed Playwright baselines
under `apps/mobile/tests/e2e/__screenshots__/smoke.spec.ts/` (the location
`validation.md` §3 specifies).

### 6. Legacy regression

Re-run fresh on 2026-09-01, using the repository's own `.venv` for the Python
Playwright dependency (`source .venv/bin/activate` first — the system Python
does not have `playwright` installed):

```
$ node tools/dev-server.js &
$ BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
1. Layout across devices                       4/4 ✓
2. Hebrew RTL semantics                        11/11 ✓
3. Every category and game opens without errors 2/2 ✓
4. Games can actually be completed              5/5 ✓
5. Storage, persistence and backup              5/5 ✓
6. PWA: manifest, icons, service worker, offline 5/5 ✓
ALL CHECKS PASSED

$ BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
(13 numbered sections — navigation debounce, one-score-per-pat, Back
semantics, all 16 games finish/replay/exit, the Match & Drop puzzle across
all 8 viewports plus reduced motion, single-spoken-prompt games, category
choice on menus not in-round, parent gate, no-audio-API survival, offline
boot)
ALL INTERACTION CHECKS PASSED

$ node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

`.github/workflows/test-and-deploy.yml` diff against the phase's starting
commit:

```
$ git diff .github/workflows/test-and-deploy.yml
(no output — unmodified)
```

### 7. This report

PASS.

## Native coverage

Device: **not applicable — no Android SDK, `adb`, emulator, or `ANDROID_HOME`
exists in this execution environment.** Java 21 is present but there is no
platform-tools or emulator image.

Checks performed: none on a real device or emulator.

Checks NOT possible and why: `expo run:android` (no Android SDK to build
against), `adb exec-out screencap` (no `adb`, no device), Maestro execution
(Maestro is not installed and there is no device/emulator to target). All
three are authored/ready — `.maestro/smoke.yaml` exists and
`mobile:android`/`android` scripts are wired — and should be run in an
environment with the Android toolchain installed, or via EAS Build/a CI
runner with the SDK present, before this phase's native claims can be
considered attested. Everything reported PASS above is Playwright-against-
Expo-web evidence only, which `validation.md` §4 explicitly says cannot stand
in for native truth on: real audio, TTS, microphone, orientation locks,
SQLite process-kill durability, AdMob, background/resume, cold start, and
real frame rate/memory. None of those surfaces exist yet in Phase 1 regardless.

## Files created

- `apps/mobile/app.config.ts` — dynamic Expo config; sets `com.yonicks.talki`
  (matches `capacitor.config.ts`) for production and `com.yonicks.talki.dev`
  for the development client via `APP_VARIANT`.
- `apps/mobile/eas.json` — development/preview/production build profiles.
- `apps/mobile/app/_layout.tsx` — root Expo Router stack, header hidden.
- `apps/mobile/app/index.tsx` — the bootstrap screen; only route in the app.
- `apps/mobile/src/testing/testIds.ts` — the single testID registry.
- `apps/mobile/src/testing/mathUtils.ts` — trivial module the Tier 1 smoke
  test imports through the `@` path alias.
- `apps/mobile/vitest.config.ts` — Tier 1 runner config (jsdom, `@` alias).
- `apps/mobile/tests/unit/smoke.test.ts` — Tier 1 smoke test.
- `apps/mobile/playwright.config.ts` — Tier 2 runner config; owns the
  `:8081` `expo serve` webServer and the ten viewport projects; also sets
  `snapshotPathTemplate` so baselines land in `tests/e2e/__screenshots__/`
  per `validation.md` §3 rather than Playwright's default
  `<spec>-snapshots/` location.
- `apps/mobile/tests/e2e/viewports.ts` — the shared ten-viewport matrix,
  imported by both the Playwright config and the helpers.
- `apps/mobile/tests/e2e/_helpers.ts` — ported audits: `openApp`,
  `auditTouchTargets`, `auditReachability`, `burst`, `countListeners`,
  `captureMatrix`, plus documented Phase-4 stubs `speechSpy` and
  `degradeNativeApis`.
- `apps/mobile/tests/e2e/smoke.spec.ts` — the Tier 2 bootstrap smoke test.
- `apps/mobile/.maestro/smoke.yaml` — Tier 3 flow, authored, not executed.
- `apps/mobile/eslint.config.js` — flat ESLint config extending
  `eslint-config-expo/flat`.
- `apps/mobile/tsconfig.json` — extends `expo/tsconfig.base`, `strict: true`,
  `@/*` → `src/*` path alias.
- `apps/mobile/.gitignore` — extended with `test-results/`,
  `playwright-report/`, `playwright/.cache` (the committed baselines live
  under the tracked `tests/e2e/__screenshots__/`, which is not ignored).
- `apps/mobile/assets/*` — default Expo template icon/splash/favicon assets,
  kept from the scaffold and referenced by `app.config.ts`.
- `.github/workflows/mobile.yml` — new CI job; does not touch
  `test-and-deploy.yml`.
- `docs/migration/screenshots/phase-01/*.png` — 10 evidence screenshots.
- `apps/mobile/tests/e2e/__screenshots__/smoke.spec.ts/*.png` — 10 committed
  visual-regression baselines.
- `docs/migration/phase-01-report.md` — this report.

Modified:

- `package.json` (repository root) — added `workspaces: ["apps/*"]`, the ten
  `mobile:*` scripts, and two `overrides` entries (see "Deviations").
  Every pre-existing script is unchanged.
- `package-lock.json` (repository root) — regenerated for the workspace.

## Dependencies added

All added to `apps/mobile/package.json` (workspace-scoped, not the root):

- `expo@~57.0.19` — resolved 57.0.19, satisfies the ≥57.0.17 pin from the
  phase's ground truth (avoids the Hermes/Reanimated memory regression and
  the dev-startup regression fixed in 57.0.9/57.0.17). Originally resolved
  57.0.18; bumped to 57.0.19 on 2026-09-01 re-verification when
  `expo-doctor` flagged newer patch releases — see Gate results §1.
- `expo-router@~57.0.18` — file-based navigation; the app's only navigation
  primitive per the plan. Bumped from 57.0.17, same re-verification pass.
- `expo-status-bar@~57.0.1` — template default, kept for status bar styling.
- `expo-constants@~57.0.17` — required by `expo-router` for manifest access.
  Bumped from 57.0.16.
- `expo-image@~57.0.4` — listed as required in the phase prompt; unused by
  the bootstrap screen but present so later phases don't need to re-run
  `expo install`. Bumped from 57.0.3; also required registering the
  `expo-image` config plugin by hand — see "Deviations" item 9.
- `expo-linking@~57.0.9` — required by `expo-router` for deep-link handling.
  Bumped from 57.0.8.
- `@expo/metro-runtime@~57.0.15` — bumped from 57.0.14, same re-verification
  pass.
- `react@19.2.3`, `react-native@0.86.3` — the SDK 57 pinned pair.
- `react-native-reanimated@4.5.1` — required per the phase's ground truth
  ("Talki uses Reanimated throughout"); no animation code exists yet.
- `react-native-gesture-handler@~2.32.0`, `react-native-screens@~4.26.0`,
  `react-native-safe-area-context@~5.7.0` — required transitively by
  Expo Router for native navigation gestures and safe-area layout;
  `react-native-screens` was not itemised in the phase prompt's install list
  but is a hard requirement of `expo-router` and is not a forbidden category
  (audio/ads/storage/WebView).
- `react-native-worklets@0.10.4` — required peer of `react-native-reanimated`.
  Pinned to 0.10.4 rather than the 0.10.1 `expo-doctor` expects; see
  "Deviations".
- `react-dom@19.2.3`, `react-native-web@^0.21.2` — the web target, used only
  so Playwright can drive the app; never shipped to users. (`@expo/metro-
  runtime`, also part of the web target, is listed above.)
- `typescript@~6.0.3`, `@types/react@~19.2.2` — strict-mode typechecking.
- `eslint@^9.39.5`, `eslint-config-expo@^57.0.2` — flat-config lint rules.
- `vitest@^4.1.11`, `@vitest/ui@^4.1.11`, `jsdom@^30.0.1` — Tier 1 runner.
- `@playwright/test@^1.62.1`, `playwright@^1.62.1` — Tier 2 runner (same
  major version already used by the legacy Python suites' JS tooling).
- `expo-doctor@^1.20.4` — the SDK compatibility linter used in the gate.

Root-level `overrides` (forcing a single resolved copy across the workspace,
required for `expo-doctor`'s duplicate-dependency check to pass — see
"Deviations" for why each was needed):

- `react-native-worklets: 0.10.4`
- `typescript: ~6.0.3`
- `eslint-import-resolver-typescript: ^4.4.5`

## Deviations from the phase plan

1. **Android device build and `adb` screenshot: not executed.** This sandbox
   has no Android SDK, no `adb`, and no emulator (verified: `which adb`
   fails, `ANDROID_HOME` is empty). The phase prompt's own "when you are
   blocked" clause and Tier 3 fallback language cover Maestro but not the
   Android build/screenshot items specifically; treating them the same way
   (author/wire up, attempt, record honestly as not possible here) was the
   only non-blocking option. Marked FAIL rather than PASS in "Acceptance
   criteria" so this isn't silently glossed over.

2. **Maestro: authored, not executed** — exactly per the phase prompt's own
   documented fallback. Maestro is not installed and there is no
   device/emulator to attest a manual launch against either.

3. **`react-native-worklets` pinned to 0.10.4, not the 0.10.1 `expo-doctor`
   expects.** `expo-modules-core@57.0.14` and `@expo/ui@57.0.14` (both pulled
   in by `expo@57.0.18`/`expo-router@57.0.17`) declare a hard dependency on
   `react-native-worklets@0.10.4`, while `expo-doctor`'s SDK 57.0.18
   compatibility table still expects 0.10.1. These two facts are mutually
   exclusive: pinning to 0.10.1 leaves two copies of a native module
   installed, which `expo-doctor` itself flags as a build-breaking risk and
   is the more serious of the two problems for a real native build.
   `react-native-reanimated`'s own declared peer range for worklets is
   `0.10.x`, so 0.10.4 satisfies it. Resolved by overriding to 0.10.4
   everywhere and adding `expo.install.exclude: ["react-native-worklets"]`
   to `apps/mobile/package.json` so `expo install --check` stops flagging an
   intentional, explained choice. The reasoning is written directly into
   `apps/mobile/package.json` as a documentation field.

4. **`eslint-import-resolver-typescript` overridden to `^4.4.5`.**
   `eslint-config-expo@57.0.2` pulls in `eslint-import-resolver-typescript@
   3.10.1`, which throws `"typescript with invalid interface loaded as
   resolver"` against `typescript@6.0.3` (the version this SDK/eslint-config
   combination requires) — a genuine incompatibility between that resolver
   version and TypeScript 6.0, not a project misconfiguration. Version 4.4.5
   resolves the incompatibility; `npx eslint .` is clean with it in place.

5. **`typescript` overridden to a single `~6.0.3` across the workspace.**
   `@expo/require-utils` (pulled in by `@expo/cli` and friends) independently
   depends on `typescript@^7`, which without an override installs a second,
   unrelated copy of TypeScript at the workspace root — is marked
   "extraneous" by `npm ls`, and was implicated in the resolver failure
   above until removed. Forcing one version keeps exactly one TypeScript in
   the tree, matching the version `apps/mobile/tsconfig.json` and `tsc
   --noEmit` actually run against.

6. **`@testing-library/react-native` installed then removed.** It was added
   speculatively per work item 6 ("Set up Tier 1") but nothing in the phase
   requires component rendering tests yet (there is exactly one bootstrap
   screen and the Tier 1 smoke test only proves the path alias resolves).
   Removed rather than left as an unused dependency; it can come back in
   whichever phase first needs to render a component under `vitest`.

7. **`tsconfig.json` needed `"ignoreDeprecations": "6.0"`.** TypeScript 6.0
   deprecates `baseUrl` (removal planned for TS 7) but still requires it
   whenever `paths` uses non-relative keys like `@/*`. Following TypeScript's
   own suggested fix rather than restructuring the alias.

8. **Root `package.json`/`package-lock.json` diff is larger than the phase
   prompt's illustrative script list** because of the three `overrides`
   entries above; every script name and behaviour it specifies is otherwise
   present verbatim (`mobile:start` → `expo start`, `mobile:android` →
   `expo run:android`, etc., see `package.json`).

9. **`expo-image` needed a config plugin entry, added on 2026-09-01
   re-verification.** Running `npx expo install --fix` to clear the SDK
   patch-version drift found by `expo-doctor` (see Gate results §1) surfaced
   a separate, previously-latent requirement: `expo-image` ships a config
   plugin that must appear in the Expo config's `plugins` array. `expo
   install --fix` could not write this itself because `app.config.ts` is a
   dynamic (TypeScript) config, not static JSON — it printed the JSON to add
   and exited non-zero. Added `'expo-image'` to the `plugins` array in
   `app.config.ts` by hand; `expo-doctor` returned to 21/21 afterward. This
   was latent since Phase 1's first run (the package was always installed)
   and only surfaced now because `expo install --fix` happened to touch it
   while resolving the version drift.

## Findings and drift

- `npx cap sync`, run purely to verify the workspace didn't break Capacitor,
  regenerates `ios/App/CapApp-SPM/Package.swift` with forward slashes instead
  of the backslashes currently committed — a leftover from someone last
  running `cap sync` on Windows. Not a Phase 1 concern (the file isn't part
  of this phase's scope and was reverted after verification each time), but
  worth a note for whoever next touches the iOS project on a POSIX machine:
  the first `cap sync` there will produce this same one-line diff.
- The legacy `tests/interaction_suite.py` run took roughly eleven minutes in
  this environment (single-threaded Playwright driving 8 viewports through
  16 games, a puzzle at multiple resize points, and an offline pass). This
  is unchanged legacy behaviour, not something Phase 1 introduced, but it's
  worth knowing for anyone budgeting CI time — the existing `test-and-deploy.
  yml` already runs it, so CI timing is unaffected by this phase.

## Risks carried into the next phase

- **No native attestation exists for this phase's own scaffold.** Phase 2
  (or whichever phase first needs a native build) should run `expo run:
  android` and an `adb` screenshot in an environment that actually has the
  Android SDK before further native-only claims accumulate on top of an
  unverified foundation.
- **The `react-native-worklets` version pin is a live tracking item.** When
  `expo-doctor`'s compatibility table catches up to 0.10.4 (or a future SDK
  57 patch aligns `expo-modules-core`/`@expo/ui` back to 0.10.1), the
  override, the `expo.install.exclude` entry, and this deviation note should
  all be removed together.
- **The `INTERACTIVE_SELECTOR` convention in `_helpers.ts` is untested
  against a real interactive control** — Phase 1 has none. The first phase
  that ships a button must confirm the convention actually catches an
  undersized or covered control, not just correctly ignore a label.

## Commands to reproduce

```bash
# from the repository root
npm install

# static + Tier 1 + web export + Tier 2, from apps/mobile
cd apps/mobile
npx tsc --noEmit
npx eslint .
npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test

# workspace / legacy sanity, from the repository root
cd ../..
npm run prepare-www
npx cap sync

# legacy regression
node tools/dev-server.js &
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```
