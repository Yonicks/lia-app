# Phase 1 — Create the Expo application and the full test harness

**Prompt:** [../prompts/phase-01.md](../prompts/phase-01.md)
**Creates:** `apps/mobile/`, the three-tier harness, a CI job
**Ships:** one bootstrap screen and nothing else

---

## Goal and rationale

Stand up the native application skeleton and, in the same phase, every piece of
test infrastructure that the following fourteen phases depend on.

The harness belongs here rather than later for a blunt reason: a gate that
arrives in Phase 5 cannot retroactively police Phases 2, 3 and 4. Those are the
phases that define the data model, the storage semantics and the audio
contract — the ones where a silent mistake is most expensive and least visible.
By the time a UI exists to test, the damage would already be baked in.

So Phase 1 produces almost no product and a great deal of scaffolding. The
screen it ships says "Talki Native Migration — Phase 1" and does nothing. That
is correct.

## Entry conditions

- `docs/migration/phase-00-report.md` exists with no critical FAIL.
- `docs/migration/00-current-state.md` exists.
- `docs/migration/screenshots/legacy-baseline/` is populated.
- Node 22.13 or newer. The machine has v24.19.0, which satisfies this.

## Design decisions

### apps/mobile, and the legacy app stays where it is

The new app lives at `apps/mobile/`. The legacy app does not move into
`apps/web/`.

Moving the legacy app would touch `capacitor.config.ts`, `tools/prepare_www.js`,
the CI workflow, the service worker scope and every relative asset path in
`index.html`, all before a single native screen exists. That is a large
regression surface bought for a tidier tree. The move can happen in Phase 15
when the legacy app is being retired anyway.

npm workspaces are added at the root, but the existing root scripts (`dev`,
`prepare-www`, `icons`, `sync`, `android`, `ios`) keep working unchanged. New
scripts are namespaced `mobile:*`.

### Enable the web target, and say loudly why

`react-dom`, `react-native-web` and `@expo/metro-runtime` are installed so
`npx expo export --platform web` produces a bundle Playwright can drive.

This is the single most consequential decision in the phase, and it is easy to
misread. The web target is a **test surface**. It is never deployed, never
replaces the PWA, and never justifies a design choice. Without it, Tier 2 does
not exist and every UI phase from 5 through 13 falls back to manual inspection
on an emulator, which is slow, unrepeatable, and produces no artifact a
reviewer can look at six weeks later.

The risk is drift: an agent notices something is easier on web and quietly
optimises for it. The mitigation is the standing rules block, which states the
constraint in every single prompt, plus a Phase 14 check that the app has no
web-only code paths in application code.

Rejected alternative: Maestro only. Maestro is excellent for native flows but
gives no viewport matrix, no per-element layout assertions, no touch-target
audit, and comparatively awkward screenshots. It is Tier 3 here, not a
replacement for Tier 2.

### Playwright projects instead of a loop

`@playwright/test` with ten `projects`, one per viewport, rather than a
hand-rolled loop like the legacy Python suites use.

Projects give parallel execution, per-project retries, the trace viewer, an HTML
report, and `toHaveScreenshot` visual baselines keyed per project automatically.
The legacy suites accumulate failures in a list and print them, which works but
produces no artifact and no diff on a visual regression.

The eight legacy viewports are carried over verbatim so results stay comparable
with `tests/interaction_suite.py`. Two landscape tablet sizes are added because
games are landscape in the native app and the legacy matrix has no such size.

### vitest, not jest

`vitest` for Tier 1. It handles TypeScript with no separate transform config,
runs ESM natively, and can `require()` the legacy CommonJS `audio-logic.js`
through interop — which the differential tests need.

### testIds as a module, not string literals

`src/testing/testIds.ts` exports every identifier. Specs import from it.

If specs hardcode `'home-category-animals'` and a component hardcodes the same
string, a rename breaks the test at runtime with a timeout rather than at
compile time with an error. Centralising it turns a flaky failure into a type
error.

### Two application identifiers

`com.yonicks.talki.dev` for development builds, `com.yonicks.talki` for
production. Distinct ids mean the migration build installs alongside the real
Talki on the same device, which matters for side-by-side parity checking in
Phase 14.

### Development builds, not Expo Go

Phase 13 adds `react-native-google-mobile-ads`, which contains native code Expo
Go cannot load. Establishing development builds now avoids a painful switch
later. `eas.json` gets `development`, `preview` and `production` profiles in
this phase even though only `development` is used until Phase 15.

## Files to be created

```
apps/mobile/
├── app/
│   ├── _layout.tsx                   root Stack, providers, font loading
│   └── index.tsx                     the bootstrap screen
├── src/
│   └── testing/
│       └── testIds.ts                the identifier registry
├── tests/
│   ├── unit/
│   │   └── smoke.test.ts             proves vitest runs
│   └── e2e/
│       ├── _helpers.ts               openApp, audits, burst, captureMatrix
│       ├── smoke.spec.ts             bootstrap screen at all 10 viewports
│       └── __screenshots__/          toHaveScreenshot baselines
├── .maestro/
│   └── smoke.yaml                    launch, assert, screenshot
├── app.config.ts
├── eas.json
├── playwright.config.ts
├── vitest.config.ts
├── tsconfig.json                     strict
├── eslint.config.js
├── metro.config.js
└── package.json

.github/workflows/mobile.yml          new job, legacy workflow untouched
package.json                          workspaces + mobile:* scripts (root)
```

## Contracts introduced

`src/testing/testIds.ts`:

```ts
export const testIds = {
  bootstrap: {
    root: 'bootstrap-root',
    title: 'bootstrap-title',
  },
} as const;

export type TestId = typeof testIds;
```

`tests/e2e/_helpers.ts` exposes at minimum:

```ts
export const VIEWPORTS: readonly ViewportSpec[];
export async function openApp(page: Page, opts?: { skipIntro?: boolean }): Promise<void>;
export async function auditTouchTargets(page: Page, minSize?: number): Promise<Violation[]>;
export async function auditReachability(page: Page): Promise<Violation[]>;
export async function burst(page: Page, testId: string, n: number): Promise<void>;
export async function countListeners(page: Page, testId: string): Promise<number>;
export async function captureMatrix(page: Page, phase: string, name: string): Promise<string>;
```

`auditTouchTargets` defaults to 48, matching legacy `MIN_TOUCH`. Both audits
return violation lists rather than throwing, so a spec can report every problem
in one run instead of stopping at the first.

## Behaviour to preserve exactly

- Every existing root npm script still runs and does the same thing.
- `node tools/dev-server.js` still serves the legacy app on 8000.
- `npx cap sync` still works.
- The existing `.github/workflows/test-and-deploy.yml` is not edited. The
  mobile job goes in a new file.
- No file under `assets/` is moved, renamed or converted.

## Deliberate deviations

- The web target is new. It has no legacy equivalent and is test-only.
- `com.yonicks.talki.dev` is new, alongside the unchanged production id.

## Test plan

### Tier 1

`tests/unit/smoke.test.ts` asserts vitest resolves TypeScript and path aliases.
Trivial by design — its job is to prove the runner works before Phase 2 relies
on it.

### Tier 2

`tests/e2e/smoke.spec.ts`, run across all ten projects:

- the bootstrap screen renders and `bootstrap-title` is visible
- no console errors and no page errors during load
- `auditTouchTargets` returns no violations
- `auditReachability` returns no violations
- `toHaveScreenshot()` establishes the baseline
- `captureMatrix(page, '01', 'bootstrap')` writes the evidence screenshot

### Tier 3

`.maestro/smoke.yaml`: launch `com.yonicks.talki.dev`, assert the title is
visible, take a screenshot. Run against an Android emulator or device. The
report names the device.

Additionally verified by hand and attested in the report:

- `npx expo run:android` produces an installable development build
- the app launches without a red box
- it coexists with a production Talki install if one is present

### Legacy regression

All three legacy suites, per `validation.md` section 5.

## Screenshot manifest

```
docs/migration/screenshots/phase-01/
    320x568-bootstrap.png
    360x800-bootstrap.png
    390x844-bootstrap.png
    430x932-bootstrap.png
    768x1024-bootstrap.png
    834x1112-bootstrap.png
    844x390-bootstrap.png
    932x430-bootstrap.png
    1024x768-bootstrap.png
    1280x800-bootstrap.png
    android-device-bootstrap.png      via adb exec-out screencap
```

## Risks and open questions

**Expo version churn.** Pin `expo@>=57.0.17`. Releases before 57.0.9 carry a
Hermes v1 memory regression that affects any app importing Reanimated, and
before 57.0.17 a development startup regression. Talki uses Reanimated
throughout. Default: install with `npx expo install expo@^57.0.17 --fix` and
paste the resolved versions into the report.

**`expo serve` port collision.** The legacy dev server uses 8000; Expo web uses
8081. They do not collide, but CI may run both. Default: keep 8081 and define
it once in `playwright.config.ts`, never inline in a spec.

**Reanimated and the web target.** Reanimated's web support is real but not
identical to native. Default: install it now so the dependency graph is settled,
but do not build an animation in this phase. Phase 6 is the first real exercise,
and if a Reanimated web gap appears there, Tier 2 skips those specs and Tier 3
covers them, with the gap recorded.

**Workspaces and the existing lockfile.** Adding workspaces rewrites
`package-lock.json`. Default: accept it, and verify afterwards that
`npm run prepare-www` and `npx cap sync` still work. If Capacitor breaks, drop
workspaces and give `apps/mobile` its own independent lockfile instead.

**Maestro may not be installed.** Default: if Maestro is unavailable, write
`.maestro/smoke.yaml` anyway, record Tier 3 as "flow authored, not executed,
Maestro not installed", and attest the manual device launch instead. Do not
block the phase on it.

## Exit criteria

- [ ] `apps/mobile/` boots on an Android development build
- [ ] Expo SDK is 57.0.17 or newer, resolved versions pasted into the report
- [ ] `npx tsc --noEmit` clean under `strict: true`
- [ ] `npx eslint .` clean
- [ ] `npx expo-doctor` clean, or every warning explained
- [ ] `npx vitest run` green
- [ ] `npx expo export --platform web` succeeds
- [ ] `npx playwright test` green across all ten projects
- [ ] Ten bootstrap screenshots plus one device screenshot committed
- [ ] `.maestro/smoke.yaml` authored, and executed if Maestro is available
- [ ] Root scripts `dev`, `prepare-www`, `sync`, `android`, `ios` all still work
- [ ] `.github/workflows/test-and-deploy.yml` unmodified
- [ ] `.github/workflows/mobile.yml` added and passing
- [ ] All three legacy suites still green
- [ ] No Home, category, game, audio or storage code exists yet
- [ ] `docs/migration/phase-01-report.md` written
