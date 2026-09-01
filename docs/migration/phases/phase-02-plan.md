# Phase 2 — Port the domain model, content and asset registry

**Prompt:** [../prompts/phase-02.md](../prompts/phase-02.md)
**Creates:** `apps/mobile/src/domain/`, `apps/mobile/src/data/`,
`tools/extract-legacy-domain.mjs`, `tools/generate-mobile-asset-registry.mjs`
**Ships:** no UI. This phase has no screen.

---

## Goal and rationale

Move Talki's valuable non-UI content and rules into typed, DOM-free TypeScript,
and generate the static asset references React Native requires.

This is the phase where a silent error is most expensive. If one of 182 Hebrew
words loses a niqqud mark, the app still compiles, still renders, still passes
a smoke test — and a child hears the wrong pronunciation for the rest of the
product's life. Nobody reviewing a 182-item diff in Hebrew will catch it.

So the central decision of this phase is not what to port but how to prove the
port is correct.

## Entry conditions

- `docs/migration/phase-01-report.md` exists with no critical FAIL.
- `apps/mobile` builds, `vitest` runs, `playwright test` runs.
- `docs/migration/00-current-state.md` section 6 describes the vocabulary.

## Design decisions

### Differential testing against extracted legacy data, not hand-written expectations

`tools/extract-legacy-domain.mjs` reads `index.html`, isolates the constant
declarations, evaluates them in a `node:vm` sandbox with a stub for `art()`,
and writes `docs/migration/fixtures/legacy-domain.json`. A vitest spec then
asserts the TypeScript port deep-equals that fixture.

The alternative — writing `expect(categories.animals.items).toHaveLength(26)`
by hand — tests the author's belief about the legacy app, and the entire risk
of a migration is that the belief is wrong. Extraction removes the human from
the comparison.

The extractor runs against `index.html`, not against a copy. If someone edits
the legacy vocabulary during the migration, the fixture regenerates and the
test fails, which is exactly the signal wanted.

Rejected alternative: copy the `CATEGORIES` literal into a `.ts` file and trust
the paste. Copy-paste of 112 lines of dense Hebrew with embedded escapes
(`'גִּ\'ירָפָה'` contains an escaped apostrophe) is precisely where corruption
enters.

### The port is a transcription, not a redesign

`CATEGORIES` becomes a typed structure with the same shape: `id`, `title`,
`icon`, `cls`, `items[]`, where each item is
`{ word, emoji, img, shape, sound? }`.

`cls` is a CSS class name and has no meaning in React Native. It is carried
anyway, because Phase 5 will map category identity to a colour and the legacy
class name is the existing mapping key. Dropping it now and reinventing the
mapping later invites drift.

Rejected alternative: normalising the model now — splitting words into a flat
table, introducing ids, renaming fields. Every such change makes the
differential test impossible and moves risk from a phase with a safety net into
one without.

### The asset registry is generated, never hand-written

React Native's bundler needs static `require()` calls; it cannot resolve
`require(dynamicPath)`. There are 183 word images plus roughly 155 v2 assets
plus 35 audio files.

`tools/generate-mobile-asset-registry.mjs` scans `assets/` and emits typed
registry modules. Requirements that matter:

- **Deterministic.** Sorted keys, stable formatting. Running it twice produces
  byte-identical output. The test runs it twice and diffs.
- **Exclusion rules.** `assets/words/` contains files that are not word images:
  ten `.gitkeep` files and category covers such as `assets/words/food/food.png`.
  Including them would create registry entries no word ever references and
  inflate the bundle. The rule is: a word image matches
  `talki-{cat}-{slug}.png`, or `talki-colors-shapes-{slug}.png` for colours.
- **Completeness in both directions.** Every `img` path produced by `art()` for
  all 182 words must have a registry entry, and every registry entry must
  resolve to a file that exists on disk. Both directions are asserted.

### The colours exception is real and must survive

`art()` (index.html 1476-1479):

```js
const art = (cat, slug) => {
  const file = cat === 'colors' ? `talki-colors-shapes-${slug}.png` : `talki-${cat}-${slug}.png`;
  return `assets/words/${cat}/${file}`;
};
```

Colours use `talki-colors-shapes-{slug}.png`, everything else uses
`talki-{cat}-{slug}.png`. A port that misses the branch breaks 26 images at
once, and only on one category, which is easy to miss in a spot check.

### Audio policy ports near-verbatim

`assets/audio/audio-logic.js` is already DOM-free CommonJS with no timers and
no `Audio()`. It becomes
`apps/mobile/src/domain/audio/audioPolicy.ts` as a direct transcription.

Because the original is `require()`-able, the differential test can load both
and compare them exhaustively rather than sampling. This is the cheapest
high-confidence test in the entire migration and it should be thorough:
`computeDuckTarget` over all eight flag combinations, `shouldPlaySfx` over all
22 events crossed with cooldown boundaries, and so on.

### Bundle size is measured now, decided later

Roughly 55 MB of assets across 384 files. That is heavy for an app binary but
not obviously fatal, and the right time to decide is when the number is known
rather than guessed.

Phase 2 measures and reports: total, per-directory, largest twenty files, and
what the web export produces. It does not implement remote assets, lazy
loading, or a format conversion. Those are product decisions with their own
trade-offs and belong in an explicit decision, not a side effect of a porting
phase.

## Legacy source mapping

| Behaviour | Legacy location |
|---|---|
| `art(cat, slug)` with the colours branch | index.html 1476-1479 |
| `CATEGORIES` | index.html 1480-1592 |
| `CARRIERS` | index.html 1597 |
| `CLOZE` | index.html 1600-1609 |
| `PAIRS` | index.html 1612-1620 |
| `MODIFIERS` | index.html 1623-1628 |
| `settings` defaults | index.html 1647 |
| `allCats()` and the virtual `mine` category | index.html 1831-1834 |
| `NIQQUD` regex, `display()`, `plain()` | index.html 1828-1830 |
| `key(catId, word)` | index.html 1837 |
| `totalWords()` | index.html 1838 |
| `catLearned(cat)` | index.html 1839 |
| `STAR_STEP`, `wordsToNextStar()` | index.html 1845-1846 |
| `weightedPick()` | index.html 1869-1877 |
| `markSeen()` | index.html 1878-1883 |
| `currentCategory()` — all four branches | index.html 2206-2216 |
| `PRACTICE_LIST` | index.html 2218-2225 |
| `HOME_PRACTICE_HOME` | index.html 1383-1387 |
| `STICKERS`, `stickerUnlocked()` | index.html 2417-2447 |
| `MIN_ITEMS` | index.html 2489-2490 |
| Game id list and titles | index.html 2355-2377 |
| `SPEECH_VIEWS` | index.html 2018 |
| Pure audio policy | assets/audio/audio-logic.js |

## Files to be created

```
tools/extract-legacy-domain.mjs             index.html -> fixtures/legacy-domain.json
tools/generate-mobile-asset-registry.mjs    assets/ -> typed require() registries

apps/mobile/src/domain/
├── types.ts                 CategoryId, GameId, PracticeModeId, TalkiWord, ...
├── vocabulary/
│   ├── categories.ts        the ported CATEGORIES
│   ├── allCats.ts           built-ins plus the virtual 'mine'
│   └── niqqud.ts            NIQQUD, display(), plain()
├── progress/
│   ├── keys.ts              key(catId, word)
│   ├── totals.ts            totalWords(), catLearned()
│   ├── currentCategory.ts   all four branches
│   ├── stars.ts             STAR_STEP, wordsToNextStar()
│   └── selection.ts         weightedPick(), markSeen()
├── games/
│   ├── ids.ts               the 11 game ids and titles
│   └── minItems.ts          MIN_ITEMS
├── practice/
│   ├── list.ts              PRACTICE_LIST, HOME_PRACTICE_HOME
│   └── content.ts           CARRIERS, CLOZE, PAIRS, MODIFIERS
├── rewards/
│   └── stickers.ts          STICKERS, stickerUnlocked()
├── settings/
│   └── defaults.ts          defaults plus the two runtime keys
└── audio/
    └── audioPolicy.ts       ported from assets/audio/audio-logic.js

apps/mobile/src/data/
└── assets/
    ├── words.generated.ts       182 word image requires
    ├── v2.generated.ts          UI art requires
    └── audio.generated.ts       music and sfx requires

apps/mobile/tests/unit/
├── domain-parity.test.ts        deep-equal vs legacy-domain.json
├── audio-policy-parity.test.ts  exhaustive diff vs audio-logic.js
├── progress.test.ts             currentCategory branches, key, totals
└── asset-registry.test.ts       determinism, completeness both ways

docs/migration/fixtures/legacy-domain.json
docs/migration/phase-02-asset-report.md
```

## Contracts introduced

```ts
export type CategoryId =
  | 'animals' | 'food' | 'colors' | 'home' | 'family'
  | 'body' | 'actions' | 'numbers' | 'outside' | 'emotions'
  | 'mine';

export type GameId =
  | 'quiz' | 'memory' | 'missing' | 'match' | 'cards'
  | 'sounds' | 'count' | 'sort' | 'bubbles' | 'puzzle' | 'speech';

export type PracticeModeId =
  | 'focus' | 'receptive' | 'cloze' | 'temptation' | 'pairs' | 'combine';

export interface TalkiWord {
  word: string;       // Hebrew, niqqud preserved
  emoji: string;
  img: string;        // legacy path, the registry key
  shape: string;      // puzzle dedup tag
  sound?: string;     // onomatopoeia, 17 items
  photo?: string;     // custom words only
}

export interface TalkiCategory {
  id: CategoryId;
  title: string;
  icon: string;
  cls: string;        // carried for the Phase 5 colour mapping
  items: TalkiWord[];
}

export interface WordStats { seen: number; wrong: number }

export interface TalkiSettings {
  rate: number; niqqud: boolean; sounds: boolean; effects: boolean;
  music: boolean; musicVol: number; voice: boolean;
  lastBackup?: string;   // ISO, set on export
  puzzleLevel?: number;  // 1..5, adaptive
}
```

## Behaviour to preserve exactly

- 182 built-in words. Per category: animals 26, food 26, colors 26, home 26,
  outside 18, actions 16, family 12, body 12, numbers 10, emotions 10.
- Every word string byte-identical to legacy, including niqqud and the escaped
  apostrophe in `גִּ\'ירָפָה`.
- 17 items carry a `sound` field; the rest do not.
- `art()` colours branch.
- `currentCategory()` returns `lastCat` first when that category is not fully
  learned.
- `totalWords()` includes custom words.
- `MIN_ITEMS` has 16 entries and the default for a missing key is 4.
- `plain()` always strips niqqud; `display()` strips only when
  `settings.niqqud` is false.
- `stickerUnlocked()` handles all three kinds: `milestone`, `complete`, word.

## Deliberate deviations

None. This phase is a transcription.

## Test plan

### Tier 1 — this is the whole phase

`domain-parity.test.ts`
- ported `CATEGORIES` deep-equals `legacy-domain.json`
- category count is 10, word total is 182, per-category counts match
- every `word` string matches byte for byte
- the count of items carrying `sound` matches legacy
- `PRACTICE_LIST`, `MIN_ITEMS`, `STICKERS`, `CARRIERS`, `CLOZE`, `PAIRS`,
  `MODIFIERS` and the settings defaults each deep-equal the fixture

`audio-policy-parity.test.ts`, loading `assets/audio/audio-logic.js` alongside
the port
- `computeDuckTarget` over all 8 combinations of the three flags
- `shouldPlaySfx` over all 22 events crossed with `t-1`, `t`, `t+1` at each
  cooldown class, and `activeSfxCount` 0 through 4
- `resolveMusicFile` over all 10 keys, `rewardScreen`, `null`, unknown strings
- `effectiveMusicVolume` and `effectiveSfxVolume` over a multiplier grid
  including out-of-range values that must clamp
- `cooldownFor` and `releaseDurationFor` over every event and reason
- `NEVER_COMBINE` pairs identical

`progress.test.ts`
- `currentCategory()` reaches all four branches, each asserted separately
- specifically: `lastCat` set and partially learned returns `lastCat` even when
  another category has a higher completion ratio
- `key`, `totalWords` including custom words, `catLearned`
- `plain` and `display` under both niqqud settings
- `weightedPick` prioritises higher `wrong` counts
- `markSeen` increments `seen`, increments `wrong` on error, decrements but
  never below zero on success

`asset-registry.test.ts`
- generator run twice produces byte-identical output
- every one of the 182 `img` paths has a registry entry
- every registry entry resolves to a file that exists
- no `.gitkeep` and no category cover such as `assets/words/food/food.png` in
  the registry
- colours entries use the `talki-colors-shapes-` form

### Tier 2

No UI exists. Per `validation.md` section 6, gate item 5 is replaced by
`docs/migration/phase-02-asset-report.md`.

`playwright test` must still pass — the Phase 1 smoke spec — proving the app
still builds and boots with the new modules present.

### Tier 3

Not applicable. No native surface.

## Screenshot manifest

None. This phase substitutes `docs/migration/phase-02-asset-report.md`
containing:

- total asset count and total bytes
- bytes per top-level directory
- the twenty largest files
- registry entry count per registry module
- word images present on disk but referenced by no word
- word images referenced but missing from disk
- the size of `npx expo export --platform web` output
- a recommendation on bundle strategy, explicitly deferred to a later decision

## Risks and open questions

**`node:vm` extraction may be fragile.** `index.html` is one large inline
script. Default: extract by locating the `const CATEGORIES = {` declaration and
its matching brace, rather than evaluating the whole script. Stub `art()` with
the real implementation so `img` paths come out correct. If a constant cannot
be extracted safely, fall back to evaluating the entire inline script in a
sandbox with `document`, `window` and `navigator` stubbed, and record which
route was taken.

**55 MB of assets.** Default: bundle everything and report the number. Do not
implement remote loading or format conversion in this phase.

**The 183rd word image.** `assets/words/` holds 183 `talki-*` PNGs against 182
words. Investigate and report which file is unreferenced. Do not delete it.

**`cls` has no React Native meaning.** Default: carry it. Phase 5 decides
whether to map it or replace it.

## Exit criteria

- [ ] `tools/extract-legacy-domain.mjs` produces `fixtures/legacy-domain.json`
      and is re-runnable
- [ ] Ported domain deep-equals the fixture for every extracted constant
- [ ] 182 words, correct per-category split, byte-identical strings
- [ ] `tools/generate-mobile-asset-registry.mjs` is deterministic across two runs
- [ ] Registry complete in both directions, exclusions correct
- [ ] Audio policy differential test passes over the full input matrix
- [ ] `currentCategory()` all four branches asserted, including `lastCat` first
- [ ] `tsc --noEmit`, `eslint`, `expo-doctor` clean
- [ ] `vitest run` green
- [ ] `expo export --platform web` succeeds
- [ ] `playwright test` still green (Phase 1 smoke spec)
- [ ] `docs/migration/phase-02-asset-report.md` written with real measurements
- [ ] No React component, no screen, no render function added
- [ ] All three legacy suites still green
- [ ] `docs/migration/phase-02-report.md` written
