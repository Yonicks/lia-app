# Phase 2 prompt — Domain model, content and asset registry

Plan: [../phases/phase-02-plan.md](../phases/phase-02-plan.md)

Copy everything inside the fence below into a fresh agent session at the
repository root.

---

````text
You are executing Phase 2 of the Talki migration to Expo React Native.

Phase 2 ports Talki's content and rules into typed, DOM-free TypeScript, and
generates the static asset registry React Native requires. It creates NO user
interface. There is no screen in this phase.

Execute ONLY Phase 2.

The central risk here is silent corruption. If one Hebrew word loses a niqqud
mark, everything still compiles and renders, and a child hears the wrong
pronunciation forever. So the port is proven by comparing against the legacy
code directly, not by hand-written expectations.

=== TALKI MIGRATION — STANDING RULES (apply to every phase) ===

SOURCE OF TRUTH
- index.html at the repository root is the primary functional source of truth.
- Documents under docs/ are secondary and known to contain stale claims.
- Never infer a count, a colour, a key name or an algorithm. Read it.

DO NOT TOUCH THE LEGACY APP
- Do not move, rename, restructure or refactor index.html, audio-manager.js,
  assets/, tools/ (existing files), tests/, android/, ios/, capacitor.config.ts
  or manifest.json.
- Do not edit legacy source to make a new test pass. If legacy behaviour looks
  wrong, record it as a finding and preserve it anyway.
- The legacy test suites must still pass at the end of your phase.

THE WEB TARGET IS A TEST SURFACE
- It is never shipped. Do not make a decision for the browser's benefit.

FORBIDDEN
- No hand-copied vocabulary. Extract and compare.
- No hand-maintained require() list. Generate it.
- No weakening, skipping or deleting an assertion to make a run green.

SCOPE DISCIPLINE
- Execute only the phase you were given. Do not start the next one.
- Do not add a React component, a screen or a render function.
- If you finish early, deepen the tests. Do not scope-creep forward.

WHEN YOU ARE BLOCKED
- The phase plan lists open questions with a suggested default. Use the default
  and record that you did.

REPORTING
- Write docs/migration/phase-02-report.md before you stop.
- Every acceptance item gets an explicit PASS or FAIL.
- Paste real command output, not a summary of it.
=== END STANDING RULES ===

READ FIRST
1. docs/migration/phases/phase-02-plan.md   — your plan, read it fully
2. docs/migration/validation.md             — sections 2 and 6
3. docs/migration/phase-01-report.md        — the harness you will use
4. docs/migration/00-current-state.md       — section 6 vocabulary, section 7 progress
5. index.html lines 1383-1387, 1476-1650, 1823-1890, 2018, 2206-2225,
   2417-2447, 2489-2490, 2355-2377
6. assets/audio/audio-logic.js              — in full
7. tests/audio-logic.test.js                — the existing assertions you extend

GROUND TRUTH — do not deviate from any of this

art() at index.html 1476-1479 has a colours branch. Miss it and 26 images break:
    const art = (cat, slug) => {
      const file = cat === 'colors'
        ? `talki-colors-shapes-${slug}.png`
        : `talki-${cat}-${slug}.png`;
      return `assets/words/${cat}/${file}`;
    };

10 built-in categories, 182 built-in words:
    animals  26    food     26    colors   26    home     26
    outside  18    actions  16    family   12    body     12
    numbers  10    emotions 10

Item shape: { word, emoji, img, shape, sound? }
  - all 182 have word, emoji, img, shape
  - exactly 17 have sound
  - photo appears on custom words only
  - one word contains an escaped apostrophe: 'גִּ\'ירָפָה'

Category shape: { id, title, icon, cls, items[] }
  cls is a CSS class name with no React Native meaning. Carry it anyway —
  Phase 5 uses it as the category-to-colour mapping key.

Virtual category 'mine' is injected by allCats() at index.html 1831-1834:
    { id:'mine', title:'הַמִּלִּים שֶׁלִּי', icon:'💜', cls:'c-mine', items: custom }

11 game ids: quiz memory missing match cards sounds count sort bubbles puzzle speech
6 practice ids: focus receptive cloze temptation pairs combine

MIN_ITEMS has 16 entries (index.html 2489-2490); default for a missing key is 4:
    quiz 4, memory 4, match 4, missing 4, sort 4, receptive 4, sounds 4,
    puzzle 2, count 1, focus 1, temptation 1, bubbles 1, speech 2,
    combine 3, pairs 2, cloze 1

24 stickers with three unlock kinds (index.html 2417-2447):
    milestone set   -> learned.size >= milestone     (star 1, sparkle 25, gift 75)
    complete true   -> that whole category learned   (numbers)
    otherwise       -> learned.has(key(s.cat, s.word))

currentCategory() (index.html 2206-2216) has FOUR branches in this order:
    1. lastCat is set and that category is not fully learned -> return it
    2. highest completion-ratio partially-learned category
    3. first untouched category
    4. cats[0]
Branch 1 is the one most likely to be dropped. Test it explicitly, including
the case where another category has a higher ratio than lastCat.

Settings defaults (index.html 1647):
    { rate:0.85, niqqud:true, sounds:true, effects:true,
      music:true, musicVol:0.5, voice:true }
Plus two runtime keys absent from that literal, both of which must round-trip:
    lastBackup   ISO string, index.html 1771
    puzzleLevel  1..5,       index.html 2973-2978

Audio policy (assets/audio/audio-logic.js): 22 SFX events, 10 music states,
MAX_SIMULTANEOUS_SFX = 3, cooldowns tap 60 / answer 400 / celebration 800,
REWARD_SCREEN_MUSIC_MULTIPLIER = 0.72, duck priority speaking > listening >
voicePrompt with speaking hard-muting SFX to 0.

WORK ITEMS

1. Write tools/extract-legacy-domain.mjs.

   It reads index.html, extracts these constants, and writes
   docs/migration/fixtures/legacy-domain.json:
     CATEGORIES, PRACTICE_LIST, HOME_PRACTICE_HOME, MIN_ITEMS, STICKERS,
     CARRIERS, CLOZE, PAIRS, MODIFIERS, the K key patterns, the settings
     defaults literal, and the game id/title list.

   Preferred approach: locate each `const NAME = ` declaration and its matching
   closing brace or bracket, then evaluate that slice in a node:vm sandbox with
   the real art() implementation provided. Do not evaluate the whole inline
   script if you can avoid it.
   Fallback: evaluate the entire inline script in a sandbox with document,
   window and navigator stubbed. Record which route you took and why.

   The extractor must be re-runnable and produce stable, sorted JSON.

2. Port the domain into apps/mobile/src/domain/ following the file tree in the
   plan. This is a TRANSCRIPTION, not a redesign. Do not rename fields, do not
   normalise the model, do not introduce ids, do not flatten items into a table.
   Any such change makes the differential test impossible.

   Port: CATEGORIES, allCats() with the virtual 'mine', NIQQUD/display()/plain(),
   key(), totalWords(), catLearned(), currentCategory() all four branches,
   STAR_STEP/wordsToNextStar(), weightedPick(), markSeen(), game ids and titles,
   MIN_ITEMS, PRACTICE_LIST, HOME_PRACTICE_HOME, CARRIERS/CLOZE/PAIRS/MODIFIERS,
   STICKERS with stickerUnlocked(), settings defaults and types.

   Define the types in the plan: CategoryId, GameId, PracticeModeId, TalkiWord,
   TalkiCategory, WordStats, TalkiSettings.

   Do NOT port any render function, any DOM handling, or any HTML string.

3. Port assets/audio/audio-logic.js to
   apps/mobile/src/domain/audio/audioPolicy.ts.
   It is already DOM-free with no timers and no Audio(). Transcribe it directly.
   Keep every constant name and every numeric value identical.

4. Write tools/generate-mobile-asset-registry.mjs.

   It scans assets/words/, assets/v2/ and assets/audio/ and emits typed
   registry modules under apps/mobile/src/data/assets/ containing static
   require() calls. React Native cannot resolve a dynamic require path, which
   is why this is generated rather than dynamic.

   Requirements:
   - DETERMINISTIC. Sorted keys, stable formatting. Running twice produces
     byte-identical output. Your test will verify this.
   - EXCLUSIONS. assets/words/ contains files that are not word images: ten
     .gitkeep files and category covers such as assets/words/food/food.png.
     A word image matches talki-{cat}-{slug}.png, or
     talki-colors-shapes-{slug}.png for colours. Nothing else belongs.
   - The registry key is the legacy img path, so a TalkiWord.img value looks
     up directly.
   - No hand-maintained mappings. Never write 182 require() calls by hand.

   Run it and commit the generated files.

5. Write the four Tier 1 test files.

   apps/mobile/tests/unit/domain-parity.test.ts
     - ported CATEGORIES deep-equals fixtures/legacy-domain.json
     - 10 categories, 182 words, exact per-category split
     - every word string byte-identical, niqqud preserved
     - the count of items with a sound field matches legacy
     - PRACTICE_LIST, MIN_ITEMS (16 entries), STICKERS (24), CARRIERS, CLOZE,
       PAIRS, MODIFIERS and the settings defaults each deep-equal the fixture

   apps/mobile/tests/unit/audio-policy-parity.test.ts
     Load assets/audio/audio-logic.js with require() alongside the TypeScript
     port and compare them EXHAUSTIVELY, not by sampling:
     - computeDuckTarget over all 8 combinations of {speaking, listening,
       voicePrompt}
     - shouldPlaySfx over all 22 events crossed with t-1, t, t+1 at each of the
       60/400/800ms cooldown classes, and activeSfxCount 0..4
     - resolveMusicFile over all 10 mapped keys plus 'rewardScreen', null and
       unknown strings
     - effectiveMusicVolume and effectiveSfxVolume over a multiplier grid
       including out-of-range values that must clamp to [0,1]
     - cooldownFor and releaseDurationFor over every event and reason
     - NEVER_COMBINE pairs identical

   apps/mobile/tests/unit/progress.test.ts
     - currentCategory() all four branches, each asserted separately
     - explicitly: lastCat set and partially learned wins EVEN WHEN another
       category has a higher completion ratio
     - key(), totalWords() including custom words, catLearned()
     - plain() and display() under both niqqud settings
     - weightedPick() prioritises higher wrong counts
     - markSeen() increments seen, increments wrong on error, decrements on
       success but never below zero

   apps/mobile/tests/unit/asset-registry.test.ts
     - run the generator twice, assert byte-identical output
     - every one of the 182 img paths has a registry entry
     - every registry entry resolves to a file that exists on disk
     - no .gitkeep and no category cover in the registry
     - colours entries use the talki-colors-shapes- form

6. Write docs/migration/phase-02-asset-report.md with REAL measurements:
     - total asset count and total bytes
     - bytes per top-level directory under assets/
     - the twenty largest files
     - registry entry count per module
     - word images on disk referenced by no word (there are 183 talki-* PNGs
       against 182 words — find the extra one and name it, do not delete it)
     - word images referenced but missing from disk
     - the size of the expo export --platform web output
     - a bundle-strategy recommendation, explicitly deferred to a later decision

7. Run the gate:
     cd apps/mobile
     npx tsc --noEmit
     npx eslint .
     npx expo-doctor
     npx vitest run
     npx expo export --platform web
     npx playwright test        # Phase 1 smoke spec must still pass
   Then from the repository root:
     node tools/dev-server.js &
     BASE_URL=http://127.0.0.1:8000 python3 tests/test_suite.py
     BASE_URL=http://127.0.0.1:8000 python3 tests/interaction_suite.py
     node --test tests/audio-logic.test.js

DO NOT
- Do not build a screen, a component or a render function.
- Do not implement storage, audio playback, TTS or recording. Later phases.
- Do not change the legacy CATEGORIES to make extraction easier.
- Do not implement remote assets, lazy loading or image format conversion.
  Measure the 55 MB and report it; the decision is not yours to make here.
- Do not delete the unreferenced word image you find.

ACCEPTANCE CRITERIA — answer each PASS or FAIL in your report
- [ ] tools/extract-legacy-domain.mjs produces fixtures/legacy-domain.json and
      is re-runnable with stable output
- [ ] Ported domain deep-equals the fixture for every extracted constant
- [ ] 182 words with the exact per-category split, strings byte-identical
- [ ] The escaped apostrophe in 'גִּ\'ירָפָה' survives intact
- [ ] Exactly 17 items carry a sound field
- [ ] art() colours branch preserved; colours registry entries use
      talki-colors-shapes-
- [ ] tools/generate-mobile-asset-registry.mjs is deterministic across two runs
- [ ] Registry complete in both directions; no .gitkeep, no category covers
- [ ] Audio policy differential test passes over the full input matrix
- [ ] currentCategory() branch 1 (lastCat) asserted, including the case where
      another category has a higher ratio
- [ ] MIN_ITEMS has 16 entries and defaults to 4 for a missing key
- [ ] 24 stickers with all three unlock kinds implemented
- [ ] tsc --noEmit, eslint, expo-doctor clean
- [ ] vitest run green
- [ ] expo export --platform web succeeds
- [ ] playwright test still green
- [ ] phase-02-asset-report.md contains real measured numbers, and names the
      unreferenced word image
- [ ] No React component, screen or render function was added
- [ ] All three legacy suites still green

REPORT
Write docs/migration/phase-02-report.md using the headings in
docs/migration/validation.md section 7. For gate item 5, write "not applicable,
no UI in Phase 2 — substituted by phase-02-asset-report.md". The native-coverage
section is "not applicable, no native surface".

Then stop. Do not begin Phase 3.
````
