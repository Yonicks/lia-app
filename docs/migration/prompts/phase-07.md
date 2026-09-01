# Phase 7 prompt — Home, navigation and categories

Plan: [../phases/phase-07-plan.md](../phases/phase-07-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 7 of the Talki migration to Expo React Native.

Phase 7 builds the navigation spine and the three screens a child touches
before reaching any game: Home, the category list, and a category's word grid.

Execute ONLY Phase 7.

Home is the app's hardest screen. It has the most competing demands and it is
the screen a parent judges the product by. It is also the only screen in the
migration with an approved visual design.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html is the primary source of truth for BEHAVIOUR.
- For the VISUAL ARRANGEMENT of Home only, docs/design/talki-home-approved.png
  wins where it differs from the current implementation. That is a deliberate
  exception: the "code wins" rule exists to stop you inventing behaviour, not
  to freeze a design that has already been reviewed and approved.
  Behaviour still comes from the code. Record every difference you act on.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename or refactor index.html, audio-manager.js, assets/,
  tests/, android/, ios/, capacitor.config.ts or manifest.json.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Do not make a decision for the browser's benefit.

FORBIDDEN
- No emoji standing in for a real Talki card image.
- No adult control on any child screen. See the design comment at
  index.html 2474-2479 — this is a hard product constraint, not a preference.
- No global store for transient per-screen state.
- No direct expo-* import from a screen. Services only.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not build any game or practice mode. Menus only; cards route to a stub.
- Do not build the stickers screen beyond a shell. Phase 12 owns it.
- If you finish early, deepen the tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-07-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-07-plan.md   — your plan, read it fully
2. docs/migration/validation.md
3. docs/migration/phase-06-report.md
4. docs/design/talki-home-approved.png      — the approved composition
5. docs/design/talki-home-hero-mockup.png   — the newer hero intent
6. docs/migration/screenshots/legacy-baseline/  — your comparison set
7. index.html:
     1347-1350  bottom navigation
     1352-1400  homeHero, homeCategoryCard, homePracticeCard, homeAllLink
     1383-1387  HOME_PRACTICE_HOME
     1823       enterCat() writing lia:lastcat
     2075-2079  points = learned.size
     2118-2147  history and hardware back
     2206-2216  currentCategory()
     2227-2270  renderHome()
     2282-2291  gameCatChips()
     2293-2351  renderCategory(), renderCards()
     2354-2414  renderGamesMenu(), renderPractice()
     2474-2479  WHY there is no adult control on child screens
     3397-3401  navTo()
8. tests/test_suite.py test 1 (overflow), tests/interaction_suite.py test 12b

GROUND TRUTH — Home composition, from renderHome() at index.html 2227-2270:

    hero (continue learning)   rendered ONLY when currentCategory() returns one
    optional banner            shown when speech is unsupported
    section "קטגוריות"          all categories from allCats()
    section "תרגול דיבור"       HOME_PRACTICE_HOME, plus an "all" link
    section "משחקים"            EXACTLY THREE games, plus an "all" link

TWO DETAILS THAT ARE EASY TO LOSE. Getting either wrong makes Home look right
and behave differently:

  1. The Home games row is THREE FIXED GAMES, not all eleven
     (index.html 2237-2241):
        memory   talki-game-card-memory.png     משחק זיכרון
        quiz     talki-game-card-where-is.png   איפה ה...?
        missing  talki-game-card-missing.png    מה נעלם?
     The full list of eleven lives on the games menu.

  2. The Home practice row is HOME_PRACTICE_HOME (index.html 1383-1387), which
     is focus, receptive and cloze — THREE of the six. The other three
     (temptation, pairs, combine) are reachable from the practice menu only.

currentCategory() (index.html 2206-2216) has FOUR branches and branch 1 returns
lastCat when that category is not fully learned. This is the most likely thing
to be silently wrong in this phase, because branches 2, 3 and 4 all produce
plausible-looking heroes. Phase 2 already ported and tested this function. CALL
IT. Do not re-derive the answer.

gameCatChips() (index.html 2282-2291) shows only categories with 4 or more items.

Points equals learned.size (index.html 2075-2079). There is no separate counter.

Art:
  nav icons    assets/v2/nav/talki-nav-{home,games,rewards}.png
  game cards   assets/v2/game-menu/talki-game-card-*.png
  category art the real card art, never an emoji substitute
The category `icon` field IS a genuine emoji (🐶, 🍎) and is used as legacy uses
it — inside chips and small labels, not as a replacement for card art.

WORK ITEMS

1. Build native navigation: an Expo Router tab group for Home, Games and
   Rewards, plus a stack for category and game routes. Replace the legacy
   `view` string entirely.

   HARDWARE BACK MUST NAVIGATE, NEVER EXIT from a child screen. Legacy handles
   this at index.html 2118-2124. A toddler pressing back and dropping out to
   the launcher is a bad experience that is easy to ship by accident.

2. Build HomeScreen with all four sections in the order above, following the
   approved mock for composition and the newer hero mock for the hero.
   Use the new hero assets at assets/v2/home/talki-hero-scene-{compact,wide}.webp
   and talki-hero-star.webp. Note in your report that these were untracked at
   the start of the phase.

3. Build the category screen and word grid. Tapping a word speaks it through
   WordVoiceService and marks it learned, exactly as legacy does. Learned words
   show a star badge. Opening a category writes lia:lastcat via the equivalent
   of enterCat().

   The niqqud setting changes DISPLAY ONLY. The text passed to the voice
   service is always the plain form. Assert this; it is easy to get backwards
   and impossible to notice by looking at the screen.

4. Build the games menu and practice menu. Game and practice cards route to a
   stub screen — you are not building any game in this phase. Include
   gameCatChips with the 4-or-more-items filter.

5. Add progressStore and settingsStore with Zustand, persisted through the
   Phase 3 storage service. Global state is for progress and settings ONLY.
   Transient per-screen state stays local.

6. Add every testId listed in the plan to src/testing/testIds.ts.

7. Tier 1: home-data.test.ts and navigation.test.ts per the plan. In
   particular assert that the hero uses currentCategory() including the lastCat
   branch, that the games row is exactly the three ids in order, and that the
   practice row is exactly HOME_PRACTICE_HOME.

8. Tier 2: home.spec.ts, category.spec.ts and navigation.spec.ts at all ten
   viewports. Use the helpers from Phase 1 and Phase 4:
     - auditTouchTargets and auditReachability clean on every screen
     - no horizontal overflow, mirroring tests/test_suite.py test 1
     - burst(page, 'home-category-animals', 10) navigates EXACTLY ONCE
     - countListeners shows no growth after ten re-renders
     - speechSpy proves tapping a word calls the voice service exactly once
     - speechSpy proves the text passed is the PLAIN form regardless of the
       niqqud setting
     - degradeNativeApis: the screen still renders and stays usable
     - no adult control on any child screen, mirroring interaction_suite 12b
     - toHaveScreenshot() per viewport
     - captureMatrix for every view in the manifest

9. BASELINE COMPARISON. Put screenshots/phase-07/<viewport>-home.png beside
   screenshots/legacy-baseline/<viewport>-home.png and write a difference list
   in your report. Classify EVERY difference as either intended by the approved
   mock or a defect. An unclassified difference is a FAIL.

10. Tier 3: apps/mobile/.maestro/home.yaml (launch, open a category, tap a
    word, go back, confirm the count incremented), plus manual attestation with
    the device named:
      - hardware back navigates and never exits from a child screen
      - a tapped word actually speaks
      - progress survives a force-stop and relaunch
      - Home renders correctly on a tablet in BOTH orientations

11. Run the gate:
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
- Do not build any game or practice mode.
- Do not put all eleven games on Home. Three.
- Do not put all six practice modes on Home. Three.
- Do not add a category dropdown, picker or any other adult control to a child
  screen.
- Do not re-derive the continue-learning category. Call currentCategory().
- Do not build the stickers screen beyond a shell.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] Home renders all four sections in the correct order
- [ ] EXACTLY three game cards: memory, quiz, missing, in that order
- [ ] EXACTLY three practice cards: focus, receptive, cloze
- [ ] Both "all" links present and working
- [ ] Continue Learning uses currentCategory() including the lastCat branch
- [ ] The hero is absent when there is nothing to continue
- [ ] Category grid matches allCats() and handles the virtual 'mine' category
- [ ] Points equals learned.size
- [ ] Opening a category writes lia:lastcat
- [ ] Tapping a word speaks exactly once and marks it learned
- [ ] Niqqud affects display but NEVER the text passed to the voice service,
      asserted by speechSpy
- [ ] gameCatChips shows only categories with 4 or more items
- [ ] No adult control on any child screen
- [ ] Hardware back navigates and never exits, verified on a real device
- [ ] Real Talki art throughout; no emoji stands in for card art
- [ ] Touch-target and reachability audits clean at all ten viewports
- [ ] No horizontal overflow at any viewport
- [ ] Rapid taps never double-navigate or double-count
- [ ] No listener growth across re-renders
- [ ] Baseline comparison written, EVERY difference classified intended or defect
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green; expo export --platform web succeeds; playwright green
- [ ] 70 screenshots plus two device captures committed
- [ ] Progress survives force-stop, verified on device
- [ ] Tablet verified in both orientations
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-07-report.md using the headings in
docs/migration/validation.md section 7.

Add a section "Approved-mock deviations" listing every place the native Home
differs from the current legacy implementation, and which mock governed the
decision.

Then stop. Do not begin Phase 8.
````
