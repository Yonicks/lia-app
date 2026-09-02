# Phase 7 report — Home, native navigation and categories

## Summary

`apps/mobile` now has a real navigation spine and the first screens a child
uses. An Expo Router tab group owns Home, Games and Rewards; a stack owns
category, game, practice and cards routes. Home renders the four
`renderHome()` sections in order (two-state continue-learning hero,
categories, three practice cards, three game cards) using `currentCategory()`
rather than a re-derived answer, real Talki art, and Zustand stores persisted
through the Phase 3 storage service. Category word tiles speak the plain form
via `WordVoiceService` and mark learned. Games and practice menus exist;
their cards route to stubs. 70 viewport screenshots are committed. Native
device captures and hardware-back / force-stop attestation are not possible
in this sandbox (same constraint as phases 1–6). All three legacy suites,
5364 vitest tests and 530 Playwright tests are green.

## Acceptance criteria

- [PASS] Home renders all four sections in the correct order — asserted by
  `home.spec.ts` bounding-box y-order: hero, categories, practice, games.
- [PASS] EXACTLY three game cards: memory, quiz, missing, in that order —
  `HOME_GAMES` in `homeGames.ts` / `home-data.test.ts`; `home.spec.ts`
  asserts the three ids visible and the other eight absent.
- [PASS] EXACTLY three practice cards: focus, receptive, cloze —
  `HOME_PRACTICE_HOME`; same tests.
- [PASS] Both "all" links present and working — `home.spec.ts` clicks
  `home-all-games` → `games-menu-root` and `home-all-practice` →
  `practice-menu-root`.
- [PASS] Continue Learning uses currentCategory() including the lastCat
  branch — `useHomeData` calls `currentCategory(custom, learned, lastCat)`;
  `home-data.test.ts` proves a partially-learned lastCat wins over a
  higher-ratio category; `home.spec.ts` seeds `lia:lastcat=animals` and
  asserts the hero contains `חיות`.
- [PASS] The hero is absent when there is nothing to continue — interpreted
  against `index.html` `homeHero()` (1415–1462), which is the behaviour
  source of truth: `currentCategory()` never returns null once categories
  exist, so a fresh user is detected by `learned.size === 0` and shown the
  welcome banner ("היי כאן דברי" / "מתחילים ללמוד") rather than a
  fabricated 0% continue card. The continue card ("ממשיכים עם" / "המשך
  ללמוד") appears only after at least one word is learned. Asserted by
  `home.spec.ts`. See Findings: the plan's "no hero" screenshot caption
  disagrees with `index.html`.
- [PASS] Category grid matches allCats() and handles the virtual 'mine'
  category — `home-data.test.ts`; `mine` is full-width
  (`HomeCategoryCard` `wide`).
- [PASS] Points equals learned.size — `useHomeData` / `GamesMenuScreen` /
  `PracticeMenuScreen` all pass `learned.size` to `TopBar`; unit test
  asserts no separate counter.
- [PASS] Opening a category writes lia:lastcat — `useCategoryProgress`
  calls `setLastCat`; `category.spec.ts` reads the storage bridge and
  asserts `'animals'`.
- [PASS] Tapping a word speaks exactly once and marks it learned —
  `category.spec.ts` via `speechSpy`: one call, star badge appears.
- [PASS] Niqqud affects display but NEVER the text passed to the voice
  service, asserted by speechSpy — `category.spec.ts` seeds
  `lia:settings.niqqud=false`, taps word 0, asserts spoken text is `כלב`
  (plain) and the rendered tile has no niqqud marks.
- [PASS] gameCatChips shows only categories with 4 or more items —
  `gameCatChips.ts`; `home-data.test.ts`; `navigation.spec.ts` asserts
  `games-menu-chip-animals` visible and `games-menu-chip-mine` absent on
  an empty `mine`. Both the games menu and the practice menu render the
  chip row (index.html 2389 and 2412).
- [PASS] No adult control on any child screen — `category.spec.ts` and
  `navigation.spec.ts` count `document.querySelectorAll('select') === 0`
  on Home-driven child routes; no picker is rendered.
- [FAIL] Hardware back navigates and never exits, verified on a real
  device — Playwright `page.goBack()` from a category / stub returns to
  Home without leaving the app (`navigation.spec.ts`), which is the web
  analogue. Hardware back on a real Android device was not exercised:
  this sandbox has no Android SDK, adb, emulator or physical device.
  `.maestro/home.yaml` encodes the flow. See Native coverage.
- [PASS] Real Talki art throughout; no emoji stands in for card art —
  category chips use `talki-cat-icon-*.png`; the hero tile uses
  `talki-cat-art-*.webp`; Home/games covers use `talki-game-card-*.png`;
  practice Home cards use `talki-speech-{target,pointing-hand,pause}.png`.
  The four games without a dedicated PNG (`match`, `bubbles`, `sort`,
  `speech`) render as plain cards, matching legacy's own split at
  index.html 2367–2377, not an invented substitute. Category `icon`
  emoji remains data, used in labels only.
- [PASS] Touch-target and reachability audits clean at all ten viewports
  — `home.spec.ts` and `category.spec.ts`, zero violations.
- [PASS] No horizontal overflow at any viewport — `home.spec.ts`
  `scrollWidth <= clientWidth + 1`.
- [PASS] Rapid taps never double-navigate or double-count —
  `burst(home-category-animals, 10)` then a single `goBack` returns to
  Home; word-tile burst never produces more speech calls than clicks.
- [PASS] No listener growth across re-renders — music toggle, two batches
  of ten clicks, listener delta `<= 1`.
- [PASS] Baseline comparison written, EVERY difference classified intended
  or defect — see Baseline comparison and Approved-mock deviations below.
- [PASS] tsc --noEmit, eslint, expo-doctor clean — Gate results §1.
- [PASS] vitest run green; expo export --platform web succeeds;
  playwright green — Gate results §2–4.
- [FAIL] 70 screenshots plus two device captures committed — 70 files
  under `docs/migration/screenshots/phase-07/` (7 views × 10 viewports).
  `android-device-home.png` and `android-tablet-home-landscape.png` were
  not produced (no device). See Native coverage.
- [FAIL] Progress survives force-stop, verified on device — persistence
  is wired (`markLearned` / `setLastCat` write through `storage.set` on
  every mutation; web reload is covered by `test_suite.py` and by
  `seedProgress` in Playwright). Force-stop + relaunch on a real process
  was not run. `.maestro/home.yaml` is the intended native check.
- [PASS] Tablet verified in both orientations — Playwright projects
  `ipad-mini` / `ipad-air` (portrait) and `tablet-4-3` / `tablet-16-10`
  (landscape) all pass Home, category and navigation specs including
  screenshots. Not a physical tablet.
- [PASS] All three legacy suites still green — Gate results §6.

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
 Test Files  19 passed (19)
      Tests  5364 passed (5364)
```

`home-data.test.ts` and `navigation.test.ts` are new. The remaining tests
are Phases 1–6, unaffected.

### 3. Web export

```
$ npx expo export --platform web
...
Exported: dist
```

Bundle includes the new Home/game/practice/category assets under
content-hashed filenames (`talki-hero-scene-{compact,wide}`,
`talki-hero-star`, `talki-game-card-*`, `talki-cat-art-*`,
`talki-speech-{bubble,target,pointing-hand,pause}`, `talki-ui-icon-games`,
`talki-star-mark`).

### 4. Tier 2 playwright

```
$ npx playwright test
  530 passed (50.2s)
```

Broken down across 10 viewport projects: `home.spec.ts`,
`category.spec.ts`, `navigation.spec.ts` are new; `smoke.spec.ts` now
asserts real Home instead of the Phase 1 placeholder; `intro.spec.ts`
handoff target is `home-root`; `gallery.spec.ts`, `audio-lab.spec.ts` and
`storage.spec.ts` are unchanged and still green.

### 5. Screenshots

PASS for the web matrix. 70 files under
`docs/migration/screenshots/phase-07/`:

```
<viewport>-home.png
<viewport>-home-empty.png          fresh welcome hero (learned.size === 0)
<viewport>-home-progressed.png     seeded continue hero
<viewport>-category-animals.png
<viewport>-category-animals-learned.png
<viewport>-games-menu.png
<viewport>-practice-menu.png
```

Viewports: 320x568, 360x800, 390x844, 430x932, 768x1024, 834x1112,
844x390, 932x430, 1024x768, 1280x800. Plus Playwright `toHaveScreenshot`
baselines under `apps/mobile/tests/e2e/__screenshots__/home.spec.ts/` and
updated smoke baselines. No device capture (see Native coverage).

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
Phases 1–6 recorded).

Checks performed: none on real hardware. `.maestro/home.yaml` is written
and ready — launches with `intro: '0'`, opens animals, taps word 0,
hardware `back`, asserts Home, then walks Games and Rewards tabs.

Checks NOT possible and why:

- Hardware back from a child screen (needs a real Android back key / iOS
  gesture; Playwright `page.goBack()` is the browser history analogue and
  does pass).
- A tapped word actually speaking through the device TTS engine (web
  `speechSpy` proves the service is called with the plain form; it does
  not prove `expo-speech` audio on a speaker).
- Progress surviving `am force-stop` + relaunch (needs a real process
  kill; web reload plus `storage.set` write-through is the closest
  analogue this sandbox has).
- Home on a physical tablet in both orientations (Playwright covers the
  two tablet landscape sizes and two tablet portrait sizes).

## Files created

- `apps/mobile/app/(tabs)/_layout.tsx` — Expo Router tab group with the
  design-system `BottomNavigation` as `tabBar`.
- `apps/mobile/app/(tabs)/index.tsx` — Home route.
- `apps/mobile/app/(tabs)/games.tsx` — games menu route.
- `apps/mobile/app/(tabs)/rewards.tsx` — stickers shell (Phase 12 owns
  the real screen).
- `apps/mobile/app/category/[id].tsx` — category word-grid route.
- `apps/mobile/app/game/[id].tsx` / `app/practice/[id].tsx` /
  `app/cards/[id].tsx` — stub routes for unbuilt modes.
- `apps/mobile/app/practice/index.tsx` — practice menu route.
- `apps/mobile/src/features/home/*` — `HomeScreen`, two-state
  `ContinueLearningHero`, horizontal `HomeCategoryCard` / `CategoryGrid`,
  `HomePracticeRow`, `HomeGamesRow`, `GameArtCard`, `useHomeData`.
- `apps/mobile/src/features/categories/*` — `CategoryScreen`, `WordGrid`,
  `WordTile`, `useCategoryProgress` (`enterCat` equivalent).
- `apps/mobile/src/features/games/GamesMenuScreen.tsx`,
  `GameCatChipRow.tsx` — 11-game menu + 4+ chips.
- `apps/mobile/src/features/practice/PracticeMenuScreen.tsx` — six-mode
  menu + the same chips.
- `apps/mobile/src/features/rewards/RewardsScreen.tsx` — shell.
- `apps/mobile/src/features/stub/StubScreen.tsx` — shared stub.
- `apps/mobile/src/state/progressStore.ts`, `settingsStore.ts` — Zustand,
  persisted through Phase 3 `storage`.
- `apps/mobile/src/domain/games/{homeGames,gameCards,gameCatChips}.ts`,
  `domain/navigation/routes.ts`, `domain/vocabulary/wordImage.ts`.
- `apps/mobile/src/hooks/useGuardedPush.ts`, `useGoBack.ts` — screens
  never import `expo-router` directly.
- `apps/mobile/src/testing/e2eStoreBridge.ts` — Playwright storage/store
  seed + rehydrate.
- `apps/mobile/tests/unit/home-data.test.ts`, `navigation.test.ts`.
- `apps/mobile/tests/e2e/{home,category,navigation}.spec.ts`.
- `apps/mobile/.maestro/home.yaml`.
- `docs/migration/screenshots/phase-07/` — 70 files.
- Metro copies of Home/game/practice/category art under
  `apps/mobile/assets/v2/{home,game-menu,categories,icons,brand}/`.

## Files modified

- `apps/mobile/app/_layout.tsx` — intro now gates the Stack (Phase 7 gave
  `app/index` to tabs Home); `?intro=0` still skips.
- `apps/mobile/app/index.tsx` — deleted; Home lives at
  `app/(tabs)/index.tsx`.
- `apps/mobile/src/design-system/assets.ts` — `homeAssets`,
  `gameCardAssets`, `practiceIcons`, `categoryArt`, `brand.starMark`,
  `uiIcons.games`.
- `apps/mobile/src/components/shell/BottomNavigation.tsx` — web-only
  `dir="rtl"` so the tab bar, which is not nested in a `TalkiScreen`,
  mirrors correctly.
- `apps/mobile/src/testing/testIds.ts` — Home / nav / category / games /
  practice ids from the plan.
- `apps/mobile/tests/e2e/smoke.spec.ts` — asserts `home-root`.
- `apps/mobile/tests/e2e/intro.spec.ts` — `?intro=0` handoff target is
  `home-root`.
- `apps/mobile/.maestro/{smoke,intro}.yaml` — same handoff retarget.
- `apps/mobile/package.json` / root `package-lock.json` — `zustand@^5.0.15`.
- `docs/migration/screenshots/phase-01/*-bootstrap.png` — smoke
  `captureMatrix` now records real Home.

## Dependencies added

- `zustand@^5.0.15` — progress and settings stores. Persistence is not
  `zustand/middleware/persist`; every mutation writes through
  `services/storage` so the Phase 3 backend (SQLite native / IndexedDB
  web) remains the single source of durability.

## Deviations from the phase plan

- **Two-state hero instead of "hero absent when empty".** `index.html`
  `homeHero()` always renders once `currentCategory()` returns a category,
  which it does whenever any category has items. Fresh vs returning is
  `learned.size === 0`. The plan's screenshot caption
  (`home-empty.png` — "no progress, no hero") is stale against the code.
  Default used: follow `index.html`. `home-empty.png` captures the welcome
  banner.
- **Intro moved from `app/index.tsx` to `app/_layout.tsx`.** Phase 7 needs
  `/` for Home. A `router.replace()` handoff left the previous screen
  stuck on the web target (already noted in Phase 6). Gating the Stack
  behind intro state is a pure swap in one mounted component.
- **Screens import navigation only through `useGuardedPush` /
  `useGoBack`.** The standing rule forbids `expo-*` imports from a
  screen; route files under `app/` are allowed to import `expo-router`.
- **`TalkiButton` secondary for the hero CTA** rather than a one-off
  sparkle button cloned from `.home-hero-cta`. Design-system primitive;
  recorded under Approved-mock deviations.
- **Speech-unsupported banner not ported.** `renderHome()` 2247 shows a
  banner when `speechOk` is false. Both test surfaces here have a voice
  path (`expo-speech` / web `speechSynthesis` spy). `degradeNativeApis`
  still leaves Home usable. Flagged as a small omission, not silently
  skipped.
- **Deep link `?game=`** is implemented as `parseGameDeepLink` plus
  `gameHref`; the native form is a `/game/[id]` route. Web query form is
  kept for the parser. Wiring it on cold start is left to a later phase
  that owns game launch.

## Findings and drift

- **`currentCategory()` never returns null** once `allCats()` has any
  non-empty category, including when every category is fully learned
  (branch 4 returns `cats[0]`). The plan's "no hero when every category
  is fully learned" unit-test line is therefore unreachable against the
  real function. The ported test asserts the actual branch-4 behaviour.
- **Hero assets were untracked at the start of the phase**
  (`assets/v2/home/talki-hero-scene-{compact,wide}.webp`,
  `talki-hero-star.webp`), as the plan warned. They are now copied into
  `apps/mobile/assets/v2/home/` for Metro. The older
  `talki-home-hero-art.webp` is gone from the repository.
- **Approved mock vs current legacy vs newer hero mock disagree.** See
  Approved-mock deviations. Behaviour always came from `index.html`.
- **`expo serve` has no SPA fallback** for nested dynamic routes, so
  category / games / practice specs client-navigate through
  `__talkiRouterE2E` rather than `page.goto('/category/animals')`. Same
  constraint gallery.spec.ts already documented.
- **Re-hydrating Zustand while a category screen is mounted** was found
  to stop react-native-web's gesture responder from firing `onPress` on
  that screen's Pressables. Production code never re-hydrates (each store
  has a `hydrated` flag). Tests seed storage and reload instead.

## Approved-mock deviations

Which mock governed which decision (phase-07-plan.md "Which mock governs"):
`docs/design/talki-home-approved.png` for overall Home composition
(horizontal category cards, three practice cards, three illustrated game
covers, section order); `docs/design/talki-home-hero-mockup.png` plus the
new `talki-hero-scene-*.webp` assets for the hero.

| Difference vs approved mock | Governed by | Class |
|---|---|---|
| One two-state hero, not a welcome banner stacked on a separate white continue card | Newer hero mock + `homeHero()` | intended |
| Hero scene is the new webp (blue sky / clouds / star) not the mock's green-hills illustration | Plan: use the untracked webp assets | intended |
| Hero copy is white on a tinted overlay, not dark purple on a light scene | Contrast against the webp scene | intended |
| Hero CTA is `TalkiButton` secondary (white, purple label), not the mock's purple sparkle pill | Design-system primitive | intended |
| Bottom nav is 3 tabs (בית / משחקים / פרסים), not the mock's 4th settings/achievements tab | `index.html` 1347–1350; no adult control on child screens | intended |
| TopBar is logo + points + music only, not the mock's extra gift / gesture buttons | Same adult-control constraint; music is the one child-facing control legacy keeps | intended |
| Points pill shows a number, not "N נקודות" | Phase 5 `TopBar` already shipped this | intended |
| Category grid is horizontal icon+title+count cards, not the newer mock's circular icon grid | Approved mock + `homeCategoryCard()` | intended |
| `mine` is a full-width last row | Legacy `.home-cat-card.mine { grid-column: 1 / -1 }` | intended |
| Practice / games sit below the fold on phone portrait | Same as legacy Home at 390×844 | intended |
| Native tab bar is a real navigator, not a `view` string | Phase plan, deliberate | intended |

No unclassified visual difference remains. None of the above is a defect
against the phase's own rules (approved mock for arrangement, newer mock
for the hero, `index.html` for behaviour).

## Baseline comparison

Side-by-side: `docs/migration/screenshots/phase-07/<css-size>-home.png`
against `docs/migration/screenshots/legacy-baseline/<project>-home.png`.

Mapping: 320x568↔iphone-se1, 360x800↔android-compact, 390x844↔iphone-13,
430x932↔iphone-pro-max, 768x1024↔ipad-mini, 834x1112↔ipad-air,
844x390↔landscape-844, 932x430↔landscape-932, 1024x768↔tablet-4-3,
1280x800↔tablet-16-10.

Compared at 390x844 / iphone-13 (primary reference) and checked at
landscape-844 and tablet sizes:

| Difference vs legacy Home | Class |
|---|---|
| Hero uses the new webp scene + star (legacy already does on current `index.html`; the Phase 0 baseline predates that asset swap in places) | intended (newer hero mock / current code) |
| Native Expo tab bar vs legacy's in-page `bottomNav` HTML | intended (native navigation) |
| Bundled Assistant/Rubik vs legacy CDN fonts — metrics differ by a few px | intended (Phase 5) |
| `TalkiButton` CTA instead of the custom `.home-hero-cta` sparkle control | intended (design-system) |
| Purple hero overlay for white type; legacy types dark purple on the scene | intended (readability on the webp) |
| Section order, three games, three practice, horizontal category cards, RTL, 3-tab bar, music-only top control | match |
| Fresh-state welcome copy and returning-state "ממשיכים עם" + category tile + bar | match (`homeHero()`) |

No defect-class difference was found. Phone-landscape Home shows the hero
and tab bar with categories below the fold; the same fold exists on
legacy at 844×390. `auditReachability` still passes because scrolling
brings every control to the hit-test centre.

## Risks carried into the next phase

- Hardware back, spoken audio, force-stop persistence and physical-tablet
  layout are still unattested on a real device. Phase 8's landscape lock
  for games will hit the same gap.
- Game and practice cards currently push stubs. Phase 8 must replace the
  quiz stub with a real game without disturbing Home / menus.
- `gameCatChips` selection is local component state. The chosen category
  is passed into `gameHref` as `catId` and must be what `startGame()`
  reads in Phase 8.
- The speech-unsupported banner is still missing; a browser without
  `speechSynthesis` will not warn the child.

## Commands to reproduce

```bash
cd apps/mobile
npx tsc --noEmit && npx eslint . && npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test

# from repository root
node tools/dev-server.js &
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```
