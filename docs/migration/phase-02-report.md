# Phase 2 report — Domain model, content and asset registry port

## Summary

`apps/mobile/src/domain/` now exists: a typed, DOM-free TypeScript port of
Talki's vocabulary, progress, games, practice, rewards, settings and audio
logic, transcribed from `index.html` and `assets/audio/audio-logic.js`. Two
new extraction/generation tools exist alongside it —
`tools/extract-legacy-domain.mjs`, which reads `index.html` directly and
writes `docs/migration/fixtures/legacy-domain.json`, and
`tools/generate-mobile-asset-registry.mjs`, which scans `assets/words/`,
`assets/v2/` and `assets/audio/` and emits three typed `require()` registry
modules under `apps/mobile/src/data/assets/`. Four new Tier 1 vitest suites
(`domain-parity`, `audio-policy-parity`, `progress`, `asset-registry`) total
5,106 assertions, the overwhelming majority of them differential — the audio
policy suite alone exhaustively cross-checks 22 SFX events × cooldown
boundaries × active-count states plus a full volume-clamping grid against the
real `assets/audio/audio-logic.js`, and the domain suite deep-equals every
ported constant against the extracted fixture rather than a hand-written
expectation. No screen, component or render function exists in `apps/mobile`
after this phase — that is intentional per scope.

## Acceptance criteria

- [PASS] `tools/extract-legacy-domain.mjs` produces `fixtures/legacy-domain.json`
  and is re-runnable with stable output — verified by running it twice and
  diffing (`md5sum` identical both times, see Gate results §2 below and
  "Commands to reproduce").
- [PASS] Ported domain deep-equals the fixture for every extracted constant —
  `domain-parity.test.ts`, 18 assertions, all passing.
- [PASS] 182 words with the exact per-category split, strings byte-identical —
  animals 26, food 26, colors 26, home 26, outside 18, actions 16, family 12,
  body 12, numbers 10, emotions 10; asserted word-by-word against the fixture.
- [PASS] The escaped apostrophe in `'גִּ\'ירָפָה'` survives intact — asserted
  directly in `domain-parity.test.ts` ("preserves the escaped apostrophe...")
  and confirmed by inspecting the extracted fixture and generated
  `categories.ts` byte-for-byte.
- [PASS] Exactly 17 items carry a sound field — asserted against both the
  ported domain and independently re-derived from the fixture in the same
  test.
- [PASS] `art()` colours branch preserved; colours registry entries use
  `talki-colors-shapes-` — asserted in both `domain-parity.test.ts` (img path
  shape) and `asset-registry.test.ts` (all 26 colours registry keys).
- [PASS] `tools/generate-mobile-asset-registry.mjs` is deterministic across
  two runs — asserted by running the actual CLI as a subprocess twice and
  diffing file contents byte-for-byte, plus a second check at the pure
  scan-function level.
- [PASS] Registry complete in both directions; no `.gitkeep`, no category
  covers — all 182 `img` paths from the ported `CATEGORIES` have a registry
  entry, every registry entry resolves to a file that exists on disk, and no
  `.gitkeep`/`food.png`-style cover appears (excluded structurally by the
  word-image filename pattern, not by a maintained blocklist).
- [PASS] Audio policy differential test passes over the full input matrix —
  5,046 assertions in `audio-policy-parity.test.ts`: `computeDuckTarget` over
  all 8 flag combinations, `shouldPlaySfx` over all 22 events × {t-1, t, t+1}
  at each cooldown class × `activeSfxCount` 0..4 (plus dedicated
  sfxEnabled/speaking-block cases per event), `resolveMusicFile` over all 10
  keys + rewardScreen + null + unknown, `effectiveMusicVolume`/
  `effectiveSfxVolume` over a full multiplier grid including out-of-range
  values, `cooldownFor`/`releaseDurationFor` over every event/reason, and
  `NEVER_COMBINE` equality.
- [PASS] `currentCategory()` branch 1 (`lastCat`) asserted, including the case
  where another category has a higher ratio — `progress.test.ts` has a test
  named exactly for this: `lastCat` (12% learned) wins over `food` (92%
  learned) because `lastCat` is set and not yet finished. All four branches
  are asserted separately, including the "unresolvable lastCat id falls
  through" and "lastCat finished, falls through" edge cases.
- [PASS] `MIN_ITEMS` has 16 entries and defaults to 4 for a missing key —
  asserted in `domain-parity.test.ts` (16 entries, deep-equal to fixture) and
  the `minItemsFor()` helper's `|| 4` fallback is documented and matches
  legacy's `MIN_ITEMS[type] || 4` exactly (index.html 2492).
- [PASS] 24 stickers with all three unlock kinds implemented — `STICKERS` has
  24 entries (3 milestone, 1 complete, 20 word) deep-equal to the fixture;
  `stickerUnlocked()` is a direct transcription of index.html 2443-2446.
- [PASS] `tsc --noEmit`, `eslint`, `expo-doctor` clean — see Gate results §1.
- [PASS] `vitest run` green — 5,106/5,106, see Gate results §2.
- [PASS] `expo export --platform web` succeeds — see Gate results §3.
- [PASS] `playwright test` still green — 10/10 projects, see Gate results §4.
- [PASS] `phase-02-asset-report.md` contains real measured numbers, and names
  the unreferenced word image — **with a documented finding**: the phase
  prompt's own ground truth ("183 talki-\* PNGs against 182 words") does not
  hold in this working tree. Direct measurement (a Python script diffing
  every `art()` call in `index.html` against every `talki-*.png` under
  `assets/words/`, in both directions) found exactly 182 files matching the
  word-image pattern, all 182 referenced, zero orphans, zero missing. This is
  reported explicitly in `phase-02-asset-report.md` rather than either
  silently passing over the discrepancy or fabricating/deleting a file to
  make the prompt's premise true — see "Findings and drift" below.
- [PASS] No React component, screen or render function was added — verified
  by inspection: `apps/mobile/src/domain/` and `apps/mobile/src/data/assets/`
  contain no `.tsx` files, no JSX, no `react-native` component imports;
  `apps/mobile/app/` is untouched.
- [PASS] All three legacy suites still green — see Gate results §6.

## Gate results

### 1. Static checks

```
$ cd apps/mobile && npx tsc --noEmit
$ echo "exit: $?"
exit: 0

$ npx eslint .
$ echo "exit: $?"
exit: 0

$ npx expo-doctor
Running 21 checks on your project...
21/21 checks passed. No issues detected!
```

All three: **PASS**.

### 2. Tier 1 vitest

```
$ npx vitest run
 Test Files  5 passed (5)
      Tests  5106 passed (5106)
   Duration  781ms
```

Breakdown: `smoke.test.ts` (Phase 1, 1 test), `domain-parity.test.ts` (18),
`audio-policy-parity.test.ts` (5,046), `progress.test.ts` (30),
`asset-registry.test.ts` (11).

Extractor determinism, run separately (not a vitest assertion, a direct CLI
check):

```
$ node tools/extract-legacy-domain.mjs
wrote /home/jonathan/Git/talki/docs/migration/fixtures/legacy-domain.json (41384 bytes)
CATEGORIES: 10 categories, 182 words
GAMES: 11 entries
STICKERS: 24 entries
MIN_ITEMS: 16 entries
$ md5sum docs/migration/fixtures/legacy-domain.json
8061b810ed6a69e5401103447a1c738c  docs/migration/fixtures/legacy-domain.json
$ node tools/extract-legacy-domain.mjs > /dev/null
$ md5sum docs/migration/fixtures/legacy-domain.json
8061b810ed6a69e5401103447a1c738c  docs/migration/fixtures/legacy-domain.json
```

Identical hash both runs. **PASS**.

### 3. Web export

```
$ npx expo export --platform web
Web Bundled 284ms node_modules/expo-router/entry.js (562 modules)
...
Exported: dist
```

**PASS**. (See `phase-02-asset-report.md` for why the resulting `dist/` is
only ~1.1 MiB despite ~56 MB of assets existing on disk — nothing in
`app/` imports the new domain/registry modules yet, which is expected for a
phase with no screen.)

### 4. Tier 2 playwright

```
$ npx playwright test
  10 passed (1.6s)
```

All ten viewport projects (iphone-se1, ipad-mini, tablet-16-10, tablet-4-3,
ipad-air, landscape-932, iphone-13, landscape-844, android-compact,
iphone-pro-max) pass the Phase 1 smoke spec unchanged. **PASS**.

### 5. Screenshots

Not applicable, no UI in Phase 2 — substituted by
`docs/migration/phase-02-asset-report.md` (see that file for the full set of
real measurements: total asset bytes, per-directory breakdown, twenty largest
files, registry entry counts, orphan/missing-image analysis, web export size,
and a deferred bundle-strategy recommendation).

### 6. Legacy regression

```
$ node --test tests/audio-logic.test.js
ℹ tests 18
ℹ pass 18
ℹ fail 0

$ BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
============================================================
ALL CHECKS PASSED

$ BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
  ✓ 24 real nav taps in a row stay responsive

5. Patting a picture repeatedly scores once, not once per pat
  ✓ what's missing?: 4 taps = 1 point, 1 round
  ✓ cloze: 4 taps = 1 sentence
  ✓ jar: 4 taps = 1 word
  ✓ two-word: 4 taps = 1 phrase
  ✓ focused stimulation: 5 taps = 1 phrase
  ✓ speech: 4 skip taps = 1 word
  ✓ match: 4 taps on one pair = 1 match
  ✓ quiz: 4 taps = 1 point

5b. Back steps out of a game instead of closing Talki
  ✓ Back steps out of a game onto the menu it came from
  ✓ a second Back reaches home
  ✓ Back from the flashcards returns to the category it opened from
  ✓ replaying a round adds no extra Back steps

6. Every game can be played to its end, replayed, and left
  ✓ all 16 games finish, offer a replay, and let the child leave

7. Match & Drop puzzle — 🧩 שימי במקום
  ✓ opens from the Games screen under a real tap
  ✓ level 1 is a 2-piece board
  ✓ a wrong drop floats the piece back, no hint yet
  ✓ the second miss quietly shows where the piece belongs
  ✓ a third miss widens the snap so the child can still succeed
  ✓ a correct drag snaps in, locks, and completes its slot
  ✓ a sloppy drop near the shadow still counts
  ✓ pointercancel puts the piece back and clears the drag
  ✓ rapid taps place one piece once
  ✓ the whole board can be finished by tapping, no drag needed
  ✓ keyboard Enter drives the same tap-then-tap path
  ✓ the finished board offers a replay and a way home, and stops there
  ✓ 'עוד פעם' deals a fresh board
  ✓ a seeded board is reproducible, so tests never flake on word choice
  ✓ a board survives being resized onto a small phone or into landscape
  ✓ navigating away mid-drag lands safely on home

8. The puzzle board fits every supported screen
  ✓ iphone-se1 (320x568): puzzle usable and completable at every level
  ✓ android-compact (360x800): puzzle usable and completable at every level
  ✓ iphone-13 (390x844): puzzle usable and completable at every level
  ✓ iphone-pro-max (430x932): puzzle usable and completable at every level
  ✓ ipad-mini (768x1024): puzzle usable and completable at every level
  ✓ ipad-air (834x1112): puzzle usable and completable at every level
  ✓ landscape-844 (844x390): puzzle usable and completable at every level
  ✓ landscape-932 (932x430): puzzle usable and completable at every level

9. The puzzle is fully playable with reduced motion
  ✓ reduced motion: the board still drags, taps and completes

12. Games that ask a question say it out loud, once
  ✓ all 9 question games speak exactly one prompt on entry
  ✓ each quiz round speaks its word exactly once

12b. Category choice lives on the menus, not inside a round
  ✓ none of the 16 game screens contains a dropdown
  ✓ both menus offer a working category chooser
  ✓ the category chosen on the menu is the one the game is built from
  ✓ every category chip is at least 48px

13. Parent settings stay behind the gate
  ✓ the long-press into the parent screen lands on the gate, not on settings
  ✓ a wrong answer keeps it locked
  ✓ the correct answer opens parent settings
  ✓ leaving the parent screen re-locks it
  ✓ switching parent tabs keeps the screen open
  ✓ resetting progress confirms first and respects a cancel

10. Every game survives without speech, recording or an AudioContext
  ✓ all 16 games still open and finish with every audio API removed
  ✓ the parent recording screen refuses safely instead of throwing

11. Talki still runs after the network goes away
  ✓ boots from cache with the network gone
  ✓ games still open and render offline

============================================================
ALL INTERACTION CHECKS PASSED
```

(Truncated to the last 80 lines by the reproduce command's own `| tail -80`,
matching the phase prompt's specified invocation; the truncated head of the
run covers navigation-debounce and additional early sections not shown here.
Exit code 0.)

All three legacy suites: **PASS**, output pasted above in full.

### 7. This report

PASS.

## Native coverage

Not applicable, no native surface — Phase 2 adds no UI and touches no native
code. `apps/mobile`'s Android/iOS build targets are unchanged from Phase 1.

## Files created

- `tools/extract-legacy-domain.mjs` — reads `index.html`, isolates each
  target `const`/`let` declaration with a string-aware bracket scanner (so
  braces inside quoted Hebrew strings, e.g. `{w}` placeholders and the
  escaped apostrophe in `גִּ\'ירָפָה`, are never miscounted), evaluates each
  slice in a `node:vm` sandbox with the real `art()` implementation, and
  writes the sorted, deterministic `docs/migration/fixtures/legacy-domain.json`.
- `tools/generate-mobile-asset-registry.mjs` — scans `assets/words/`,
  `assets/v2/` and `assets/audio/`, applies the word-image filename pattern
  (excluding `.gitkeep` and category covers structurally, not via a
  blocklist), and emits three sorted, deterministic `require()` registry
  modules. Exposes its scan/render functions for direct import by the test
  suite as well as a CLI entry point.
- `docs/migration/fixtures/legacy-domain.json` — the extracted differential-
  testing fixture (CATEGORIES, CARRIERS, CLOZE, PAIRS, MODIFIERS, K key
  patterns, settings defaults, HOME_PRACTICE_HOME, PRACTICE_LIST, MIN_ITEMS,
  STICKERS, GAMES).
- `apps/mobile/src/domain/types.ts` — `CategoryId`, `GameId`,
  `PracticeModeId`, `TalkiWord`, `TalkiCategory`, `WordStats`,
  `TalkiSettings`, plus supporting content types.
- `apps/mobile/src/domain/vocabulary/art.ts` — ported `art(cat, slug)`,
  including the colours branch.
- `apps/mobile/src/domain/vocabulary/categories.ts` — ported `CATEGORIES`
  (182 words / 10 categories), mechanically generated from the extracted
  fixture rather than hand-typed.
- `apps/mobile/src/domain/vocabulary/allCats.ts` — `allCats()`/`getCat()`
  with the virtual `mine` category.
- `apps/mobile/src/domain/vocabulary/niqqud.ts` — `NIQQUD`, `display()`,
  `plain()`.
- `apps/mobile/src/domain/progress/keys.ts` — `key(catId, word)`.
- `apps/mobile/src/domain/progress/totals.ts` — `totalWords()`,
  `catLearned()`.
- `apps/mobile/src/domain/progress/currentCategory.ts` — `currentCategory()`,
  all four branches.
- `apps/mobile/src/domain/progress/stars.ts` — `STAR_STEP`,
  `wordsToNextStar()`.
- `apps/mobile/src/domain/progress/selection.ts` — `weightedPick()`,
  `markSeen()`.
- `apps/mobile/src/domain/games/ids.ts` — the 11 game ids/titles.
- `apps/mobile/src/domain/games/minItems.ts` — `MIN_ITEMS` (16 entries),
  `minItemsFor()`.
- `apps/mobile/src/domain/practice/list.ts` — `HOME_PRACTICE_HOME`,
  `PRACTICE_LIST`.
- `apps/mobile/src/domain/practice/content.ts` — `CARRIERS`, `CLOZE`,
  `PAIRS`, `MODIFIERS`.
- `apps/mobile/src/domain/rewards/stickers.ts` — `STICKERS` (24 entries),
  `stickerUnlocked()`.
- `apps/mobile/src/domain/settings/defaults.ts` — `DEFAULT_SETTINGS`.
- `apps/mobile/src/domain/audio/audioPolicy.ts` — ported
  `assets/audio/audio-logic.js`, near-verbatim.
- `apps/mobile/src/data/assets/words.generated.ts` — 182 word-image
  `require()`s, generated.
- `apps/mobile/src/data/assets/v2.generated.ts` — 155 UI-art `require()`s,
  generated.
- `apps/mobile/src/data/assets/audio.generated.ts` — 35 music/SFX
  `require()`s, generated.
- `apps/mobile/tests/unit/domain-parity.test.ts` — 18 assertions, deep-equal
  vs. the fixture.
- `apps/mobile/tests/unit/audio-policy-parity.test.ts` — 5,046 assertions,
  exhaustive diff vs. `audio-logic.js`.
- `apps/mobile/tests/unit/progress.test.ts` — 30 assertions,
  `currentCategory()` branches, `key`/`totals`/`niqqud`/`weightedPick`/
  `markSeen`.
- `apps/mobile/tests/unit/asset-registry.test.ts` — 11 assertions,
  determinism and both-direction completeness.
- `docs/migration/phase-02-asset-report.md` — real asset measurements,
  substituting for Tier 2 screenshots per validation.md §6 item 5.
- `apps/mobile/metro.config.js` — monorepo Metro config (see "Deviations").

## Dependencies added

None. No new npm package was added in this phase; the asset registries use
only `node:fs`/`node:path` (generator) and React Native's built-in
`require()` (generated modules).

## Deviations from the phase plan

The phase plan's own "Deliberate deviations" section says "None. This phase
is a transcription." The following are recorded because, while none of them
change any legacy algorithm or value, they are structural choices the plan's
text did not spell out:

1. **Domain functions take explicit parameters instead of closing over
   module-level mutable state.** Legacy's `allCats()`, `totalWords()`,
   `catLearned()`, `currentCategory()`, `weightedPick()`, `markSeen()` and
   `stickerUnlocked()` all read module-level `let custom = []`,
   `let learned = new Set()`, `let stats = {}`, `let lastCat = null`
   directly. Phase 2 explicitly has no storage layer ("Do not implement
   storage... Later phases"), so there is nothing for these functions to
   close over yet. The port instead takes `custom`, `learned`, `stats` and
   `lastCat` as parameters. Given identical inputs, every function's output
   is identical to legacy — this is a threading-of-state adaptation forced
   by scope ordering, not a behavioural or algorithmic change, and it is
   exactly what the differential tests (which must supply these values
   explicitly) required regardless.
2. **`apps/mobile/metro.config.js` added**, not listed in the plan's file
   tree. `assets/words/`, `assets/v2/` and `assets/audio/` live at the repo
   root, one level above the `apps/mobile` npm workspace package; Metro's
   default config only watches the project root, so `require()` calls from
   `apps/mobile/src/data/assets/*.generated.ts` reaching up to those
   directories need `watchFolders` extended to the monorepo root (the
   standard Expo monorepo pattern). No legacy file was moved, renamed or
   copied — only what Metro is allowed to read was widened.
3. **`rnd()`/`seedRandom()` (index.html 1852-1866) not ported as a module.**
   `weightedPick()` takes an injectable `rnd: () => number` parameter
   defaulting to `Math.random`, matching legacy's own fallback behaviour
   outside its `?seed=` test hook. The seeded-RNG hook is a Tier 2/browser
   test-surface concern tied to `location.search`, and Phase 2 has no UI to
   attach a seed query param to; porting it now would be scope creep ahead
   of whatever phase introduces game screens.
4. **`K` storage key patterns extracted but not ported to a TS domain
   module.** Work item 1 requires extracting `K` into the fixture (done —
   `custom`/`rec` function patterns resolved to their literal string form by
   invoking each once with a placeholder). Work item 2's explicit list of
   what to port into `apps/mobile/src/domain/` does not include `K`; adding
   storage-key-handling code with no storage layer to use it would be scope
   creep. Left for whichever phase introduces persistence.
5. **`TalkiWord.img`/`.shape` typed as optional**, where the plan's own
   `TalkiWord` interface snippet marks them required (only `sound`/`photo`
   optional). Custom ("mine") words never carry `img` or `shape` — legacy's
   own custom-item shape is `{id, word, emoji, photo}` (index.html
   1831-1834, confirmed against `docs/migration/00-current-state.md` §6). The
   port's types reflect this actual behaviour rather than the plan's
   contract-snippet, which did not go on to reconcile that with the "no
   `img`/`shape`/`sound` on custom words" text one paragraph above it in the
   same document.
6. **`apps/mobile/src/domain/vocabulary/art.ts` added as its own file.** The
   plan's file tree lists `categories.ts`, `allCats.ts`, `niqqud.ts` under
   `vocabulary/` but does not name a separate file for `art()`. Since
   `practice/content.ts` (CLOZE/PAIRS/MODIFIERS) also calls `art()` to
   re-derive its own `img` references, it was pulled into its own module
   inside the `vocabulary/` folder the plan already specifies, rather than
   duplicated or inlined only into `categories.ts`.

## Findings and drift

- **The "183rd word image" claim in the phase prompt and
  `docs/migration/phases/phase-02-plan.md` does not hold in this working
  tree.** Both state "assets/words/ holds 183 talki-\* PNGs against 182
  words" and instruct the report to name the unreferenced 183rd file.
  Measured directly (see `phase-02-asset-report.md` for the full script and
  output): `assets/words/` contains exactly 182 files matching the
  `talki-{cat}-{slug}.png` / `talki-colors-shapes-{slug}.png` pattern, and
  all 182 are referenced by exactly one `art()` call in `index.html` each —
  zero orphans, zero missing, in both directions. Per the standing rule that
  documents under `docs/` are secondary and known to contain stale claims,
  this is recorded as a finding rather than acted on as if it were still
  true; nothing was deleted or fabricated to make the premise match.
- **`audio-logic.js`'s `MUSIC_FILES` names only 10 of the 13 physical music
  tracks under `assets/audio/music/`.** `02_gameplay_bouncy.mp3`,
  `03_gameplay_curious.mp3` and `04_gameplay_gentle.mp3` exist on disk but
  are not mapped by any current `MUSIC_FILES` key. The asset registry
  includes all 13 anyway (registry completeness is defined by "resolves to a
  file that exists on disk," not by current usage), so nothing is lost if a
  future phase wires one of them in.
- **`assets/words/food/food.png`** (the `food` category's cover image,
  correctly excluded from the word registry since it doesn't match the
  `talki-food-{slug}.png` pattern) is, at 1.92 MB, the single largest image
  file in the project — larger than any of the 182 real word images. Noted
  in the asset report; not acted on, since Phase 2 does not touch existing
  asset files.

## Risks carried into the next phase

- **Bundle size is measured, not decided.** ~56 MB across 384 files, largely
  audio (~22 MB) and v2 UI art (~16 MB). No remote-loading or compression
  decision has been made; see `phase-02-asset-report.md`'s deferred
  recommendation. Whichever phase first builds a screen that imports these
  registries at scale should revisit the web/native bundle size at that
  point, not assume today's ~1.1 MiB web export number still applies.
- **No storage layer exists yet.** Every domain function that legacy backs
  with module-level mutable state (`learned`, `stats`, `custom`, `lastCat`,
  settings) now takes that state as an explicit parameter instead. The next
  phase that introduces persistence should be aware these functions are
  already pure and parameterized — it should wire a store *around* them,
  not modify their signatures back toward closing over globals.
- **`K` storage key patterns exist only in the fixture, not in a TS module.**
  Whichever phase adds persistence will need to port `K` itself at that
  point (the pattern for the two function-valued keys, `custom`/`rec`, is
  already captured in `docs/migration/fixtures/legacy-domain.json` as
  resolved placeholder strings, e.g. `"custom": "lia:custom:{id}"`).
- **Metro's `watchFolders` now includes the whole repo root**, which means
  Metro's file watcher covers the legacy web app, `android/`, `ios/`, and
  every other top-level directory too, not just `assets/`. This was
  necessary and did not break anything in this phase's gate, but a future
  phase adding heavier native tooling should be aware Metro's watch scope is
  wider than just `apps/mobile/` now.

## Commands to reproduce

```bash
# From the repo root:
node tools/extract-legacy-domain.mjs
node tools/generate-mobile-asset-registry.mjs

cd apps/mobile
npx tsc --noEmit
npx eslint .
npx expo-doctor
npx vitest run
npx expo export --platform web
npx playwright test

# From the repository root:
node tools/dev-server.js &
source .venv/bin/activate
BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
node --test tests/audio-logic.test.js
```
