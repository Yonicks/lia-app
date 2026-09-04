# Phase 16 audit — Landscape rebaseline and design contract

Evidence gathered directly from current code at commit `05106e2`. Where a
claim in an existing doc disagreed with the code, the code wins per
`AGENTS.md`'s source-of-truth order, and the doc is corrected in this phase.

## 1. Repository baseline

- Commit: `05106e2` ("Clarify Phase 16 reference-image gate for the
  committed PNGs."), working tree clean at audit start.
- Native app: `apps/mobile/` (Expo Router, React Native, TypeScript).
- Legacy app: repository root (`index.html`, `capacitor.config.ts`,
  `android/`, `ios/`, `www/`, `tools/prepare_www.js`) — present and
  untouched by this phase.
- Landscape references: `docs/design/landscape/reference/home.png`
  (1448×1086), `games.png` (1672×941), `practice.png` (1448×1086), all
  present and inspected. No `talki-landscape-master.*` file exists; per
  `docs/design/landscape/reference/README.md` this file was always
  **optional**, so its absence is not a gate failure.

## 2. Responsive findings

Files: `apps/mobile/src/design-system/responsive/breakpoints.ts`,
`useDevice.ts`, `useSafeLayout.ts`.

- `classifyDevice(width)` classifies **on width alone** into four buckets:
  `phone` (<430), `largePhone` (430–767), `smallTablet` (768–1099),
  `largeTablet` (≥1100). Height/orientation play no role in the class.
- `useDevice()` is the single sanctioned hook (wraps `useWindowDimensions`)
  and is the only call site of `useWindowDimensions`/`Dimensions.get()` in
  the whole app (`grep` swept `src/` and `app/`; zero other hits).
- **Width-only misclassification, demonstrated with the roadmap's own
  numbers:**

  | Viewport (roadmap label) | `classifyDevice` result | Correct class |
  |---|---|---|
  | 844×390 — "standard modern phone/reference class" | `smallTablet` | phone |
  | 932×430 — "large phone" | `smallTablet` | phone |
  | 1024×768 — "small 4:3 tablet" | `smallTablet` | tablet (coincidentally correct) |

  An 844-wide or 932-wide **landscape phone** lands in the exact same
  bucket (`smallTablet`) as a real 1024-wide tablet. This is precisely the
  failure `AGENTS.md` rule 13 forbids ("A landscape phone must never
  become a tablet merely because its long edge is wider than 768 px").
  Phase 17 must classify on short-edge/usable-geometry, not raw width.
- No direct `Dimensions`/`useWindowDimensions` bypasses exist anywhere in
  feature code. The centralization itself is intact; only the
  *classification formula* is wrong for landscape.
- One feature-local numeric threshold outside the centralized system:
  `src/features/games/quiz/QuizScreen.tsx:180-181` computes
  `twoByTwo = orientation === 'landscape' && height < 500` and
  `oneRow = width >= 900` from `useDevice()`'s raw `width`/`height` rather
  than `deviceClass`. It does not bypass the hook, but it duplicates ad-hoc
  breakpoint logic the hook exists to centralize. Not a Phase 16 fix; flag
  for Phase 17/21 to fold into shared metrics if convenient.
- `src/domain/games/puzzle.ts:17` (`puzzleCapacity(height, width)`) also
  uses raw thresholds, but it is pure ported domain logic sizing puzzle
  piece count (index.html 2785-2789), unrelated to device-class chrome.
  Informational only, not a responsive-system bypass.
- `src/design-system/theme/spacing.ts` and
  `ContinueLearningHero.tsx:42` correctly branch on `deviceClass` — this is
  the sanctioned pattern and shows the seam Phase 17 should reuse once the
  classifier itself is fixed.

## 3. Orientation findings

Files: `app.config.ts`, `src/services/orientation/*`.

- `app.config.ts` sets `orientation: 'default'` — no manifest-level lock;
  everything is runtime, through `OrientationService`.
- `policy.ts` defines `RouteKind = 'intro' | 'home' | 'category' | 'games'
  | 'practice'` and:

  ```
  intro:    'responsive'
  home:     'responsive'
  category: 'responsive'
  games:    'landscape'
  practice: 'landscape'
  ```

- **Only one production call site applies this policy at all**:
  `src/features/games/shell/useGameSession.ts` calls
  `orientationService.applyFor('games')` on session start and
  `orientationService.unlock()` on session end.
- **`practice`'s `'landscape'` policy value is declared but never
  applied.** No file under `src/features/practice/` or `app/practice/`
  calls `orientationService.applyFor('practice')` anywhere. The only other
  call site in the whole repo is the dev-only `app/dev/audio-lab.tsx`,
  which calls `applyFor` generically as a manual test tool, not as product
  behavior. Today, opening a practice mode does **not** lock landscape,
  despite the policy table claiming it does.
- `home`, `category`, and `intro` currently allow free rotation (portrait
  included) — correct under the *old* product direction (only games were
  landscape-locked), but it directly contradicts the *new* landscape-only
  child-UI direction, which requires every child-facing route to be
  landscape-locked, not just games.
- No screen calls `expo-screen-orientation` directly outside
  `expoOrientation.ts` — the API-level centralization is intact; only the
  policy's coverage and enforcement are incomplete.
- **What Phase 17 must change:** extend `orientationPolicy` so
  `home`/`category`/`intro` (and any other child route) resolve to
  `'landscape'`, and wire an actual `applyFor('practice')` call site into
  the practice route/screens so the existing-but-dead policy value takes
  effect.

## 4. Navigation findings

Files: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`,
`src/components/shell/BottomNavigation.tsx`, `src/components/shell/TopBar.tsx`,
`src/hooks/useGuardedPush.ts`, `src/domain/navigation/routes.ts`,
`tests/e2e/navigation.spec.ts`.

- Root layout (`app/_layout.tsx`): a plain `Stack` (`headerShown: false`)
  wraps everything after the opening sequence (`StudioBumper` →
  `IntroSequence` → app), with a persistent `AdBanner` sibling outside the
  `Stack`. `DeepLinkAfterIntro` reads `?game=<id>` via
  `parseGameDeepLink`/`gameHref` (`src/domain/navigation/routes.ts`) and
  pushes it once fonts/intro have resolved. This deep-link path is intact
  and must be preserved by Phase 19's navigation rebuild.
- Main tabs (`app/(tabs)/_layout.tsx`): Expo Router `Tabs` with exactly
  **three** screens — `index` (home), `games`, `rewards` — rendered
  through a custom `tabBar` prop using the bespoke `BottomNavigation`
  component (not the default tab chrome). `detachInactiveScreens`,
  `freezeOnBlur`, and `lazy: true` are set.
- **`BottomNavigation` (`src/components/shell/BottomNavigation.tsx`)**
  renders exactly 3 items — home / games / stickers ("פרסים") — matching
  `index.html`'s legacy 3-item bar. **Practice is not a tab.** It is a
  separate stack route (`app/practice/index.tsx` menu,
  `app/practice/[id].tsx` mode) reached from Home, outside the `Tabs`
  navigator. Parent is likewise a stack route (`app/parent.tsx`), reached
  only through `TopBar`'s brand long-press, never through the bottom bar.
- Per `AGENTS.md` rule 8, `BottomNavigation` must not appear in the
  redesigned child experience; Phase 19 replaces it with the contextual
  side navigation shown in every reference image (a "‹ בית" / "משחקים ›"
  pill pair flanking each hub).
- **Mounted-tab risk carried from Phase 14:** `phase-14-report.md`
  recorded 20 `full-sweep.spec.ts` failures (P14-M16) tied to games/
  stickers reachability behind a still-mounted Home `TopBar` at certain
  viewports. The current `Tabs` structure (`detachInactiveScreens` +
  `freezeOnBlur`) is the same structure that produced that defect; Phase
  19 must not assume replacing only the tab-bar UI component fixes the
  underlying mounted-screen behavior.
- Parent entry: `TopBar`'s brand-logo `Pressable` is the **only** parent
  trigger in the tree — a 900 ms hold (`PARENT_HOLD_MS`) opens the parent
  flow, a short tap fires a toast. This already satisfies the
  interaction-map's "exactly one active parent-entry control" rule, and it
  is currently the Talki logo itself doing double duty as brand mark *and*
  parent trigger — the reference images show a **separate** small
  parent/profile icon next to the logo. Phase 18/19 must decide whether to
  keep the logo as the trigger or introduce the dedicated icon the mock
  shows (see §7).
- **Star/points pill is currently display-only.** `TopBar`'s points pill
  (`accessibilityRole="image"`, no `onPress`, not wrapped in a `Pressable`)
  cannot be tapped. The landscape interaction-map's "Stars/rewards" control
  is specified to *open the rewards destination* — today the only way to
  reach Rewards is the `BottomNavigation` "stickers" tab, which Phase 19
  removes. Phase 18/20/27 must decide how the star control becomes
  interactive once the bottom bar is gone, or reachability to Rewards will
  regress.
- `src/hooks/useGuardedPush.ts` de-dupes rapid double-taps app-wide
  (one navigation in flight per screen); this is route-agnostic and needs
  no change for landscape.
- `tests/e2e/navigation.spec.ts` covers: every tab reachable from Home;
  category open/back returns to Home without exiting; game/practice cards
  route to a stub and back returns to Home; games/practice menus reachable
  with correct category-chip filtering. Two assertions directly depend on
  `BottomNavigation`'s testID and will need a replacement testID once
  Phase 19 lands (see §8) — not touched in this phase.

## 5. Complete screen inventory

Confirmed against current code; `docs/design/landscape/screen-map.md`'s
inventory was accurate and needed no correction beyond the additions noted
below.

| Surface | Current implementation | Notes |
|---|---|---|
| Home | `src/features/home/HomeScreen.tsx` | reached via `(tabs)/index` |
| Games menu | `src/features/games/GamesMenuScreen.tsx` | `ScrollView` list today, not yet 3×2 |
| Practice menu | `src/features/practice/PracticeMenuScreen.tsx` | `ScrollView` list, text-only cards |
| Rewards | `src/features/rewards/RewardsScreen.tsx` → `StickersScreen.tsx` (+`StickerGrid`, `StickerFilters`) | one screen, reached via bottom-nav "stickers" |
| Category | `src/features/categories/CategoryScreen.tsx` | detail screen |
| Parent | `src/features/parent/ParentScreen.tsx` + 5 tabs: `MethodTab`, `RecordTab`, `ReportTab`, `SettingsTab`, `WordsTab` | reached via TopBar long-press |
| Intro | `src/features/intro/studioBumper` + `IntroSequence` | plays once per session |
| Global chrome | `TopBar`, `BottomNavigation`, `AdBanner`(+`.web`), `ToastHost`, `GameHeader`, `ParentGate`, `RewardOverlay` | `src/components/shell/` |
| Not-found | `app/+not-found.tsx` | fallback route |
| Dev-only | `app/dev/audio-lab.tsx`, `app/dev/gallery.tsx` | not a product surface, excluded from the landscape program by design |

No surface is missing from the inventory; none is dropped in this phase.

## 6. Feature counts (from code)

- **Games: 11**, exactly matching `src/features/games/shell/gameRegistry.ts`:
  quiz, memory, missing, match, cards, sounds, count, sort, bubbles,
  puzzle, speech.
- **Practice modes: 6**, exactly matching
  `src/features/practice/practiceRegistry.ts`: focus, cloze, temptation,
  receptive, pairs, combine.
- **Vocabulary categories: 10 built-in + 1 synthetic.**
  `src/domain/vocabulary/categories.ts`'s own header comment states "182
  words across 10 categories: animals 26, food 26, colors 26, home 26,
  outside 18, actions 16, family 12, body 12, numbers 10, emotions 10" —
  confirmed by `grep -c "id:"` = 10. `allCats()`
  (`src/domain/vocabulary/allCats.ts`) appends an 11th synthetic category,
  `mine` (custom words), giving **11 category destinations** total.
- **Parent tabs: 5** — Method, Record, Report, Settings, Words
  (`src/features/parent/tabs/*.tsx`).
- **Reward/sticker surfaces: 1 primary screen** (Rewards/Stickers) plus
  the in-flight `RewardOverlay` celebration component used during
  play/progress events.

## 7. Asset gaps

`docs/design/landscape/asset-manifest.md` updated in place with this
evidence (concrete paths, corrected statuses). Summary:

- **Reference images** — `EXISTING`, all three `.png` files present and
  readable at `docs/design/landscape/reference/`.
- **World backgrounds** (Home/Games/Practice, full-bleed, no baked UI) —
  `DESIGN-BLOCKED`. Nothing in `src/design-system/assets.ts` matches this;
  the closest existing asset, `homeAssets.heroSceneCompact/Wide`
  (`assets/v2/home/talki-hero-scene-*.webp`), is a bounded hero-tile scene,
  not the full-bleed painterly world shown behind the entire hub in every
  reference image. Games and Practice have no background art registry
  entries at all today.
- **Talki logo** (`brand.headerLogo`) — `EXISTING`, verify fit at
  landscape scale.
- **Yellow mascot** — `EXISTING`, two variants
  (`introAssets.star`, `homeAssets.heroStar`); Phase 18/20 must pick one.
- **Music control art** (`uiIcons.music`) — `EXISTING`.
- **Parent/profile control art** — `VERIFY`. `uiIcons.settings` exists but
  is not currently wired into `TopBar`; the reference shows a distinct
  small parent icon separate from the logo (see §4). No new art is
  strictly required if `uiIcons.settings` is reused, but the wiring
  decision is open.
- **Star/reward pill art** (`uiIcons.star`) — `EXISTING`.
- **Side navigation arrows** — `OPTIONAL / CAN-BE-UI`. `uiIcons.chevron`
  (a single left-pointing chevron) exists; the mirrored right-pointing
  arrow can be a transform, not new art.
- **Home category art** — `EXISTING` for all 10 built-ins: both
  `categoryIcons` (small, `assets/v2/categories/talki-cat-icon-*.png`) and
  `categoryArt` (hero-sized, `assets/v2/categories/talki-cat-art-*.webp`)
  are registered for animals/food/colors/home/family/body/actions/numbers/
  outside/emotions. `mine` has no dedicated art and falls back to
  `brand.starMark` — acceptable, matches legacy.
- **Game card art** — `EXISTING` for 7 of 11: memory, quiz, missing,
  cards, sounds, count, puzzle (`gameCardAssets` in `assets.ts`).
  **`NEEDED`/`DESIGN-BLOCKED` for 4: match, bubbles, sort, speech** — these
  render an emoji/plain card today (`src/domain/games/gameCards.ts`
  documents this split as inherited from legacy, not invented). The new
  art-dominant 3×2 Games hub (Phase 21) cannot claim full visual parity
  with the reference until these 4 illustrations exist.
- **Practice card art** — `NEEDED`/`DESIGN-BLOCKED` for **all 6**.
  `practiceIcons` only registers 4 small line-icons (bubble, focus,
  receptive, cloze) — not full card illustrations — and `temptation` and
  `pairs` have no icon at all. The current `PracticeMenuScreen` is a
  plain text list with zero art. Phase 22 is fully asset-blocked for the
  reference's art-dominant practice cards.

## 8. Test matrix / old-test impact

Current matrix (`apps/mobile/tests/e2e/viewports.ts`, 10 projects, drives
`playwright.config.ts`):

| name | size | orientation |
|---|---|---|
| iphone-se1 | 320×568 | portrait |
| android-compact | 360×800 | portrait |
| iphone-13 | 390×844 | portrait |
| iphone-pro-max | 430×932 | portrait |
| ipad-mini | 768×1024 | portrait |
| ipad-air | 834×1112 | portrait |
| landscape-844 | 844×390 | landscape |
| landscape-932 | 932×430 | landscape |
| tablet-4-3 | 1024×768 | landscape |
| tablet-16-10 | 1280×800 | landscape |

Roadmap's proposed Phase 17 matrix (`landscape-roadmap.md`, 8 entries, all
landscape): 667×375, 740×360, 844×390, 932×430, 1024×768, 1133×744,
1280×800, 1366×1024.

- **4 already exist** and match exactly: `landscape-844` (844×390),
  `landscape-932` (932×430), `tablet-4-3` (1024×768), `tablet-16-10`
  (1280×800) — same dimensions as the roadmap targets, different project
  names.
- **4 are net-new for Phase 17**: 667×375, 740×360, 1133×744, 1366×1024.
- **Recommendation, not a Phase 16 change**: the roadmap matrix is
  reasonable and requires no deviation; Phase 17 should add the 4 missing
  landscape projects and decide whether the 6 current portrait projects
  are retired for child screens or kept as a separate "parent forms"
  matrix (`interaction-map.md` explicitly keeps parent screens using
  controlled scrolling under the keyboard, which portrait-shaped viewports
  exercise more naturally than landscape ones).
- **Exactly two assertions depend on `BottomNavigation`** and will
  intentionally break once Phase 19 replaces it:
  - `tests/e2e/navigation.spec.ts:37` —
    `expect(page.getByTestId('tabs-bottom-nav')).toBeVisible()`
  - `tests/e2e/full-sweep.spec.ts:163` — same assertion.
  Neither is weakened or removed in this phase; Phase 19 must give the
  replacement navigation an equivalent testID and update these two lines
  as part of that phase's own scope.
- No test currently encodes "home/category must support portrait" by
  name, but `full-sweep.spec.ts` running all screens × all 10 viewports
  (6 of them portrait) implicitly exercises portrait child screens today.
  Once Phase 17 locks landscape everywhere, those 6 portrait runs against
  child screens stop being meaningful and Phase 17 must decide their fate
  explicitly (see recommendation above) rather than leaving them silently
  green against dead layout paths.
- Phase 14's `full-sweep.spec.ts` history recorded 20 failures (P14-M16)
  tied to games/stickers reachability. Current-run evidence for this phase
  is in `phase-16-report.md` (§ Playwright baseline).

## 9. Risks for Phase 17

1. `classifyDevice(width)` must move off width-only classification before
   any device-class-dependent landscape layout ships (§2).
2. `orientationPolicy` must cover `home`/`category`/`intro` as
   landscape-locked, and `practice`'s existing-but-dead `'landscape'`
   value needs an actual `applyFor('practice')` call site wired in (§3).
3. Replacing `BottomNavigation` (Phase 19) must give the new navigation an
   equivalent testID so the two now-orphaned assertions can be updated
   rather than silently dropped, and must account for the Phase 14
   mounted-tab defect class (P14-M16) rather than assuming a UI-only swap
   fixes it (§4).
4. World-background art (Home/Games/Practice) and 4 game-card + 6
   practice-card illustrations are `DESIGN-BLOCKED` (§7); Phases
   18/20/21/22 cannot claim visual completion until supplied.
5. Parent-entry icon and star/points-pill interactivity are open product
   decisions that the shared shell (Phase 18) must resolve explicitly,
   or Rewards reachability regresses once `BottomNavigation` is gone (§4,
   §7).
6. Phase 17 must explicitly decide the fate of the 6 current portrait
   viewport projects for child screens rather than leaving them
   ambiguous (§8).

## 10. No production UI behavior changed

Confirmed: this phase touched only files under `docs/migration/` and
`docs/design/landscape/`. No file under `apps/mobile/src/`,
`apps/mobile/app/`, or the repository-root legacy app was modified.
`tsc --noEmit`, `eslint .`, `vitest run` (5490/5490), and
`expo export --platform web` all pass unchanged — see
`phase-16-report.md` for exact command output.
