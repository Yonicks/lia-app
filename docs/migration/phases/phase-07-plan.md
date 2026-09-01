# Phase 7 — Home, navigation and categories

**Prompt:** [../prompts/phase-07.md](../prompts/phase-07.md)
**Creates:** `app/(tabs)/`, `app/category/[id].tsx`, `src/features/home/`,
`src/features/categories/`
**Ships:** the first screens a child actually uses

---

## Goal and rationale

Build the navigation spine and the three screens a child touches before
reaching any game: Home, the category list, and a category's word grid.

Home is the app's hardest screen. It has the most competing demands — continue
learning, browse categories, practise speech, play games — and it is the screen
a parent judges the product by. It also has an approved visual design, which
nothing else in the migration does.

This is the first phase where the legacy screenshot baseline captured in
Phase 0 earns its keep: the native Home can be compared side by side against
the legacy Home at all ten viewports.

## Entry conditions

- `docs/migration/phase-06-report.md` exists with no critical FAIL.
- Design system, storage, audio and domain all exist.
- `docs/migration/screenshots/legacy-baseline/` is populated.

## Design decisions

### Match the approved design, not the current implementation

`docs/design/talki-home-approved.png` is the target. Where the legacy Home
differs from it, the approved design wins and the difference is recorded.

This is a deliberate exception to "the code is the source of truth". That rule
exists to stop an agent inventing behaviour; it is not meant to freeze a design
that has already been reviewed and approved. Behaviour still comes from the
code — what "continue learning" points at, how progress is counted, which
practice modes appear on Home. Only the visual arrangement comes from the mock.

`docs/design/talki-home-hero-mockup.png` and the new
`assets/v2/home/talki-hero-scene-*.webp` files are untracked additions that
postdate the approved mock. They are the newer intent for the hero. Use them,
and record in the report which mock governed which decision.

### Home composition comes from the legacy render function

`renderHome()` (index.html 2227-2270) defines the section order, and it is not
guesswork:

```
hero (continue learning), rendered only when currentCategory() returns a category
optional speech-unsupported banner
section "קטגוריות"      all categories from allCats()
section "תרגול דיבור"   HOME_PRACTICE_HOME, with an "all" link to practice
section "משחקים"        exactly three: memory, quiz, missing, with an "all" link
```

Two details that are easy to lose:

- The Home games row is **three fixed games**, not all eleven. The legacy array
  at index.html 2237-2241 is `memory`, `quiz`, `missing`, each with a specific
  card image. The full list lives on the games menu.
- The Home practice row is `HOME_PRACTICE_HOME` (index.html 1383-1387), which
  is `focus`, `receptive`, `cloze` — three of the six. The other three are
  reachable from the practice menu.

Getting either wrong makes Home look right and behave differently.

### Continue Learning uses all four branches

`currentCategory()` returns `lastCat` first when that category is not fully
learned. The hero renders only when it returns something.

This is the single most likely thing to be silently wrong in this phase,
because branches 2, 3 and 4 all produce plausible-looking heroes. Phase 2 ported
and tested the function; Phase 7 must call it rather than re-deriving the
answer.

### Native navigation, not a `view` string

Legacy holds a `view` string and calls `render()`, with `history.pushState`
bolted on (index.html 2118-2147). Native gets real routes: an Expo Router tab
group for the three main destinations, a stack for category and game routes.

Hardware back must navigate, never exit from a child screen. Legacy already
handles this at index.html 2118-2124 and it must not regress — a toddler
pressing back and dropping out of the app to the launcher is a bad experience
that is easy to ship by accident.

### No adult control on a child screen

Legacy carries a deliberate design comment at index.html 2474-2479 explaining
why a native `<select>` was removed from the game header: it opened an OS
dropdown a child could not dismiss, and choosing silently discarded the round
in progress.

Category selection therefore happens on menus, before a game starts, as a row
of Talki chips. That constraint carries over. `tests/interaction_suite.py` has
an assertion for it and the mobile suite gets the equivalent.

### Real Talki art, always

Category cards use the real card art. Nav icons use
`assets/v2/nav/talki-nav-{home,games,rewards}.png`. Game cards use
`assets/v2/game-menu/talki-game-card-*.png`. No emoji stands in for a card
image.

The category `icon` field is a genuine emoji in the data (🐶, 🍎) and is used
as legacy uses it — inside chips and small labels, not as a substitute for
card art.

## Legacy source mapping

| Behaviour | Legacy location |
|---|---|
| `renderHome()` section order | index.html 2227-2270 |
| Home games row, three fixed games | index.html 2237-2241 |
| `HOME_PRACTICE_HOME` | index.html 1383-1387 |
| `homeHero()`, `homeCategoryCard()`, `homePracticeCard()`, `homeAllLink()` | index.html 1352-1400 |
| Speech-unsupported banner | index.html 2247 |
| `renderCategory()` | index.html 2293-2327 |
| `renderCards()` | index.html 2329-2351 |
| `renderGamesMenu()` | index.html 2354-2391 |
| `renderPractice()` | index.html 2394-2414 |
| `gameCatChips()`, 4+ items filter | index.html 2282-2291 |
| `enterCat()` writing `lia:lastcat` | index.html 1823 |
| `currentCategory()` | index.html 2206-2216 |
| Points equals `learned.size` | index.html 2075-2079 |
| `navTo()` | index.html 3397-3401 |
| History and hardware back | index.html 2118-2147 |
| Why no adult control on child screens | index.html 2474-2479 |
| Bottom navigation | index.html 1347-1350 |
| Top bar | index.html 98-125 |

## Files to be created

```
app/
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx            Home
│   ├── games.tsx            games menu
│   └── rewards.tsx          stickers, shell only until Phase 12
├── category/[id].tsx
└── practice/index.tsx       practice menu

apps/mobile/src/features/home/
├── HomeScreen.tsx
├── ContinueLearningHero.tsx
├── CategoryGrid.tsx
├── HomePracticeRow.tsx
├── HomeGamesRow.tsx
└── useHomeData.ts

apps/mobile/src/features/categories/
├── CategoryScreen.tsx
├── WordGrid.tsx
├── WordTile.tsx
└── useCategoryProgress.ts

apps/mobile/src/state/
├── progressStore.ts         Zustand, persisted through Phase 3 storage
└── settingsStore.ts

apps/mobile/tests/unit/home-data.test.ts
apps/mobile/tests/unit/navigation.test.ts
apps/mobile/tests/e2e/home.spec.ts
apps/mobile/tests/e2e/category.spec.ts
apps/mobile/tests/e2e/navigation.spec.ts
apps/mobile/.maestro/home.yaml
```

## testIds introduced

```
home-root                     home-hero
home-hero-continue            home-section-categories
home-category-<categoryId>    home-section-practice
home-practice-<modeId>        home-section-games
home-game-<gameId>            home-all-practice
home-all-games                home-points

nav-home                      nav-games
nav-rewards

category-root                 category-title
category-progress             category-word-<index>
category-back                 category-play

games-menu-root               games-menu-card-<gameId>
games-menu-chip-<categoryId>

practice-menu-root            practice-menu-card-<modeId>
```

## Behaviour to preserve exactly

- Section order: hero, categories, practice, games.
- The hero renders only when `currentCategory()` returns a category.
- Home games row is exactly `memory`, `quiz`, `missing`.
- Home practice row is exactly `focus`, `receptive`, `cloze`.
- Both practice and games sections have an "all" link to their menu.
- Category grid shows all categories from `allCats()`, including `mine` when
  custom words exist.
- Each category card shows learned count out of total.
- Points equals `learned.size`.
- Opening a category writes `lia:lastcat`.
- Tapping a word speaks it and marks it learned, exactly as legacy does.
- Learned words show a star badge.
- Niqqud toggle changes display only, never TTS input.
- `gameCatChips` shows only categories with 4 or more items.
- No category dropdown or other adult control on any child screen.
- Hardware back navigates, never exits from a child screen.

## Deliberate deviations

- Visual arrangement follows the approved mock where it differs from the
  current implementation.
- Native tab and stack navigation replaces the `view` string.

## Test plan

### Tier 1

`home-data.test.ts`
- the hero uses `currentCategory()`, including the `lastCat` branch
- no hero when every category is fully learned and `currentCategory()` returns
  nothing
- the games row is exactly the three ids, in order
- the practice row is exactly `HOME_PRACTICE_HOME`
- the category list matches `allCats()` and includes `mine` when custom words
  exist
- per-category learned counts equal `catLearned()`
- points equals `learned.size`

`navigation.test.ts`
- every route in the map resolves
- back from a category returns to Home
- back from Home does not exit
- deep link `?game=<type>` resolves after the start gate, matching legacy
  behaviour at index.html 4246-4247

### Tier 2

`home.spec.ts` at all ten viewports
- all four sections render in the correct order
- exactly three game cards and exactly three practice cards
- the hero appears with seeded progress and points to the expected category
- the hero is absent when there is nothing to continue
- `auditTouchTargets` clean
- `auditReachability` clean — nothing hidden behind the top bar or the ad slot
- no horizontal overflow, mirroring `tests/test_suite.py` test 1
- `burst(page, 'home-category-animals', 10)` navigates exactly once
- `countListeners` shows no growth after ten re-renders
- `toHaveScreenshot()` per viewport
- `captureMatrix(page, '07', 'home')`

`category.spec.ts` at all ten viewports
- the word grid renders every word in the category
- tapping a word calls the voice service exactly once, via `speechSpy`
- the learned count increments and the star badge appears
- the niqqud toggle changes the rendered text but not the text passed to the
  voice service
- `burst` on a word tile does not double-count
- with `degradeNativeApis`, the screen still renders and remains usable

`navigation.spec.ts`
- every tab reachable
- category open and back
- no adult control present on any child screen, mirroring
  `tests/interaction_suite.py` test 12b

### Tier 3

`.maestro/home.yaml`: launch, open a category, tap a word, go back, confirm the
count incremented.

Manual attestation, device named:
- hardware back navigates and never exits from a child screen
- the word tapped actually speaks
- progress survives a force-stop and relaunch
- home renders correctly on a tablet in both orientations

### Baseline comparison

Place `screenshots/phase-07/<viewport>-home.png` beside
`screenshots/legacy-baseline/<viewport>-home.png` and write a short difference
list in the report: what changed, and whether each change was intended by the
approved mock. Every unintended difference is a defect.

## Screenshot manifest

```
docs/migration/screenshots/phase-07/
    <viewport>-home.png
    <viewport>-home-empty.png          no progress, no hero
    <viewport>-home-progressed.png     seeded progress, hero visible
    <viewport>-category-animals.png
    <viewport>-category-animals-learned.png
    <viewport>-games-menu.png
    <viewport>-practice-menu.png
    android-device-home.png
    android-tablet-home-landscape.png
```

Seven views times ten viewports is 70 files, plus two device captures.

## Risks and open questions

**Which mock governs.** The approved `talki-home-approved.png` and the newer
`talki-home-hero-mockup.png` disagree about the hero. Default: approved mock for
overall composition, newer mock for the hero, using the new
`talki-hero-scene-*.webp` assets. Record which governed which decision.

**The new hero assets are untracked.** `assets/v2/home/talki-hero-scene-*.webp`
and `talki-hero-star.webp` are new and uncommitted, and
`talki-home-hero-art.webp` was deleted. Default: use the new files, and note in
the report that Home depends on assets that were untracked at the start of the
phase.

**The `mine` category on Home.** Custom words do not exist until Phase 12.
Default: render `mine` when `allCats()` includes it, and test that path with
seeded fake custom words rather than deferring it.

**Tab bar plus ad banner plus safe area.** Three things compete for the bottom
of the screen. Default: compose them in `useSafeLayout` from Phase 5, reserve
the ad height even when no ad is showing (legacy uses `--ad-h` for exactly
this), and let `auditReachability` prove nothing is occluded.

**Deep link `?game=` is a web concept.** Default: implement the equivalent as a
route parameter, keep the query form working on the web target since the legacy
tests use it, and note the native form in the report.

## Exit criteria

- [ ] Home renders all four sections in the correct order
- [ ] Exactly three game cards: memory, quiz, missing
- [ ] Exactly three practice cards: focus, receptive, cloze
- [ ] Both "all" links present and working
- [ ] Continue Learning uses `currentCategory()` including the `lastCat` branch
- [ ] The hero is absent when there is nothing to continue
- [ ] Category grid matches `allCats()` and handles `mine`
- [ ] Points equals `learned.size`
- [ ] Opening a category writes `lia:lastcat`
- [ ] Tapping a word speaks once and marks it learned
- [ ] Niqqud affects display but never TTS input, asserted
- [ ] No adult control on any child screen
- [ ] Hardware back navigates and never exits from a child screen, verified on
      a device
- [ ] Real Talki art throughout; no emoji stands in for card art
- [ ] Touch-target and reachability audits clean at all ten viewports
- [ ] No horizontal overflow at any viewport
- [ ] Rapid taps do not double-navigate or double-count
- [ ] No listener growth across re-renders
- [ ] Side-by-side comparison against the legacy baseline written, with every
      difference classified intended or defect
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green, `expo export --platform web` succeeds,
      `playwright test` green
- [ ] 70 screenshots plus two device captures committed
- [ ] Progress survives force-stop, verified on a device
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-07-report.md` written
