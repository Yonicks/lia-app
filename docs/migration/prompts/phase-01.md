# Phase 1 prompt — Expo application and full test harness

Plan: [../phases/phase-01-plan.md](../phases/phase-01-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 1 of the Talki migration to Expo React Native.

Phase 1 creates the native application skeleton AND the complete three-tier test
harness that every later phase depends on. It ships one bootstrap screen and no
product features. That is intentional.

Execute ONLY Phase 1. Do not build Home, games, audio, storage or the design
system.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
  Where a document and the code disagree, the code wins and you record the drift.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename, restructure or refactor index.html, audio-manager.js,
  assets/, tools/, tests/, android/, ios/, capacitor.config.ts or manifest.json.
- Do not remove Capacitor. Do not modify the existing npm scripts.
- Do not edit .github/workflows/test-and-deploy.yml.
- Do not edit legacy source to make a new test pass.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- apps/mobile enables the Expo web target so Playwright can drive the app.
- It is never shipped to users and never replaces the PWA.
- Do not make a single design, layout or architecture decision for the benefit
  of the browser. If something can only work on web, it is wrong.
- Do not use react-native-web-specific APIs in application code.

FORBIDDEN
- No WebView wrapping of the legacy app.
- No NativeWind.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- If you finish early, deepen the tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-01-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
- State plainly which findings are web-only and not proof of native behaviour.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-01-plan.md   — your plan, read it fully
2. docs/migration/validation.md             — the harness contract you implement
3. docs/migration/phase-00-report.md        — the previous phase
4. package.json                             — the root scripts you must not break
5. capacitor.config.ts                      — the production app id
6. tests/interaction_suite.py               — the audits you are porting: DEVICES,
                                              MIN_TOUCH, REACHABILITY, TOUCH_SIZES,
                                              burst(), listener counting

GROUND TRUTH
- Expo SDK 57, React Native 0.86.3, React 19.2.3, Node >= 22.13.
- Pin expo to >= 57.0.17. Earlier 57 releases carry a Hermes v1 memory
  regression affecting any app importing Reanimated (fixed 57.0.9) and a dev
  startup regression (fixed 57.0.17). Talki uses Reanimated throughout.
- Production app id: com.yonicks.talki   (from capacitor.config.ts)
- Development app id: com.yonicks.talki.dev
- Legacy dev server port: 8000. Expo web port: 8081. They must not be confused.
- The ten Playwright viewports:
    320x568   iphone-se1
    360x800   android-compact
    390x844   iphone-13
    430x932   iphone-pro-max
    768x1024  ipad-mini
    834x1112  ipad-air
    844x390   landscape-844
    932x430   landscape-932
    1024x768  tablet-4-3
    1280x800  tablet-16-10
  The first eight are copied verbatim from DEVICES in tests/interaction_suite.py
  so mobile results stay comparable with legacy. The last two are new because
  games will be landscape.
- MIN_TOUCH = 48, matching tests/interaction_suite.py.

WORK ITEMS

1. Create apps/mobile as an Expo SDK 57 app with Expo Router and TypeScript
   strict mode.

   Install: expo (>=57.0.17), expo-router, react-native-reanimated,
   react-native-gesture-handler, react-native-safe-area-context, expo-image,
   plus the web target: react-dom, react-native-web, @expo/metro-runtime.
   Use `npx expo install` so versions align with the SDK.

   Do NOT install: NativeWind, any WebView package, any audio, speech, storage
   or ads package. Those belong to later phases.

2. Configure the root package.json for npm workspaces including apps/mobile,
   and add scripts. Every existing root script must keep working unchanged.

     "mobile:start"      expo start
     "mobile:android"    expo run:android
     "mobile:ios"        expo run:ios
     "mobile:web"        expo start --web
     "mobile:export"     expo export --platform web
     "mobile:typecheck"  tsc --noEmit
     "mobile:lint"       eslint .
     "mobile:test"       vitest run
     "mobile:e2e"        playwright test
     "mobile:doctor"     expo-doctor

   After this, verify by running: npm run prepare-www, then npx cap sync.
   If Capacitor breaks, remove workspaces and give apps/mobile its own
   independent lockfile instead. Record which route you took.

3. Configure app.config.ts with the two identifiers, and eas.json with
   development, preview and production profiles. Only development is used now.

4. Build the bootstrap screen: apps/mobile/app/index.tsx renders the text
   "Talki Native Migration" and "Phase 1", centred, inside a SafeAreaView.
   Nothing else. No Talki branding, no assets, no navigation.

5. Create apps/mobile/src/testing/testIds.ts as the single registry of test
   identifiers. Export a const object. Add:
     bootstrap.root  = 'bootstrap-root'
     bootstrap.title = 'bootstrap-title'
   Apply them as testID props. Later phases extend this file; specs must import
   from it and never hardcode an identifier string.

6. Set up Tier 1: vitest.config.ts and apps/mobile/tests/unit/smoke.test.ts.
   The smoke test proves vitest resolves TypeScript and path aliases. Keep it
   trivial; its job is to prove the runner works before Phase 2 depends on it.

7. Set up Tier 2: apps/mobile/playwright.config.ts with ten projects, one per
   viewport above. Projects narrower than 900px set hasTouch and isMobile true.

   The config owns the server:
     webServer: {
       command: 'npx expo serve --port 8081',
       url: 'http://localhost:8081',
       reuseExistingServer: !process.env.CI,
       timeout: 120000,
     }
   The port appears exactly once, in this file. Do not inline it in a spec.

8. Write apps/mobile/tests/e2e/_helpers.ts. Port the audits from
   tests/interaction_suite.py. Export at minimum:

     VIEWPORTS            the ten specs, shared with playwright.config.ts
     openApp(page, opts)  navigate, skip intro, wait for interactive
     auditTouchTargets(page, minSize = 48)
                          every element with a child-facing testID must measure
                          at least 48x48 INCLUDING ::before/::after padding,
                          exactly as TOUCH_SIZES does in the legacy suite.
                          Return a violation list; do not throw.
     auditReachability(page)
                          scroll each interactive control to centre, hit-test
                          with elementFromPoint, fail if covered. Mirrors
                          REACHABILITY in the legacy suite. Return a list.
     burst(page, testId, n)
                          n synchronous clicks with no delay, for rapid-tap tests
     countListeners(page, testId)
                          wrap addEventListener to detect handler growth
                          across re-renders
     captureMatrix(page, phase, name)
                          write docs/migration/screenshots/phase-<phase>/
                          <project>-<name>.png and return the path

   Two helpers are stubbed now and filled in when the services they spy on
   exist: speechSpy(page) in Phase 4, degradeNativeApis(page) in Phase 4.
   Export them as documented no-ops with a TODO naming the phase.

9. Write apps/mobile/tests/e2e/smoke.spec.ts. Across all ten projects:
     - bootstrap-title is visible
     - zero console errors and zero page errors during load
     - auditTouchTargets returns no violations
     - auditReachability returns no violations
     - expect(page).toHaveScreenshot() establishes the baseline
     - captureMatrix(page, '01', 'bootstrap')

10. Set up Tier 3: apps/mobile/.maestro/smoke.yaml — launch
    com.yonicks.talki.dev, assert the title, take a screenshot.
    If Maestro is not installed, still author the flow, record Tier 3 as
    "authored, not executed, Maestro not installed", and attest the manual
    device launch instead. Do not block the phase on it.

11. Add .github/workflows/mobile.yml as a NEW file. Do not touch
    test-and-deploy.yml. The job: Node 22.13+, npm ci, tsc --noEmit, eslint,
    vitest run, expo export --platform web, playwright test. Upload the
    Playwright HTML report and docs/migration/screenshots/phase-01/ as
    artifacts. Maestro does not run in CI.

12. Run the full gate and paste every result into the report:
      cd apps/mobile
      npx tsc --noEmit
      npx eslint .
      npx expo-doctor
      npx vitest run
      npx expo export --platform web
      npx playwright test
      npx expo run:android          # attest the device build by hand
    Then the legacy regression from the repository root:
      node tools/dev-server.js &
      BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
      BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
      node --test tests/audio-logic.test.js

DO NOT
- Do not implement Home, categories, games, practice, audio, TTS, recording,
  storage, the design system or the intro sequence.
- Do not port any CSS or any colour token. Phase 5 owns that.
- Do not move the legacy app into apps/web.
- Do not add an ads, audio, speech or SQLite dependency.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] apps/mobile boots on an Android development build, no red box
- [ ] Expo resolves to 57.0.17 or newer; paste the resolved dependency versions
- [ ] tsc --noEmit clean with strict: true
- [ ] eslint clean
- [ ] expo-doctor clean, or every remaining warning explained
- [ ] vitest run green
- [ ] expo export --platform web succeeds
- [ ] playwright test green across all ten projects
- [ ] Ten bootstrap screenshots committed under
      docs/migration/screenshots/phase-01/
- [ ] One Android device screenshot committed via adb exec-out screencap
- [ ] .maestro/smoke.yaml authored, and executed if Maestro is available
- [ ] Root scripts dev, prepare-www, icons, sync, android, ios all still work
- [ ] npx cap sync still succeeds
- [ ] .github/workflows/test-and-deploy.yml is unmodified (show git diff)
- [ ] .github/workflows/mobile.yml added
- [ ] All three legacy suites still green, output pasted
- [ ] testIds.ts exists and smoke.spec.ts imports from it rather than
      hardcoding strings
- [ ] No Home, game, audio or storage code exists in apps/mobile

REPORT
Write docs/migration/phase-01-report.md using the headings in
docs/migration/validation.md section 7. Name the Android device and OS version
in the native-coverage section. List every dependency added with its resolved
version and one line on why it is needed.

Then stop. Do not begin Phase 2.
````
