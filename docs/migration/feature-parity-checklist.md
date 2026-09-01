# Feature parity checklist

Seeded from a direct audit of `index.html` (4307 lines), `audio-manager.js` and
`assets/audio/audio-logic.js` at commit `edbe634`.

**Phase 0** verifies and completes this list against the live code.
**Every phase in between** updates the rows it touches.
**Phase 14** grades every row PASS or FAIL and is the release gate.

> **Phase 0 verification, 2026-09-01.** Inventory checked against the running
> app, not just the source. Twenty of twenty-one counted claims were confirmed
> unchanged. Corrections applied: the games count went from 11 to 10 (`cards`
> has a `data-game` attribute and a menu tile but no `startGame` branch, so it
> is a browsing view); four music rows were added after finding that the home
> screen never plays the `home` track; defects D2-D13 were added to section 15;
> and the `celebrate()` row was narrowed to its single real call site.
> Full detail in [`00-current-state.md`](00-current-state.md).

Status values: `TODO` not started, `WIP` in progress, `PASS` verified in the
native app, `FAIL` verified broken, `N/A` deliberately not carried over with a
recorded reason.

A row is only `PASS` when the behaviour was exercised, not when a route exists.

---

## 1. Views and routes — 23

Driven by `let view` (index.html:1650) and the `views` map (2085-2092). There is
no router library; navigation is `navTo()` (3397-3401) plus `history.pushState`
(2125-2147).

| # | View id | Legacy render fn | Legacy lines | Status |
|---|---|---|---|---|
| 1 | `home` | `renderHome` | 2227-2270 | TODO |
| 2 | `category` | `renderCategory` | 2293-2327 | TODO |
| 3 | `cards` | `renderCards` | 2329-2351 | TODO |
| 4 | `games` | `renderGamesMenu` | 2354-2391 | TODO |
| 5 | `practice` | `renderPractice` | 2394-2414 | TODO |
| 6 | `stickers` | `renderStickers` | 2449-2473 | TODO |
| 7 | `quiz` | `renderQuiz` | 2572-2581 | TODO |
| 8 | `memory` | `renderMemory` | 2584-2597 | TODO |
| 9 | `missing` | `renderMissing` | 2611-2626 | TODO |
| 10 | `match` | `renderMatch` | 2629-2640 | TODO |
| 11 | `speech` | `renderSpeech` | 2644-2661 | TODO |
| 12 | `bubbles` | `renderBubbles` | 2664-2670 | TODO |
| 13 | `sounds` | `renderSounds` | 2711-2719 | TODO |
| 14 | `count` | `renderCount` | 2733-2742 | TODO |
| 15 | `sort` | `renderSort` | 2752-2762 | TODO |
| 16 | `puzzle` | `renderPuzzle` | 2835-2870 | TODO |
| 17 | `focus` | `renderFocus` | 3065-3083 | TODO |
| 18 | `cloze` | `renderCloze` | 3086-3103 | TODO |
| 19 | `temptation` | `renderTemptation` | 3128-3146 | TODO |
| 20 | `receptive` | `renderReceptive` | 3156-3166 | TODO |
| 21 | `pairs` | `renderPairs` | 3177-3186 | TODO |
| 22 | `combine` | `renderCombine` | 3189-3202 | TODO |
| 23 | `parent` | `renderParent` | 3220-3229 | TODO |

Sub-states that are not separate views:

| Item | Legacy lines | Status |
|---|---|---|
| Parent lock screen when `view==='parent' && !unlocked` | 3230-3247 | TODO |
| Home fallback when `views[view]` is missing | 2109 | TODO |
| Deep link `?game=<type>` after the start gate | 4246-4247 | TODO |

---

## 2. Games — 10

Entry via `startGame(type, catId)` (2491-2551) and `launch()` (2552-2555). Verified
against the live page in Phase 0: `startGame` accepts exactly 16 types, of which
these 10 are games and the other 6 are the practice modes in section 3.

`cards` is listed at the end for completeness but is **not** a game: it has no
`startGame` branch and no `MIN_ITEMS` entry, it is a browsing view reached from
the category screen.

| Game id | Hebrew title | Setup / helpers | Handlers | Status |
|---|---|---|---|---|
| `quiz` | איפה ה...? | `setupQuizRound`, `nextQuiz` | 3488-3510 | TODO |
| `memory` | משחק זיכרון | inline in `startGame` | 3512-3533 | TODO |
| `missing` | מה נעלם? | `setupMissingRound`, `nextMissing` | 3535-3558 | TODO |
| `match` | חיבורים | inline in `startGame` | 3560-3577 | TODO |
| `sounds` | מי אמר את זה? | `setupSoundsRound` | 3604-3621 | TODO |
| `count` | כמה יש? | `setupCountRound` | 3623-3636 | TODO |
| `sort` | לאיזו קופסה? | `setupSortRound` | 3638-3654 | TODO |
| `bubbles` | בועות מילים | `spawnBubble` | 3597-3602 | TODO |
| `puzzle` | שִׂימִי בַּמָּקוֹם | `setupPuzzleBoard`, `puzzleSelect`, `puzzleDrop`, `puzzleFinish`, `puzzleAdvance`, `bindPuzzle`, `puzzleAttachDrag` | 3579-3588 | TODO |
| `speech` | תגידי את זה | inline, `startListening` 3841-3876 | 3590-3595 | TODO |
| `cards` *(not a game)* | כרטיסיות | none | 3457-3479 | TODO |

Game-level behaviours:

| Item | Legacy lines | Status |
|---|---|---|
| `MIN_ITEMS` gate and category fallback | 2489-2494 | TODO |
| `gameCatChips()` shows only categories with 4+ items | 2282-2291 | TODO |
| `sounds` always forces `CATEGORIES.animals` with a `sound` field | 2520-2523 | TODO |
| `sort` picks 2 random categories | 2745-2750 | TODO |
| `doneCard()` star tiers: >=85% three, >=50% two, else one | 3204-3208 | TODO |
| `weightedPick()` SRS-lite prioritisation by `stats.wrong` | 1869-1877 | TODO |
| `markSeen()` seen++ / wrong++ / wrong-- on correct | 1878-1883 | TODO |
| Adaptive `settings.puzzleLevel` 1-5 | 2973-2978 | TODO |

---

## 3. Speech-practice modes — 6

`PRACTICE_LIST` (2218-2225). `HOME_PRACTICE_HOME` (1383-1387) shows only
`focus`, `receptive`, `cloze` on Home.

| Mode id | Hebrew title | Setup / helpers | Supporting const | Status |
|---|---|---|---|---|
| `focus` | מילה במיקוד | inline in `startGame` | `CARRIERS` 1597 | TODO |
| `receptive` | תראי לי | `setupReceptiveRound` | none | TODO |
| `cloze` | משלימים ביחד | `runCloze`, `clozeNext` | `CLOZE` 1600-1609 | TODO |
| `temptation` | הצנצנת | `openJar`, `listenForAnything` | none | TODO |
| `pairs` | דומה אבל לא | `setupPairsRound` | `PAIRS` 1612-1620 | TODO |
| `combine` | שתי מילים | inline in `startGame` | `MODIFIERS` 1623-1628 | TODO |

| Item | Legacy lines | Status |
|---|---|---|
| `SPEECH_VIEWS` set drives the listening-focus music profile | 2018 | TODO |
| Each mode speaks its prompt exactly once on entry | interaction_suite test 12 | TODO |

---

## 4. Vocabulary — 10 categories, 182 built-in words

`CATEGORIES` at 1480-1592. `art(cat, slug)` at 1476-1479 builds
`assets/words/{cat}/talki-{cat}-{slug}.png`, except colours which use
`talki-colors-shapes-{slug}.png`.

| Category id | Title | Icon | cls | Words | Status |
|---|---|---|---|---|---|
| `animals` | חיות | 🐶 | `c-animals` | 26 | TODO |
| `food` | אוֹכֶל | 🍎 | `c-food` | 26 | TODO |
| `colors` | צְבָעִים וְצוּרוֹת | 🎨 | `c-colors` | 26 | TODO |
| `home` | בַּבַּיִת | 🧸 | `c-home` | 26 | TODO |
| `family` | מִשְׁפָּחָה | 👨‍👩‍👧 | `c-family` | 12 | TODO |
| `body` | הַגּוּף | 👀 | `c-body` | 12 | TODO |
| `actions` | פְּעוּלוֹת | 🏃 | `c-actions` | 16 | TODO |
| `numbers` | מִסְפָּרִים | 🔢 | `c-numbers` | 10 | TODO |
| `outside` | בַּחוּץ | 🌳 | `c-outside` | 18 | TODO |
| `emotions` | רְגָשׁוֹת | 😊 | `c-emotions` | 10 | TODO |
| **Total** | | | | **182** | TODO |

| Item | Legacy lines | Status |
|---|---|---|
| Virtual `mine` category injected by `allCats()` | 1831-1834 | TODO |
| Item shape `{word, emoji, img, shape}` on all 182 | 1480-1592 | TODO |
| Optional `sound` field on 17 items | 1480-1592 | TODO |
| Optional `photo` field on custom words only | — | TODO |
| Exact word list per category matches byte for byte including niqqud | — | TODO |

---

## 5. Progress, points and stats

| Item | Legacy lines | Status |
|---|---|---|
| `key(catId, word)` returns `catId + ':' + word` | 1837 | TODO |
| Points equals `learned.size`, not a separate counter | 2075-2079 | TODO |
| `totalWords()` includes custom words | 1838 | TODO |
| `catLearned(cat)` | 1839 | TODO |
| `currentCategory()` step 1: return `lastCat` if not fully learned | 2206-2216 | TODO |
| `currentCategory()` step 2: highest completion ratio in progress | 2206-2216 | TODO |
| `currentCategory()` step 3: first untouched category | 2206-2216 | TODO |
| `currentCategory()` step 4: fall back to `cats[0]` | 2206-2216 | TODO |
| `lastCat` persisted only by `enterCat()`, not by `startGame()` | 1823 | TODO |
| `STAR_STEP = 10` and `wordsToNextStar()` | 1845-1846 | TODO |
| `celebrate()` fires every 10th learned word — **only from the category word-tile path**, not from games or practice (defect D13) | 3451 | TODO |

---

## 6. Persistence — 7 keys

`K` at 1633-1637. Backends tried in order: IndexedDB (`lia-words` / `kv` / v1),
`window.storage`, in-memory `Map` (1662-1745). No `localStorage` use.

| Key | Value shape | Status |
|---|---|---|
| `lia:progress` | `string[]` of `"catId:word"` | TODO |
| `lia:settings` | settings object | TODO |
| `lia:stats` | `{ [key]: { seen, wrong } }` | TODO |
| `lia:custom:index` | `string[]` of custom ids | TODO |
| `lia:custom:<id>` | `{ id, word, emoji, photo }` | TODO |
| `lia:rec:<catId:word>` | audio data URL string | TODO |
| `lia:lastcat` | category id string | TODO |

---

## 7. Settings

Defaults at 1647. Two further keys are written at runtime and must survive
round-tripping.

| Key | Default | Notes | Status |
|---|---|---|---|
| `rate` | `0.85` | parent options 0.6 / 0.85 / 1 | TODO |
| `niqqud` | `true` | | TODO |
| `sounds` | `true` | SFX | TODO |
| `effects` | `true` | confetti / animations | TODO |
| `music` | `true` | | TODO |
| `musicVol` | `0.5` | parent options 0.25 / 0.5 / 0.85 | TODO |
| `voice` | `true` | voice prompts | TODO |
| `lastBackup` | absent | ISO string, set on export (1771) | TODO |
| `puzzleLevel` | absent | 1-5, adaptive (2973-2978) | TODO |

---

## 8. Backup — version 1

`exportBackup()` 1754-1775, `importBackup()` 1777-1799, `BACKUP_VERSION = 1`
at 1752.

| Item | Detail | Status |
|---|---|---|
| Export payload shape | `{app, version, exported_at, word_count, data}` | TODO |
| `app` is `"talki"` on export | 1758 | TODO |
| `word_count` equals `learned.size` | 1761 | TODO |
| `data` is every `Store` key verbatim | 1755-1756 | TODO |
| Filename `talki-backup-YYYY-MM-DD.json` | 1767-1768 | TODO |
| Export sets `settings.lastBackup` | 1771 | TODO |
| Import accepts `app === "talki"` | 1781 | TODO |
| Import **also** accepts legacy `app === "lia-words"` | 1781 | TODO |
| Import rejects a payload with no `data` | 1781 | TODO |
| Import rejects unparseable JSON with a toast, not a crash | 1779-1780 | TODO |
| `replace` mode deletes all keys first | 1783-1785 | TODO |
| `merge` mode unions `lia:progress` arrays via Set | 1788-1790 | TODO |
| `merge` mode overwrites all other keys | 1791-1792 | TODO |
| Import clears the recordings cache and reloads state | 1795-1797 | TODO |
| Recordings survive export and re-import as data URLs | — | TODO |

---

## 9. Audio

`assets/audio/audio-logic.js` is the pure policy. `audio-manager.js` is the
DOM runtime that must be rewritten.

| Item | Detail | Status |
|---|---|---|
| 22 semantic SFX events resolve to real files | `SFX_FILES` | TODO |
| 10 music state keys resolve | `MUSIC_FILES` | TODO |
| `rewardScreen` reuses the home track | | TODO |
| Home screen plays a per-session random *gameplay* track, never `home` | `welcomeMusicProfile` 2008-2017 | TODO |
| Per-game music assignment is fixed, not random | `GAME_MUSIC_PROFILE` 2001-2007 | TODO |
| `SPEECH_VIEWS` membership forces `speechOrListeningTask` | 2018-2024 | TODO |
| Crossfade 600 ms in / 500 ms out, both tracks loop | audio-manager.js 101-142 | TODO |
| Reward screen music multiplier `0.72` | | TODO |
| Duck priority speaking > listening > voicePrompt | `DUCK` | TODO |
| Duck `voicePrompt` music 0.32 sfx 0.55 attack 100 release 350 | | TODO |
| Duck `listening` music 0.18 sfx 0.25 attack 120 release 450 | | TODO |
| Duck `speaking` music 0.08 sfx 0.0 attack 80 release 500 | | TODO |
| Cooldowns tap 60, answer 400, celebration 800 | `COOLDOWN_MS` | TODO |
| `MAX_SIMULTANEOUS_SFX = 3` | | TODO |
| SFX hard-blocked while the child is speaking | `shouldPlaySfx` | TODO |
| `NEVER_COMBINE` pairs never fire together | | TODO |
| Volume math clamps to 0..1 | | TODO |
| Music crossfade between states | audio-manager.js | TODO |
| Pause on background, resume on foreground | audio-manager.js | TODO |
| User music-volume multiplier applies | audio-manager.js | TODO |
| First-gesture audio unlock | 4068-4084 | TODO |

Music files on disk that are **not** mapped and must stay unmapped unless a
decision is recorded: `02_gameplay_bouncy.mp3`, `03_gameplay_curious.mp3`,
`04_gameplay_gentle.mp3`.

---

## 10. Voice, recording and recognition

| Item | Legacy lines | Status |
|---|---|---|
| `say(catId, word)` prefers a parent recording over TTS | 1888-1987 | TODO |
| TTS `lang = 'he-IL'`, `rate = settings.rate`, `pitch = 1.1` | 1888-1987 | TODO |
| `opts.core` bypasses the `settings.voice` gate | 1888-1987 | TODO |
| Graceful behaviour when no Hebrew voice exists | 1888-1987 | TODO |
| `preloadRecs(catId)` lazy-loads a category's recordings | 3921-3927 | TODO |
| Recording capped at 4 seconds | 3919-3957 | TODO |
| Recording stored at `lia:rec:<catId:word>` | 3919-3957 | TODO |
| `startListening()` for the speech game, `he-IL`, Levenshtein <= 1 | 3841-3876 | TODO |
| `listenForAnything()` for temptation, any sound opens the jar, 8s timeout | 3885-3917 | TODO |
| Every screen survives missing TTS / mic / recognition | interaction_suite test 10 | TODO |

---

## 11. Rewards — 24 stickers

`STICKERS` 2417-2442, `stickerUnlocked()` 2443-2447.

| # | Image | Unlock | Status |
|---|---|---|---|
| 1 | `talki-sticker-dog.png` | animals / כֶּלֶב | TODO |
| 2 | `talki-sticker-cat.png` | animals / חָתוּל | TODO |
| 3 | `talki-sticker-elephant.png` | animals / פִּיל | TODO |
| 4 | `talki-sticker-rabbit.png` | animals / אַרְנָב | TODO |
| 5 | `talki-sticker-bird.png` | animals / צִפּוֹר | TODO |
| 6 | `talki-sticker-butterfly.png` | animals / פַּרְפַּר | TODO |
| 7 | `talki-sticker-apple.png` | food / תַּפּוּחַ | TODO |
| 8 | `talki-sticker-cake.png` | food / עוּגָה | TODO |
| 9 | `talki-sticker-icecream.png` | food / גְּלִידָה | TODO |
| 10 | `talki-sticker-car.png` | outside / מְכוֹנִית | TODO |
| 11 | `talki-sticker-house.png` | outside / בַּיִת | TODO |
| 12 | `talki-sticker-sun.png` | outside / שֶׁמֶשׁ | TODO |
| 13 | `talki-sticker-tree.png` | outside / עֵץ | TODO |
| 14 | `talki-sticker-balloon.png` | colors / בָּלוֹן | TODO |
| 15 | `talki-sticker-heart.png` | colors / לֵב | TODO |
| 16 | `talki-sticker-flower.png` | colors / פֶּרַח | TODO |
| 17 | `talki-sticker-rainbow.png` | colors / צִבְעוֹנִי | TODO |
| 18 | `talki-sticker-ball.png` | home / כַּדּוּר | TODO |
| 19 | `talki-sticker-kid-boy.png` | family / אָח | TODO |
| 20 | `talki-sticker-kid-girl.png` | family / יַלְדָּה | TODO |
| 21 | `talki-sticker-numbers.png` | numbers category complete | TODO |
| 22 | `talki-sticker-star.png` | milestone 1 | TODO |
| 23 | `talki-sticker-sparkle.png` | milestone 25 | TODO |
| 24 | `talki-sticker-gift.png` | milestone 75 | TODO |

| Item | Legacy lines | Status |
|---|---|---|
| Filter chips: `all` plus each category present in STICKERS | 2448-2454 | TODO |
| "N of 24 collected" counter | 2471 | TODO |
| Locked stickers render greyed, not hidden | 2456-2459 | TODO |
| Star badge on learned word tiles | 3448-3449 | TODO |

---

## 12. Parent area

| Item | Legacy lines | Status |
|---|---|---|
| Entry is a 900 ms hold on `#parentBtn`; a short tap only toasts | 4050-4058 | TODO |
| Gate is a multiplication question, a in 3..9, b in 2..9 | 3232-3233 | TODO |
| Numeric keypad 0-9, clear, OK | 3230-3247 | TODO |
| Wrong answer does not unlock | 3764-3772 | TODO |
| Leaving the parent view re-locks it | 2098-2100 | TODO |
| Tab `settings` | 3248-3295 | TODO |
| Tab `record` | 3296-3318 | TODO |
| Tab `words` | 3319-3342 | TODO |
| Tab `report` | 3358-3376 | TODO |
| Tab `method` | 3343-3357 | TODO |
| Progress reset clears learned/stats/lastCat, keeps recordings and custom | — | TODO |
| Report shows per-category progress and top 10 hard words by `stats.wrong` | 3358-3376 | TODO |
| Custom word CRUD with a 320x320 JPEG photo | 3319-3342 | TODO |
| Per-word recording management by category | 3296-3318 | TODO |
| Storage engine name and quota shown | — | TODO |
| No adult control is reachable from any child screen | interaction_suite test 12b | TODO |

---

## 13. Platform and shell

| Item | Legacy lines | Status |
|---|---|---|
| App id `com.yonicks.talki` | capacitor.config.ts | TODO |
| Splash 1400 ms, background `#FFF6E4` | capacitor.config.ts | TODO |
| Status bar DARK on `#FFF6E4` | capacitor.config.ts, 4137-4138 | TODO |
| AdMob adaptive banner, bottom centre | 4092-4131 | TODO |
| AdMob `tagForChildDirectedTreatment: true` | 4099-4100 | TODO |
| AdMob `maxAdContentRating: 'General'` | 4099-4100 | TODO |
| AdMob `npa: true` non-personalised | 4104-4110 | TODO |
| Ad height reserved in layout, no content occlusion | 4092-4131 | TODO |
| Wake lock while in use | 4085-4087 | TODO |
| Works offline after first load | sw.js, test_suite test 6 | TODO |
| Hebrew RTL throughout | test_suite test 2 | TODO |
| Niqqud toggle affects display but never TTS input | 1828-1830 | TODO |
| Every child-facing touch target is at least 48 x 48 | interaction_suite test 2 | TODO |
| No horizontal overflow at any supported viewport | test_suite test 1 | TODO |
| Rapid repeated taps never double-score or double-advance | interaction_suite test 5 | TODO |
| Re-rendering does not accumulate event listeners | interaction_suite test 4 | TODO |
| Hardware back navigates rather than exiting | 2118-2124 | TODO |

---

## 14. Deliberate deviations from parity

These are intentional changes, not gaps. Each needs a recorded decision, not a
PASS.

| Deviation | Legacy behaviour | Native behaviour | Recorded in |
|---|---|---|---|
| Orientation | Hard portrait lock (`screen.orientation.lock('portrait')` 4088, `manifest.json`) | Games and practice landscape, other routes responsive | phase-04-plan.md |
| Opening sequence | Static bumper | Animated Yonicks Studios sequence | phase-06-plan.md |
| Recording storage | Data URL string in the KV store | File on disk, data URL only at the export boundary | phase-03-plan.md |
| Home layout | Current implementation | Approved mock `docs/design/talki-home-approved.png` | phase-07-plan.md |
| Ads library | `@capacitor-community/admob` | `react-native-google-mobile-ads` | phase-13-plan.md |

---

## 15. Known legacy defects — carry forward or fix, but decide

Graded in Phase 0 against the code. Each row is a decision to make, not
necessarily a fix. Ids match `00-current-state.md` section 18.

| Defect | Status |
|---|---|
| **D1** `tools/prepare_www.js` never copies `audio-manager.js` into `www/`, although `index.html` and `sw.js` both reference it — the Capacitor build ships with no audio runtime | TODO |
| **D2** Background colour is `#FFF6E4` in Capacitor but `#FFF8EA` in the manifest, the `theme-color` meta and the native shell polish | TODO |
| **D3** Every AdMob id on all three platforms is a Google test id | TODO |
| **D4** The wake lock is requested and re-requested but never released | TODO |
| **D5** Storage write failures are silent everywhere except recording | TODO |
| **D6** `body.has-ad` is toggled but no CSS rule consumes it | TODO |
| **D7** `launch()` always toasts "at least 4 words" even when `MIN_ITEMS` is 1 or 2 | TODO |
| **D8** The `count` game writes neither `learned` nor `stats`, so playing it never advances progress | TODO |
| **D9** CI runs neither `tests/audio-logic.test.js` nor `tests/word-speak-playwright.mjs` | TODO |
| **D10** `NEVER_COMBINE` is declared and unit-tested but never enforced at runtime | TODO |
| **D11** `game.countdownTick`, `game.countdownGo` and `system.softAttention` are mapped but never fired | TODO |
| **D12** Deploy publishes the whole repository to Pages, including `android/` and `ios/` | TODO |
| **D13** `celebrate()` is documented as firing on every 10th word learned anywhere, but its only call site is the category word-tile handler | TODO |
| `tests/interaction_suite.py` declares `SHOT_DIR` and never writes a screenshot | TODO |
| `tools/sweep.js` and `tools/audio-check.js` default to port 5173 while everything else uses 8000 | TODO |
| `tools/make_store.py` hardcodes `/home/claude/build/lia-app` | TODO |
| `tools/screenshot.js` documents an unimplemented `--wait=selector` | TODO |
| `assets/audio/music/02`, `03`, `04` exist on disk but are unmapped | TODO |
