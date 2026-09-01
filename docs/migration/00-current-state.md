# Talki — Current State Audit

The factual baseline for the React Native / Expo migration. Every claim here was
read out of the code at the commit named below, or produced by running the app.
Where an existing document disagreed with the code, the code won and the
disagreement is recorded in section 17.

Phase 14 grades the ported app against this document, so it is written to be
checkable rather than readable: line references over prose.

---

## 1. Provenance

| | |
|---|---|
| Commit | `edbe634eac2f23eec9a973f5b40d00db9680f623` (`edbe634`) |
| Subject | Add illustrated hero and category art to the home screen |
| Date | 2026-09-01 |
| Audited | 2026-09-01 |
| Working tree | clean apart from untracked `docs/migration/**` and the master plan |

Files inspected in full:

| File | Lines |
|---|---|
| `index.html` | 4307 |
| `audio-manager.js` | 269 |
| `assets/audio/audio-logic.js` | 162 |
| `sw.js` | 105 |
| `manifest.json` | 36 |
| `capacitor.config.ts` | 32 |
| `package.json` | 26 |
| `tools/prepare_www.js` | 41 |
| `tests/test_suite.py` | 485 |
| `tests/interaction_suite.py` | 1196 |
| `tests/audio-logic.test.js` | 139 |
| `.github/workflows/test-and-deploy.yml` | 103 |

Also inspected: `tools/sweep.js`, `tools/dev-server.js`, and the committed
native projects (`android/` 55 tracked files, `ios/` 20 tracked files).

Asset inventory: 384 files under `assets/`, of which 155 are the `assets/v2/`
illustration set and 35 are `.mp3` audio.

### Counts verified programmatically

Confirmed by loading the running app in Chromium and reading the live objects,
not by reading source. 21 assertions, 20 agreed with the seeded checklist:

| Claim | Result |
|---|---|
| 23 view ids in the `views` map | confirmed |
| 6 entries in `PRACTICE_LIST` | confirmed |
| 10 built-in categories | confirmed |
| 182 built-in words | confirmed |
| Per-category split 26/26/26/26/18/16/12/12/10/10 | confirmed |
| 24 entries in `STICKERS` | confirmed |
| 7 key patterns on `K` | confirmed |
| 16 entries in `MIN_ITEMS` | confirmed |
| 22 keys in `SFX_FILES` | confirmed |
| 10 keys in `MUSIC_FILES` | confirmed |
| 17 items carrying a `sound` field | confirmed |
| All 182 items carry `img`, `shape` and `emoji` | confirmed |
| `BACKUP_VERSION` 1, `STAR_STEP` 10, `MAX_SIMULTANEOUS_SFX` 3 | confirmed |
| `REWARD_SCREEN_MUSIC_MULTIPLIER` 0.72 | confirmed |
| `COOLDOWN_MS` `{tap:60, answer:400, celebration:800}` | confirmed |
| `PUZZLE_STEPS` `[2,3,4,5,6]` | confirmed |
| **11 games reachable through `startGame`** | **wrong — see below** |

`startGame` accepts **16** types. Ten are games and six are the practice modes.
The seeded checklist said 11 games because it counted `cards`, which has a
`data-game` attribute and a menu tile but no `startGame` branch and no
`MIN_ITEMS` entry. `tests/test_suite.py` reports "all 17 games open" because it
collects `[data-game]` across three views, giving 10 + 6 + `cards`. All three
numbers describe the same reality. The checklist has been corrected to 10.

---

## 2. Application shape

Single HTML file. No build step, no framework, no module system: one inline
`<script>` plus two external scripts (1354-1355).

**Entry.** `index.html` loads, `loadAll()` reads persisted state and calls
`render()` (1801-1812). A full-screen `#gate` overlay ("מתחילים!", 1322-1326)
sits on top until tapped, because Safari refuses `AudioContext` and
`speechSynthesis` without a real user gesture (comment 4065-4067).

**Start gate click** (4233-4248) does, in order: `unlockAudio()`,
`AudioManager.unlock()`, `keepAwake()`, `lockPortrait()`, `startMusic()` if
enabled, `startAds()`, `playIntro()` if enabled, fade the gate out over 320 ms,
then honour `?game=` by calling `launch()`.

**Render loop.** One global `view` string and one `render()` that replaces
`app.innerHTML` wholesale from a `views` map (2085-2116), then re-binds every
handler via `bind()`. There is no diffing and no component model. State lives in
module-level `let` bindings: `view`, `activeCat`, `game`, `learned`, `stats`,
`custom`, `recordings`, `settings`.

Consequences that matter for the port:

- Any state change that must show requires a full re-render, so DOM identity is
  never stable. Two places deliberately bypass `render()` to avoid destroying
  in-flight speech: word tiles mutate classes in place (3435-3454) and the
  cloze timer survives same-view re-renders (2101-2106).
- `bind()` re-attaches every listener on every render. `tests/interaction_suite.py`
  has a dedicated listener-growth test because of this.

**Navigation.** `render()` writes `document.body.dataset.view` (2109), used by
CSS for per-view backgrounds (184-205). History is synced with `syncHistory()`
and hardware back is intercepted (2118-2147) so back navigates within the app
instead of exiting.

**Re-lock on leaving parent.** `render()` clears `unlocked` whenever the
previous view was `parent` and the new one is not (2094-2099).

---

## 3. Views — 23

All 23 ids in the `views` map (2085-2093), in declaration order:

| # | id | Render function |
|---|---|---|
| 1 | `home` | `renderHome` |
| 2 | `category` | `renderCategory` |
| 3 | `cards` | `renderCards` |
| 4 | `games` | `renderGamesMenu` |
| 5 | `practice` | `renderPractice` |
| 6 | `stickers` | `renderStickers` |
| 7 | `quiz` | `renderQuiz` |
| 8 | `memory` | `renderMemory` |
| 9 | `missing` | `renderMissing` |
| 10 | `match` | `renderMatch` |
| 11 | `speech` | `renderSpeech` |
| 12 | `parent` | `renderParent` |
| 13 | `bubbles` | `renderBubbles` |
| 14 | `sounds` | `renderSounds` |
| 15 | `count` | `renderCount` |
| 16 | `sort` | `renderSort` |
| 17 | `focus` | `renderFocus` |
| 18 | `cloze` | `renderCloze` |
| 19 | `temptation` | `renderTemptation` |
| 20 | `receptive` | `renderReceptive` |
| 21 | `pairs` | `renderPairs` |
| 22 | `combine` | `renderCombine` |
| 23 | `puzzle` | `renderPuzzle` |

An unknown `view` falls back to `renderHome` without clearing
`body.dataset.view` (2109).

Visual baseline: all 23 plus `parent-locked` and `category-animals`, at ten
viewports, under `docs/migration/screenshots/legacy-baseline/`.

---

## 4. Games — 10

Shared entry is `startGame(type, catId)` (2491-2551), then `launch()` (2552-2555).

### `startGame` algorithm

1. `need = MIN_ITEMS[type] || 4`.
2. Resolve the category: the requested `catId`, else the **first** category in
   `allCats()` with at least `need` items.
3. If none qualifies, set `view='home'` and return `false`.
4. Set `activeCat`, `view = type`, fire `game.levelStart`.
5. Run the per-type initialiser.

`launch()` toasts `'צריך לפחות 4 מילים בקטגוריה'` on failure — hardcoded to 4
even when `need` is 1 or 2 (defect D7).

`MIN_ITEMS` (2489-2490), all 16 entries:

```
quiz 4  memory 4  match 4  missing 4  sort 4  receptive 4  sounds 4  puzzle 2
count 1  focus 1  temptation 1  bubbles 1  speech 2  combine 3  pairs 2  cloze 1
```

### `weightedPick` and `markSeen` (1869-1883)

```
weight = 1 + wrong*3 - min(seen,4)*0.4 + rnd()*1.2
```

Items are scored, sorted descending, and the top `n` taken. This is a
deterministic sort over a randomised score, **not** probabilistic sampling — a
distinction the port must preserve.

`markSeen(catId, word, wrong)` increments `seen`; on wrong it increments
`wrong`, on correct it decrements `wrong` toward a floor of 0.

### The ten games

| Game | Title | Min | Rounds | Ends after |
|---|---|---|---|---|
| `quiz` | 🎧 איפה ה...? | 4 | pool of up to 8 | pool exhausted |
| `memory` | 🃏 משחק זיכרון | 4 | 6 pairs / 12 cards | all matched |
| `missing` | 🙈 מה נעלם? | 4 | 5 | 5 rounds |
| `match` | 🔗 חיבורים | 4 | up to 5 pairs | all matched |
| `speech` | 🎤 תגידי את זה | 2 | pool of up to 6 | pool exhausted |
| `bubbles` | 🫧 בועות מילים | 1 | 12 pops | 12 pops |
| `sounds` | 🐮 מי אמר את זה? | 4 | 6 | pool exhausted |
| `count` | 🔢 כמה יש? | 1 | 5 | 5 rounds |
| `sort` | 📦 לאיזו קופסה? | 4 | 6 | 6 rounds |
| `puzzle` | 🧩 שִׂימִי בַּמָּקוֹם | 2 | one board | all pieces placed |

**quiz** (2560-2583, 3488-3510). Pool `weightedPick(items, cat, min(8,n))`;
each round one target and 3 distractors, shuffled. Correct: lock, `chime(true)`,
score and streak up, confetti every third streak, `learned.add`, advance after
**750 ms**. Wrong: `chime(false)`, streak reset, wrong class cleared after
**420 ms**, does not advance. `markSeen` on every answer.

**memory** (2585-2600, 3512-3533). `weightedPick(…, 6)` → 12 shuffled cards.
Speaks the word on flip. Mismatch flips back after **900 ms**. `learned.add` on
each matched pair. **No `markSeen`.**

**missing** (2602-2628, 3535-3558). Four items shown, one removed. Phase
`show` → `ask` after **2600 ms**, then TTS `'מָה נֶעֱלַם?'`. Correct advances
after **900 ms**, wrong after **500 ms**. Five rounds.

**match** (2630-2642, 3560-3577). Tap a word on the left then a picture on the
right. Wrong flash **420 ms**. `markSeen` on every attempt.

**speech** (2644-2661, 3590-3595, 3841-3876). Mic-driven; see section 12 for
recognition. Correct advances after **1200 ms**; wrong retries the same word.
Skip advances without scoring or `markSeen`.

**bubbles** (2663-2700, 3597-3602). Twelve pops, no way to lose (comment 2663).
Bubbles spawn at 0/700/1400 ms then every **1400 ms**; each floats for a random
**8-12 s**; pop animation **280 ms**; done render after **400 ms**.
`learned.add` on first pop of a word. **No `markSeen`.**

**sounds** (2702-2719, 3604-3621). Ignores the chosen category entirely: always
`CATEGORIES.animals` filtered to the 17 items with a `sound` field (2520-2523),
`activeCat` forced to `animals`. Plays the sound once per round. Correct advances
after **1100 ms**, wrong flash **420 ms**.

**count** (2721-2743, 3623-3636). Prefers items without a `photo`. Count is
`1 + floor(rnd*5)`, so 1-5, spoken from `NUM_WORDS`. Correct advances after
**1300 ms**. **Writes neither `learned` nor `stats`** — verified at 3628-3636.
The only game that contributes nothing to progress (defect D8).

**sort** (2745-2761, 3638-3654). Picks **two random categories** with 4+ items
and one item from the first; the active category is not the item source.
`markSeen` and `learned.add` use `game.right.id`, the item's true category.
Correct advances after **1100 ms**.

**puzzle** — see section 4a.

### Completion screen

`doneCard(score, total, best, extra)` (3204-3215): mascot, three stars, "כל
הכבוד!", `{score} מתוך {total}`, optional best streak and extra note, then
"לשחק שוב" and "🏠 הביתה".

Star thresholds, verified at 3205-3206: **3 stars at ratio ≥ 0.85, 2 at ≥ 0.5,
otherwise 1.** Never zero.

The puzzle has its own `puzzleDoneCard()` (2872-2887) with different thresholds:
3 stars at `misses ≤ 1`, 2 at `misses ≤ 4`, otherwise 1. Every third board it
adds a random `PUZZLE_TOGETHER` prompt.

### 4a. Puzzle subsystem (2764-3059)

- `PUZZLE_STEPS = [2,3,4,5,6]` (2776), indexed by `settings.puzzleLevel`
  (1-based, clamped 1-5, 2791-2797), further capped by `puzzleCapacity()`
  which is screen-size derived (2785-2789).
- Items via `puzzlePick` → `weightedPick` plus a visual dedup on first letter
  and `shape` so pieces stay distinguishable (2802-2819).
- **Pointer events, not HTML5 drag** (2985-3037). `setPointerCapture`, movement
  applied as `translate3d` inside rAF, drag threshold **8 px**.
- Also fully playable by tapping a piece then a slot (3048-3057), which is what
  makes it work under assistive settings.
- Drop resolution `puzzleSlotUnder()` (2902-2914): nearest empty slot within
  `max(w,h) * tolerance`, or bounding-box overlap.
- Adaptive magnetism: tolerance starts at **0.9** (2832); after a piece's third
  miss it grows by **0.4** up to a cap of **2.2** (2945). After a second miss the
  correct slot is hinted (2944, 2950-2953). Float-back animation **320 ms**.
- `puzzleAdvance()` (2973-2978): `misses ≤ 1` levels up (max 5), `misses ≥ 5`
  levels down (min 1), otherwise unchanged. Persisted to `settings.puzzleLevel`.
- Under `prefers-reduced-motion` the global rule at 684-686 kills transitions and
  animations; dragging still works because the transform is applied from JS.

---

## 5. Practice modes — 6

`PRACTICE_LIST` (2218-2225). These are clinical routines, so the timings below
are requirements, not implementation details.

| id | Title | Subtitle |
|---|---|---|
| `focus` | מילה במיקוד | מילה אחת, שמונה משפטים קצרים |
| `receptive` | תראי לי | מזהים בלי צורך לדבר |
| `cloze` | משלימים ביחד | עוצרים מילה לפני הסוף ומחכים |
| `temptation` | הצנצנת | משמיעים קול כדי לפתוח |
| `pairs` | דומה אבל לא | עֵץ או עֵז? מבחינים בין צלילים |
| `combine` | שתי מילים | מחברים "עוד" + מילה |

`HOME_PRACTICE_HOME` (1383-1387) surfaces only three of these on the home
screen — `focus`, `receptive`, `cloze` — with variants `pink`, `lavender`,
`orange`. Note `PRACTICE_LIST` gives `cloze` the variant `peach` while
`HOME_PRACTICE_HOME` gives it `orange`; the two lists are independent.

**focus** — focused stimulation. One target word modelled 8 times, once per
`CARRIERS` template. Tapping the card advances and speaks the next carrier
(3657-3671). No timers. Completing all 8 fires `confetti(26)` and `markSeen`
with `wrong=false`. "עוד מילה" picks a fresh weighted word (3672).

**receptive** — comprehension before production; the child points, never speaks.
Eight rounds (3149-3155). Starts at **2** options and adapts: three correct in a
row raises the level (max 4 options) with a "עולים רמה 🎉" toast; two misses at a
level above 2 lowers it. Prompt is `'תַּרְאִי לִי ' + word`. Correct advances after
**1100 ms**; wrong clears after **420 ms**.

**cloze** — the clinically load-bearing one. Six items from `CLOZE`. Each item:
speak the incomplete phrase, then switch to a waiting state showing "מחכים... תני
לה חמש שניות שלמות", then **wait exactly 5000 ms** (`setTimeout` at 3114) before
modelling the answer as `answer. phrase answer`. The pause is the intervention.
The timer handle `clozeTimer` is cleared on view change (2105) and in
`clozeNext` (3119), and `render()` deliberately does **not** cancel TTS when
staying on or entering `cloze` (2106). Scoring is manual: the adult taps
"✅ היא אמרה!" (3676-3681) or "להמשיך ◀" to skip without scoring.

**temptation** — communication temptation. A desired item is behind a jar; **any**
communicative attempt opens it. `listenForAnything()` (3895-3917) sets
`interimResults = true` and opens the jar on either `onresult` **or**
`onspeechstart` — so a sound with no recognisable transcript still counts, which
is the whole point. Listening auto-stops after **8000 ms** without opening the
jar. There is always a manual "👐 לפתוח" bypass (3690), and if recognition is
unavailable a toast points the adult at it. On open: chime, `confetti(22)`, mark
learned, say the word, then after **300 ms** speak `'הִנֵּה {w}! {w}'`.

**pairs** — minimal pairs, perception before production. Six rounds drawn from
the seven `PAIRS`. Speaks the target; correct advances after **1200 ms** with
`'כֵּן, {w}'`; wrong speaks the contrast `'זֶה {other}. אֲנִי אָמַרְתִּי {target}'`
and clears after **600 ms**. Does not write to `learned`.

**combine** — two-word combinations with adult expansion. Three pictures and the
four `MODIFIERS`. Tapping a picture speaks `modifier + word`, then after
**250 ms** speaks the expansion template. Six combinations, then a **2600 ms**
delay before the done screen with `confetti(28)`.

### Phrase lists

- `CARRIERS` (1597), 8 templates: `הִנֵּה {w}`, `עוֹד {w}`, `וַואו, {w}!`,
  `אֵיפֹה {w}?`, `זֶה {w}`, `{w} שֶׁלִּי`, `בַּיי בַּיי {w}`, `אֲנִי רוֹאָה {w}`.
  Consumed one per `focus` step.
- `CLOZE` (1600-1609), 8 `{phrase, answer, emoji, img?}` routines. Six sampled
  per session.
- `PAIRS` (1612-1620), 7 minimal pairs: עֵץ/עֵז, יָד/יָם, בַּיִת/זַיִת, סִיר/שִׁיר,
  כַּף/כַּד, דֹּב/דָּג, תַּפּוּחַ/תַּפּוּז. Six sampled per session.
- `MODIFIERS` (1623-1628), 4 `{w, expand}`: עוֹד, אֵין, גָּדוֹל, שֶׁלִּי.

---

## 6. Vocabulary

Ten built-in categories, 182 items (1480-1592).

| id | Title | Icon | CSS class | Items |
|---|---|---|---|---|
| `animals` | חיות | 🐶 | `c-animals` | 26 |
| `food` | אוֹכֶל | 🍎 | `c-food` | 26 |
| `colors` | צְבָעִים וְצוּרוֹת | 🎨 | `c-colors` | 26 |
| `home` | בַּבַּיִת | 🧸 | `c-home` | 26 |
| `outside` | בַּחוּץ | 🌳 | `c-outside` | 18 |
| `actions` | פְּעוּלוֹת | 🏃 | `c-actions` | 16 |
| `family` | מִשְׁפָּחָה | 👨‍👩‍👧 | `c-family` | 12 |
| `body` | הַגּוּף | 👀 | `c-body` | 12 |
| `numbers` | מִסְפָּרִים | 🔢 | `c-numbers` | 10 |
| `emotions` | רְגָשׁוֹת | 😊 | `c-emotions` | 10 |

**Item shape.** Every one of the 182 items has `word`, `emoji`, `img` and
`shape` — verified programmatically. 17 items additionally carry `sound`, all in
`animals`, and those 17 are the entire content of the `sounds` game.

**`art(cat, name)`** (1476-1479) builds the illustration path. Because it is a
pure string helper, every image is resolvable statically — which is what makes a
generated asset registry possible in the port, where `require()` cannot take a
dynamic path.

**Custom words.** `allCats()` (1831-1834) shallow-copies the ten built-ins and
appends a synthetic eleventh, `{id:'mine', title:'הַמִּלִּים שֶׁלִּי', icon:'💜',
cls:'c-mine', items:custom}`. Custom items have `{id, word, emoji, photo}` and
carry no `img`, `shape` or `sound`; `media()` (2069-2072) falls back to `photo`
then `emoji`.

**Niqqud.** Words are stored fully pointed. `display()` (1829) strips the
`[\u0591-\u05C7]` range when `settings.niqqud` is off; `plain()` always strips it
for speech and comparison. The port must keep these two paths distinct: what is
shown and what is spoken are different strings.

---

## 7. Progress

- **Key format** is `` `${catId}:${word}` `` via `key()` (1837), with the word
  fully pointed. Progress keys therefore embed niqqud.
- **`learned`** is a `Set` of those keys, persisted as an array.
- **Points** shown in the header are simply `learned.size` (2075-2079).
- **`totalWords()`** and **`catLearned(cat)`** (1839) count against
  `cat.items`.
- **`STAR_STEP = 10`** (1845); `wordsToNextStar()` is `10 - (learned.size % 10)`.
- **`celebrate()`** (2049-2057) fires only from the category word-tile path when
  a *new* word takes `learned.size` to a multiple of 10 (3445-3451). It is gated
  on `settings.effects`, plays `reward.unlock`, shows an overlay for **1700 ms**
  plus a **320 ms** fade. Games that add words do not trigger it.

**`currentCategory()`** (2206-2216) drives the home hero. Read directly from the
source, over the non-empty categories:

1. `lastCat`, if it resolves **and is not yet fully learned**. The comment at
   2209-2210 is explicit that a finished category is skipped so the hero never
   offers to continue something with nothing left in it.
2. Otherwise, of the categories that are strictly in progress
   (`0 < catLearned < items.length`), the one with the **highest completion
   ratio**.
3. Otherwise the first category with nothing learned.
4. Otherwise `cats[0]`.

`activeCat` plays no part in this function.

`lastCat` is persisted under **`lia:lastcat`** and written only by `enterCat()`
(1823), which is called only from deliberate category navigation (3414-3420).
`startGame` also assigns `activeCat` but does not persist it, because it may
have fallen back to a category the child never chose — the comment at 1818-1822
is explicit about this.

---

## 8. Persistence

**Backends** (1654-1745), chosen by `Store.detect()` (1693-1697) in order:

1. `indexeddb` — DB `lia-words`, store `kv`, version 1 (1663).
2. `artifact` — `window.storage`, values JSON-stringified.
3. `memory` — a `Map`, and also a write-through cache for the other two.

Every read falls back to the in-memory `Map` on failure, and every write updates
it first (1713, 1721), so the app never crashes on storage failure — it silently
degrades to session-only.

**The seven keys** (1633-1637):

| Pattern | Literal | Value |
|---|---|---|
| `K.progress` | `lia:progress` | array of `"cat:word"` |
| `K.settings` | `lia:settings` | the settings object |
| `K.stats` | `lia:stats` | map `"cat:word"` → `{seen, wrong}` |
| `K.customIndex` | `lia:custom:index` | array of custom ids |
| `K.custom(id)` | `lia:custom:<id>` | `{id, word, emoji, photo}` |
| `K.rec(k)` | `lia:rec:<cat>:<word>` | **data-URL string** |
| `K.lastcat` | `lia:lastcat` | category id string |

**Recordings are data URLs, not Blobs** (3946-3949), and there is **no index
key** for them. They are discovered per word by `preloadRecs()` (3921-3926) or
lazily in `say()` (1938-1939); only backup enumerates them, via `Store.keys()`.
This shapes the port: RN will store recordings as files on disk and must
synthesise data URLs at backup time to stay V1-compatible.

**Failure surfacing.** Only the recording path checks whether a write succeeded
(3948-3950), toasting `'ההקלטה נשמרה לפעילות הנוכחית בלבד'` when it did not.
Progress, stats, settings and custom-word writes fail silently (defect D5). The
parent screen does show the active backend, in red with "זיכרון זמני — לא יישמר!"
when it is `memory` (3827-3832).

---

## 9. Settings

Defaults (1647):

```js
{ rate:0.85, niqqud:true, sounds:true, effects:true, music:true, musicVol:0.5, voice:true }
```

| Field | Default | Written by |
|---|---|---|
| `rate` | 0.85 | parent segmented control, 0.6 / 0.85 / 1 (3257-3259, 3773) |
| `niqqud` | true | parent toggle (3260, 3774) |
| `music` | true | parent toggle (3261) and the header music button (4048, 2027) |
| `musicVol` | 0.5 | parent control, 0.25 / 0.5 / 0.85 (3262-3264, 3781) |
| `sounds` | true | parent toggle (3265, 3777) |
| `voice` | true | parent toggle (3266, 3778) |
| `effects` | true | parent toggle (3267); also gates confetti and the intro |
| `lastBackup` | *absent* | written by `exportBackup` (1771), displayed only |
| `puzzleLevel` | *absent* | written by `puzzleAdvance` (2978), no UI |

`lastBackup` and `puzzleLevel` are **not** in the defaults object but are
persisted into the same key. `loadAll` uses `Object.assign(settings, stored)`
(1807), so unknown stored fields survive. The port's settings type must include
both or silently drop the puzzle level and backup timestamp on first write.

---

## 10. Backup

`BACKUP_VERSION = 1` (1752). `exportBackup` (1753-1774) produces:

```js
{ app:'talki', version:1, exported_at:<ISO>, word_count:learned.size, data:{<every store key>} }
```

`data` is built by iterating `Store.keys()`, so it includes recordings and custom
words. Downloaded as `talki-backup-YYYY-MM-DD.json`. Export also sets
`settings.lastBackup` and toasts `'גיבוי נשמר 💾'`.

`importBackup(file, mode)` (1776-1798) accepts **`app === 'talki'` or
`app === 'lia-words'`** (the former name), and requires `payload.data`.

- Bad JSON → `'הקובץ אינו תקין'`.
- Wrong app or missing data → `'זה לא קובץ גיבוי של Talki'`.
- **replace**: delete every existing key first (1783-1784), then write all.
  Guarded by a `confirm()` (3822).
- **merge**: only `K.progress` is special-cased, as a deduped set union
  (1788-1790). Every other key is overwritten wholesale — merge does **not**
  merge stats, settings or custom words.
- Keys present in the file but unknown to the app are written as-is.
- Afterwards `recordings`, `learned`, `stats` and `custom` are reset and
  `loadAll()` re-reads everything (1795-1797), then
  `` toast(`שוחזרו ${entries.length} פריטים ✅`) ``.

Backup is the migration's data bridge, so this contract is frozen: the RN app
must read a V1 file byte-compatibly and should keep writing `app:'talki'`
with `version:1`.

---

## 11. Audio

Split across a pure policy module and a DOM runtime — a split the port should
keep, because the pure half ports almost verbatim.

**`assets/audio/audio-logic.js`** (162 lines, no DOM) exports `MUSIC_FILES`,
`SFX_FILES`, `DUCK`, `VOLUMES`, `COOLDOWN_MS`, `MAX_SIMULTANEOUS_SFX`,
`ANSWER_EVENTS`, `CELEBRATION_EVENTS`, `NEVER_COMBINE`,
`REWARD_SCREEN_MUSIC_MULTIPLIER`, and the functions `cooldownFor`,
`resolveMusicFile`, `computeDuckTarget`, `releaseDurationFor`, `shouldPlaySfx`,
`effectiveMusicVolume`, `effectiveSfxVolume`. It has 18 passing unit tests
(`tests/audio-logic.test.js`), which become the differential-testing oracle in
Phase 2.

**`audio-manager.js`** (269 lines) owns two looping `<audio>` elements for
crossfade, a pool of four for SFX, rAF-driven duck and fade animation, the
unlock gesture, and lifecycle.

### Music

Ten keys in `MUSIC_FILES` plus a pseudo-key `rewardScreen`, which resolves to the
**home** file and sets the 0.72 multiplier (`resolveMusicFile`, 78-82).

`resolveMusicState()` (2019-2024), in order: `rewardScreen` if the game is done;
`speechOrListeningTask` if the view is in `SPEECH_VIEWS`; the fixed
`GAME_MUSIC_PROFILE` entry for that view; otherwise `welcomeMusicProfile`.

**The `home` track is never used for the home screen.** `welcomeMusicProfile`
(2008-2017) is one random pick **per session** from the eight gameplay tracks,
and `home` is reachable only through `rewardScreen`. This contradicts the
intuitive reading of the key name and is easy to get wrong in the port.

Per-game assignment is fixed, not random (2001-2007): quiz and sort →
`playroom_a`, match → `playroom_b`, memory and puzzle → `carousel_a`, cards →
`carousel_b`, missing → `discoveries_a`, sounds → `discoveries_b`, bubbles →
`parade_a`, count → `parade_b`.

Crossfade defaults: **600 ms in, 500 ms out**. Both music elements loop. Setting
the same key twice is a no-op beyond a volume refresh.

### SFX

22 events. Cooldown categories: `answer` **400 ms** (`answer.correct`,
`answer.retry`), `celebration` **800 ms** (`reward.star`, `reward.unlock`,
`reward.confetti`, `game.levelComplete`), everything else `tap` **60 ms**.

`shouldPlaySfx` refuses unknown events, refuses when SFX are off, refuses
**entirely while the child is speaking**, enforces the cooldown, and caps at
`MAX_SIMULTANEOUS_SFX = 3`. The element pool is 4; exhaustion drops silently,
as does a request for a source already playing.

`NEVER_COMBINE` lists three pairs that must not stack, all of them
`game.levelComplete` against a success sound. **The rule is not enforced at
runtime** — it is documented as the caller's responsibility and honoured by
`chime()` returning early on the level-complete path (1996-1997). The unit tests
assert the pairs are well-formed, not that they never co-occur.

Three mapped events are never fired from `index.html`: `game.countdownTick`,
`game.countdownGo`, `system.softAttention`.

### Ducking

| Reason | music | sfx | attack | release |
|---|---|---|---|---|
| `voicePrompt` | 0.32 | 0.55 | 100 ms | 350 ms |
| `listening` | 0.18 | 0.25 | 120 ms | 450 ms |
| `speaking` | 0.08 | 0.0 | 80 ms | 500 ms |

Priority is **speaking > listening > voicePrompt**. An unknown last reason
releases over `voicePrompt`'s 350 ms.

### Volume

`music = master(1) × music(0.42) × userMultiplier × duck × reward(0.72 if reward
screen)`, clamped to [0,1]. With the default `musicVol` of 0.5 the resting music
volume is **0.21**.

`sfx = master(1) × sfx(0.78) × duck`, clamped. **There is no user-facing SFX
volume** — `settings.sounds` is on/off only.

### Lifecycle

Nothing plays before `AudioManager.unlock()`; a state set earlier is held in
`pendingMusicKey`. On `visibilitychange` to hidden the music is paused and
resumed on return if it was playing; `pagehide` stops everything. There is no
`blur` handler. `setVoiceEnabled` is stored but never read by the manager —
voice gating lives in `index.html`.

---

## 12. Voice

### TTS

`pickVoice()` (1896-1900) takes the **first** voice whose `lang` matches
`/^he/i`. There is no further ranking. If none exists, speech still proceeds with
`lang='he-IL'` and no explicit voice. The voice-list race is handled by calling
`pickVoice()` on init, on `voiceschanged`, and again at speak time if
`heVoice` is still null.

Utterance parameters (1966-1968): `lang='he-IL'`, `rate=settings.rate` (default
0.85), **`pitch=1.1` hardcoded**, volume left at the browser default.

An iOS keep-alive `resume()` runs every **5000 ms** while speaking (1890-1893),
and non-Apple browsers get a forced `setTimeout(…, 0)` gap after a cancel
(1904-1914).

**Recording beats TTS, but only if already cached.** `say()` (1921-1940) plays
`recordings[k]` when it is truthy, falling back to TTS if playback rejects;
otherwise it speaks immediately and kicks off an async load for next time. A
cold start can therefore speak a word with TTS even though a parent recording
exists. The port should decide deliberately whether to preserve that.

TTS is cancelled on view change only, and never when entering or staying on
`cloze` (2101-2106). Word tiles avoid a full render specifically so speech is
not cut off mid-word (3435-3436).

### Recognition

`SR = window.SpeechRecognition || window.webkitSpeechRecognition` (2643).

`startListening()` (3841-3876) for the speech game: `lang='he-IL'`,
`interimResults=false`, `maxAlternatives=5`. A transcript is accepted if, after
stripping non-Hebrew, any alternative contains the target, is contained by it, or
is within **Levenshtein distance 1**. Success advances after **1200 ms**. Errors
set `'לא הצלחנו לשמוע. ננסה שוב?'`; an unavailable mic sets `'המיקרופון לא זמין'`.

`listenForAnything()` (3895-3917) for temptation: `interimResults=true`, and it
succeeds on `onresult` **or** `onspeechstart` — any vocalisation counts, whether
or not it is recognised as a word. Auto-stops after **8000 ms** without success.

### Recording

Requires `MediaRecorder` and `navigator.mediaDevices`, else
`'הדפדפן הזה לא תומך בהקלטה'`. Mime is negotiated from a candidate list
(3938-3941) starting at `audio/webm;codecs=opus`. The blob is converted with
`FileReader.readAsDataURL` and stored as a data URL. **Auto-stops after
4000 ms** (3955). Permission denial toasts `'אין גישה למיקרופון'`.

### Degraded behaviour

- No `speechSynthesis` at all: a persistent home banner (2248) tells the parent
  to record a real voice or try Chrome.
- `synthesis-failed`: one-time toast **"הדפדפן לא מצליח להקריא עברית. נסו בכרום
  או ספארי, או הקליטו קול במסך ההורים."** (1973-1975). This is what headless
  Chromium hits, and it is why the baseline capture suppresses `#toast`.
- No recognition: the speech game shows an inline explanation (2647), and
  temptation falls back to the manual open button.
- A safety timeout of `estimateMs(text) + 900` fires `done` if `onend` never
  arrives (1985-1986).

`SPEECH_VIEWS` (2018) is `speech, focus, cloze, temptation, receptive, pairs,
combine`. Membership only selects the listening music state; it does not gate TTS
or recognition.

### Web API surface to replace

`speechSynthesis`, `SpeechSynthesisUtterance`, `SpeechRecognition` /
`webkitSpeechRecognition`, `navigator.mediaDevices.getUserMedia`,
`MediaRecorder` + `isTypeSupported`, `new Audio()`, `AudioContext` +
`createOscillator` + `createGain`, `FileReader.readAsDataURL`, `Blob`.

---

## 13. Rewards

24 stickers (2417-2442), three unlock kinds (`stickerUnlocked`, 2443-2447):

- **word** — 20 of them: `learned.has(key(s.cat, s.word))`.
- **category complete** — 1: `numbers`, requires `catLearned(c) >= c.items.length`.
- **milestone** — 3: `learned.size >= s.milestone`, at **1, 25 and 75**.

The 20 word stickers: dog, cat, elephant, rabbit, bird, butterfly (animals);
apple, cake, icecream (food); car, house, sun, tree (outside); balloon, heart,
flower, rainbow (colors); ball (home); kid-boy, kid-girl (family).

Locked stickers render greyscale at reduced opacity with a 🔒 overlay
(837-839). The screen offers category filter chips and a "${n} מתוך 24" count.

---

## 14. Parent area

**Two-step gate.**

1. **Long-press 900 ms** on the logo (`#parentBtn`, 4049-4063). A short click
   toasts an instruction instead.
2. **A multiplication question** (3230-3246): `a` in 3-9, `b` in 2-9, answered
   on a 0-9 keypad with a 4-digit cap. Correct sets `unlocked`; wrong toasts
   `'לא נכון, נסו שוב'` and clears the input while keeping the same question.

**Re-lock is unconditional**: leaving the parent view resets `unlocked`,
`lockAnswer` and `lockInput` (2094-2099), so every entry needs a fresh
long-press and a fresh question. The comment there records that this was a
deliberate fix — it used to unlock once per session.

**Five tabs** (3222): `settings`, `record` (🎙️ הקלטות), `words` (💜 מילים שלי),
`report` (📊 דוח), `method` (📚 השיטה).

- **settings** — speech rate, niqqud, music, music volume, sounds, voice
  prompts, effects, PWA install (web only), export/import, privacy link,
  progress reset, version.
- **record** — category picker, then per word: play, record, delete.
- **words** — add a custom word and list existing ones.
- **report** — per-category progress bars, total learned, and the top 10 hardest
  words ranked by `stats.wrong`.
- **method** — clinical descriptions of the six practice modes.

**Custom words.** `#cwWord` required, `#cwEmoji` capped at 4 characters and
defaulting to 💜. Photos go through `handlePhoto` (3964-3981): decode, centre-crop
to a square, draw to a **320×320** canvas, encode as **JPEG quality 0.72**, keep
as a data URL. Deleting a custom word also drops its `mine:<word>` progress key.

**Reset** (3786-3789) is progress-only: it clears `learned`, `stats` and
`lastCat`, and explicitly **keeps recordings and custom words**. The confirm text
says so and recommends exporting first.

**Storage diagnostics** (3825-3833) show the backend and `Store.estimate()`
usage against quota.

---

## 15. Platform

**Capacitor** (`capacitor.config.ts`): `appId` `com.yonicks.talki`, `appName`
`Talki`, `webDir` `www`, background `#FFF6E4`. Plugins: `SplashScreen`
(1400 ms, auto-hide, no spinner) and `StatusBar` (`DARK`). No `server` block.
AdMob is a dependency and is wired in the native projects but is not in the
`plugins` config.

**AdMob** (4092-4130). Banner only, no interstitial. Every id is a **Google test
id** (`ca-app-pub-3940256099942544/...`), in `index.html`, `strings.xml` and
`Info.plist` alike — production ids have never been wired (defect D3).
Initialised with `tagForChildDirectedTreatment: true` and
`maxAdContentRating: 'General'`; the banner is `ADAPTIVE_BANNER`,
`BOTTOM_CENTER`, `npa: true`. It runs only inside the native wrapper, never in
the browser. Height feeds layout through the `--ad-h` CSS variable (83), updated
from `bannerAdSizeChanged` with a 50 px fallback. `document.body` gets a
`has-ad` class that **no CSS rule uses** (defect D6).

**PWA** (`manifest.json`): id `/talki/`, `start_url` `./index.html`, scope `./`,
`display` `standalone`, `lang` `he`, `dir` `rtl`, theme and background `#FFF8EA`,
icons 192, 512 and 512-maskable, and two shortcuts (`?game=bubbles`,
`?game=focus`).

**Orientation is hard-locked to portrait**: `manifest.json` `"orientation":
"portrait"` and `screen.orientation.lock('portrait')` at 4088-4090. The RN app
deliberately departs from this — games and practice go landscape — which is the
single largest intentional behavioural change in the migration.

**Wake lock** (4085-4087) is requested at the gate and re-requested on
`visibilitychange`, and is **never released** (defect D4).

**Service worker** (`sw.js`): cache `talki-v9`, rewritten to the git SHA at
deploy. 18 precached shell entries, all of which exist in the repo. Navigations
to the app shell are cache-first with a background refresh; media is
network-first; everything else is cache-first. `skipWaiting` plus `clients.claim`,
and the page toasts `'יש גרסה חדשה — סגרו ופתחו מחדש'` when a new worker installs
over an existing controller.

**Intro** (4145-4230). A ~5 s bumper: `INTRO_STAGE_MS` **4400** plus
`INTRO_EXIT_MS` **620**, six SFX beats, 20 particles, over the home hero
background with the star mascot and wordmark. Skippable by tapping anywhere or
any keypress, exiting in 300 ms; there is no visible skip button by design. It is
suppressed by `?intro=0`, by any `?game=` deep link, by `settings.effects` being
off, and by `prefers-reduced-motion`. **No studio bumper assets exist in the
repository** — this is the known Phase 6 blocker.

**Native projects** are committed: `android/` 55 tracked files, `ios/` 20.
Generated Capacitor artefacts and the copied `public/` payload are gitignored.

---

## 16. Tests and CI

Three suites exist. All three were run at this commit and **all pass**; this is
the inherited baseline.

| Suite | Runner | Result |
|---|---|---|
| `tests/audio-logic.test.js` | `node --test` | 18/18 pass |
| `tests/test_suite.py` | Python + Playwright | ALL CHECKS PASSED |
| `tests/interaction_suite.py` | Python + Playwright | ALL INTERACTION CHECKS PASSED |

`test_suite.py` covers layout, Hebrew RTL semantics, every category and game
opening, five games actually completing, storage/persistence/backup, and PWA
including offline and the precache count. `interaction_suite.py` is the
interesting one for the port: reachability, a **48 px** touch-target floor, real
tap navigation, listener growth across re-renders, rapid taps, hardware back,
every game completing, the puzzle at seven viewports and under reduced motion,
"speaks exactly once on entry" for the nine question games, absence of adult
controls inside games, the parent gate, degraded audio APIs, and offline.

These are the behaviours the Tier 2 helpers in `docs/migration/validation.md`
are modelled on, which is why the mobile matrix reuses the same viewports.

**CI** (`.github/workflows/test-and-deploy.yml`): on push and PR to `master`.
Job `test` uses Python **3.12**, installs Playwright with `--with-deps chromium`,
runs `node --check` over the extracted inline script, serves the repo with
`python -m http.server 8000`, then runs both Python suites — the second with
`if: always()` — and uploads screenshots for 14 days. Job `deploy` needs `test`,
runs only on `master` outside PRs, rewrites the SW version to the git SHA, and
publishes the **entire repository** to GitHub Pages.

**Not run in CI:** `tests/audio-logic.test.js` and
`tests/word-speak-playwright.mjs` (defect D9). The only unit tests in the
project are not gating anything.

---

## 17. Documentation drift

Discrepancies found between existing documents and the code. All were corrected
in place; nothing was left to be inherited.

| # | Claim | Reality |
|---|---|---|
| 1 | 11 games reachable through `startGame` | 16 types: 10 games + 6 practice modes. The 11th was `cards`, which is a browsing view. Checklist corrected. |
| 2 | Phase 0 plan says "230 files" and "23 views x 10 viewports" in *Files to be created* | Its own screenshot manifest says 250 from 25 names. 250 is right; the earlier line was stale. |
| 3 | Master plan's `currentCategory` description | Corrected earlier to the verified 4-step order in section 7. |
| 4 | Last-category key | `lia:lastcat`, not a `lia:progress` sub-field. |
| 5 | `importBackup` accepts only `talki` | Also accepts `lia-words`; merge special-cases only `K.progress`. |
| 6 | Settings are exactly the 7 defaults | `lastBackup` and `puzzleLevel` are persisted into the same object without being declared. |
| 7 | Recordings stored as Blobs | Data URLs, with no index key. |
| 8 | Legacy is portrait everywhere | True, and the RN target deliberately differs for games and practice. |
| 9 | `home` music plays on the home screen | It does not. The home screen uses a per-session random gameplay track; `home` is reachable only via `rewardScreen`. Newly found in this audit. |

---

## 18. Defects found

Recorded, **not fixed** — Phase 0 changes no legacy behaviour. Each needs an
owning phase later.

| id | Defect | Evidence | Severity |
|---|---|---|---|
| D1 | `tools/prepare_www.js` does not copy `audio-manager.js` into `www/`, so the Capacitor build ships an app whose `<script src="audio-manager.js">` 404s and whose `window.AudioManager` is undefined. `sw.js` also precaches a path that is absent from the bundle. | `prepare_www.js` 11-18 vs `index.html` 1355, `sw.js` 16 | **high** — native builds have no music or SFX |
| D2 | Background colour disagrees across the stack: `#FFF6E4` in Capacitor, `#FFF8EA` in the manifest, the `theme-color` meta and the native shell polish. | `capacitor.config.ts` 7/10/13/22 vs `manifest.json` 13-14, `index.html` 6, 4138 | low — a visible flash on native launch |
| D3 | Every AdMob id is a Google test id, on all three platforms. | `index.html` 4096, `strings.xml` 8, `Info.plist` 39 | medium — no revenue, and shipping test ids is a policy risk |
| D4 | The wake lock is requested and re-requested but never released. | 4085-4087, 4250 | low |
| D5 | Storage write failures are silent everywhere except recording. | 1712-1718 vs 3948-3950 | medium — progress can be lost with no signal |
| D6 | `body.has-ad` is toggled but no CSS rule consumes it. | 4126 | low — dead code |
| D7 | `launch()` always toasts "at least 4 words" even when `MIN_ITEMS` is 1 or 2. | 2552-2554 | low — misleading |
| D8 | The `count` game writes neither `learned` nor `stats`, so playing it never advances progress. | 3628-3636 | medium — a whole game contributes nothing |
| D9 | CI runs neither the Node unit tests nor `word-speak-playwright.mjs`. | workflow 20-80 | medium |
| D10 | `NEVER_COMBINE` is declared and unit-tested but never enforced at runtime. | `audio-logic.js` 64-70 | low — currently held by `chime()` control flow |
| D11 | Three SFX events are mapped but never fired. | `countdownTick`, `countdownGo`, `softAttention` | informational |
| D12 | Deploy publishes the whole repository to Pages, including `android/` and `ios/`. | workflow 101 | low |
| D13 | The comment at 1842 states that every 10th word learned **anywhere** fires `celebrate()`, but the only call site is the category word-tile handler. A child who reaches a multiple of ten inside a game or a practice mode gets no celebration, and the next tile tap will not fire one either because the total has already moved past the boundary. | one `celebrate(` call at 3451 vs comment 1842-1844 | medium — a reward the design promises is silently unreachable through most of the app |

---

## 19. Migration risks

**Data URLs for recordings.** The V1 backup embeds audio as base64 inside JSON.
A parent with many recordings produces a large file, and RN must round-trip
disk files to data URLs to stay compatible. Backup is the only bridge for user
data at cutover, so this path has to be exercised with a realistic payload
early, not at Phase 15.

**Niqqud in progress keys.** Keys embed fully pointed Hebrew. Any normalisation
difference between the web and RN string handling silently orphans progress.
Round-tripping a real backup is the only honest test.

**No Hebrew TTS voice is a real deployment state, not an edge case.** Headless
Chromium hits it, and so do some devices. The legacy app has a designed
degradation for it, including the parent-recording escape hatch. The port must
keep an equivalent, and it must be testable — this is one of the things Playwright
on Expo web cannot confirm, so it belongs in the device checklist.

**Recognition acceptance is deliberately loose.** Temptation mode opening on
`onspeechstart` alone is a clinical decision, not a bug, and a stricter native
recogniser would quietly break the intervention.

**Timing is clinical.** The 5000 ms cloze pause and the 900 ms parent-gate hold
are requirements. RN's timer and gesture behaviour differ from the browser's;
these need explicit assertions rather than eyeballing.

**Full-render architecture hides listener bugs.** The legacy suite tests for
listener growth because the legacy design invites it. React removes that class
of bug but introduces others; the equivalent risk in RN is effect churn and
stale closures around the same timers.

**The intro has no studio assets.** Phase 6 cannot deliver a Yonicks bumper
from this repository. It is specified to render nothing when the assets are
absent, and remains a product blocker rather than an engineering one.

**Adaptive state lives in settings.** `puzzleLevel` riding inside the settings
object means a settings migration can reset a child's difficulty. It should be
carried deliberately in the port's schema.

**`sounds` depends on exactly 17 items** carrying a `sound` field. The asset
registry generated in Phase 2 must preserve that association, or the game
quietly shrinks.
