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

> **Phase 14 grading, 2026-09-02.** Every row below is PASS, FAIL or N/A with
> a reason. Zero TODO remain. PASS means the behaviour was exercised on Expo
> web (Playwright and/or vitest). Device-only behaviour that was not run on
> named hardware is FAIL — an untested row carries the same release risk as a
> broken one. See `phase-14-defects.md` and `phase-14-device-qa.md`.

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
| 1 | `home` | `renderHome` | 2227-2270 | PASS — home.spec.ts + full-sweep, web |
| 2 | `category` | `renderCategory` | 2293-2327 | PASS — category.spec.ts + full-sweep, web |
| 3 | `cards` | `renderCards` | 2329-2351 | PASS — cards.spec.ts + full-sweep, web |
| 4 | `games` | `renderGamesMenu` | 2354-2391 | PASS — navigation.spec.ts + full-sweep, web |
| 5 | `practice` | `renderPractice` | 2394-2414 | PASS — practice-* specs + full-sweep, web |
| 6 | `stickers` | `renderStickers` | 2449-2473 | PASS — stickers.spec.ts + full-sweep, web |
| 7 | `quiz` | `renderQuiz` | 2572-2581 | PASS — quiz.spec.ts + full-sweep, web |
| 8 | `memory` | `renderMemory` | 2584-2597 | PASS — memory.spec.ts + full-sweep, web |
| 9 | `missing` | `renderMissing` | 2611-2626 | PASS — missing.spec.ts + full-sweep, web |
| 10 | `match` | `renderMatch` | 2629-2640 | PASS — match.spec.ts + full-sweep, web |
| 11 | `speech` | `renderSpeech` | 2644-2661 | FAIL — web shows unsupported; device recognition not attested |
| 12 | `bubbles` | `renderBubbles` | 2664-2670 | PASS — bubbles.spec.ts + full-sweep, web |
| 13 | `sounds` | `renderSounds` | 2711-2719 | PASS — sounds.spec.ts + full-sweep, web |
| 14 | `count` | `renderCount` | 2733-2742 | PASS — count.spec.ts + full-sweep, web |
| 15 | `sort` | `renderSort` | 2752-2762 | PASS — sort.spec.ts + full-sweep, web |
| 16 | `puzzle` | `renderPuzzle` | 2835-2870 | PASS — puzzle.spec.ts + full-sweep, web |
| 17 | `focus` | `renderFocus` | 3065-3083 | PASS — practice-focus.spec.ts + full-sweep, web |
| 18 | `cloze` | `renderCloze` | 3086-3103 | PASS — practice-cloze.spec.ts + full-sweep, web |
| 19 | `temptation` | `renderTemptation` | 3128-3146 | FAIL — `listenForAnything` not attested on a device mic |
| 20 | `receptive` | `renderReceptive` | 3156-3166 | PASS — practice-receptive.spec.ts + full-sweep, web |
| 21 | `pairs` | `renderPairs` | 3177-3186 | PASS — practice-pairs.spec.ts + full-sweep, web |
| 22 | `combine` | `renderCombine` | 3189-3202 | PASS — practice-combine.spec.ts + full-sweep, web |
| 23 | `parent` | `renderParent` | 3220-3229 | PASS — parent.spec.ts unlocks and visits all five tabs, web |

Sub-states that are not separate views:

| Item | Legacy lines | Status |
|---|---|---|
| Parent lock screen when `view==='parent' && !unlocked` | 3230-3247 | PASS — ParentGateScreen + parent.spec.ts, web |
| Home fallback when `views[view]` is missing | 2109 | FAIL — Expo Router has no `views` map fallback to Home; unknown routes are not proven to land on Home |
| Deep link `?game=<type>` after the start gate | 4246-4247 | FAIL — `parseGameDeepLink` is unit-tested only; cold-start wiring was deferred (phase-07-report.md) and was not added |

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
| `quiz` | איפה ה...? | `setupQuizRound`, `nextQuiz` | 3488-3510 | PASS — quiz-reducer.test.ts + quiz.spec.ts, web |
| `memory` | משחק זיכרון | inline in `startGame` | 3512-3533 | PASS — memory-reducer.test.ts + memory.spec.ts, web |
| `missing` | מה נעלם? | `setupMissingRound`, `nextMissing` | 3535-3558 | PASS — missing-reducer.test.ts + missing.spec.ts, web |
| `match` | חיבורים | inline in `startGame` | 3560-3577 | PASS — match-reducer.test.ts + match.spec.ts, web |
| `sounds` | מי אמר את זה? | `setupSoundsRound` | 3604-3621 | PASS — sounds-reducer.test.ts + sounds.spec.ts, web |
| `count` | כמה יש? | `setupCountRound` | 3623-3636 | PASS — count-reducer.test.ts + count.spec.ts, web |
| `sort` | לאיזו קופסה? | `setupSortRound` | 3638-3654 | PASS — sort-reducer.test.ts + sort.spec.ts, web |
| `bubbles` | בועות מילים | `spawnBubble` | 3597-3602 | PASS — bubbles-reducer.test.ts + bubbles.spec.ts, web |
| `puzzle` | שִׂימִי בַּמָּקוֹם | `setupPuzzleBoard`, `puzzleSelect`, `puzzleDrop`, `puzzleFinish`, `puzzleAdvance`, `bindPuzzle`, `puzzleAttachDrag` | 3579-3588 | FAIL — web drag path exercised; native drag + landscape lock not attested on a device |
| `speech` | תגידי את זה | inline, `startListening` 3841-3876 | 3590-3595 | FAIL — web unsupported path only; he-IL recognition not attested on a device |
| `cards` *(not a game)* | כרטיסיות | none | 3457-3479 | PASS — cards-navigation.test.ts + cards.spec.ts, web |

Game-level behaviours:

| Item | Legacy lines | Status |
|---|---|---|
| `MIN_ITEMS` gate and category fallback | 2489-2494 | PASS — startGame.ts + game-session.test.ts |
| `gameCatChips()` shows only categories with 4+ items | 2282-2291 | PASS — home-data / navigation tests + games menu e2e |
| `sounds` always forces `CATEGORIES.animals` with a `sound` field | 2520-2523 | PASS — sounds.spec.ts pins animals |
| `sort` picks 2 random categories | 2745-2750 | PASS — sort-reducer.test.ts |
| `doneCard()` star tiers: >=85% three, >=50% two, else one | 3204-3208 | PASS — done-card.test.ts |
| `weightedPick()` SRS-lite prioritisation by `stats.wrong` | 1869-1877 | PASS — progress.test.ts / game reducers |
| `markSeen()` seen++ / wrong++ / wrong-- on correct | 1878-1883 | PASS — progress store + game e2e (quiz lastcat / stats) |
| Adaptive `settings.puzzleLevel` 1-5 | 2973-2978 | PASS — puzzle-difficulty.test.ts |

---

## 3. Speech-practice modes — 6

`PRACTICE_LIST` (2218-2225). `HOME_PRACTICE_HOME` (1383-1387) shows only
`focus`, `receptive`, `cloze` on Home.

| Mode id | Hebrew title | Setup / helpers | Supporting const | Status |
|---|---|---|---|---|
| `focus` | מילה במיקוד | inline in `startGame` | `CARRIERS` 1597 | PASS — focus-reducer.test.ts + practice-focus.spec.ts, web |
| `receptive` | תראי לי | `setupReceptiveRound` | none | PASS — receptive-reducer.test.ts + practice-receptive.spec.ts, web |
| `cloze` | משלימים ביחד | `runCloze`, `clozeNext` | `CLOZE` 1600-1609 | PASS — cloze-reducer.test.ts + practice-cloze.spec.ts, web |
| `temptation` | הצנצנת | `openJar`, `listenForAnything` | none | FAIL — board renders (practice-temptation.spec.ts); any-sound jar open not attested on a device mic |
| `pairs` | דומה אבל לא | `setupPairsRound` | `PAIRS` 1612-1620 | PASS — pairs-reducer.test.ts + practice-pairs.spec.ts, web |
| `combine` | שתי מילים | inline in `startGame` | `MODIFIERS` 1623-1628 | PASS — combine-reducer.test.ts + practice-combine.spec.ts, web |

| Item | Legacy lines | Status |
|---|---|---|
| `SPEECH_VIEWS` set drives the listening-focus music profile | 2018 | PASS — PracticeGate sets `speechOrListeningTask`; audio-policy-parity.test.ts |
| Each mode speaks its prompt exactly once on entry | interaction_suite test 12 | PASS — speechSpy in practice-* and quiz/speech specs, web |

---

## 4. Vocabulary — 10 categories, 182 built-in words

`CATEGORIES` at 1480-1592. `art(cat, slug)` at 1476-1479 builds
`assets/words/{cat}/talki-{cat}-{slug}.png`, except colours which use
`talki-colors-shapes-{slug}.png`.

| Category id | Title | Icon | cls | Words | Status |
|---|---|---|---|---|---|
| `animals` | חיות | 🐶 | `c-animals` | 26 | PASS — domain-parity.test.ts vs legacy-domain.json |
| `food` | אוֹכֶל | 🍎 | `c-food` | 26 | PASS — domain-parity.test.ts |
| `colors` | צְבָעִים וְצוּרוֹת | 🎨 | `c-colors` | 26 | PASS — domain-parity.test.ts |
| `home` | בַּבַּיִת | 🧸 | `c-home` | 26 | PASS — domain-parity.test.ts |
| `family` | מִשְׁפָּחָה | 👨‍👩‍👧 | `c-family` | 12 | PASS — domain-parity.test.ts |
| `body` | הַגּוּף | 👀 | `c-body` | 12 | PASS — domain-parity.test.ts |
| `actions` | פְּעוּלוֹת | 🏃 | `c-actions` | 16 | PASS — domain-parity.test.ts |
| `numbers` | מִסְפָּרִים | 🔢 | `c-numbers` | 10 | PASS — domain-parity.test.ts |
| `outside` | בַּחוּץ | 🌳 | `c-outside` | 18 | PASS — domain-parity.test.ts |
| `emotions` | רְגָשׁוֹת | 😊 | `c-emotions` | 10 | PASS — domain-parity.test.ts |
| **Total** | | | | **182** | PASS — domain-parity.test.ts + asset-registry.test.ts |

| Item | Legacy lines | Status |
|---|---|---|
| Virtual `mine` category injected by `allCats()` | 1831-1834 | PASS — custom-words.test.ts; games menu hides `mine` until words exist |
| Item shape `{word, emoji, img, shape}` on all 182 | 1480-1592 | PASS — domain-parity.test.ts |
| Optional `sound` field on 17 items | 1480-1592 | PASS — domain-parity.test.ts |
| Optional `photo` field on custom words only | — | FAIL — PhotoService.pick is a stub; no 320×320 JPEG from the device library |
| Exact word list per category matches byte for byte including niqqud | — | PASS — domain-parity.test.ts vs extracted fixture |

---

## 5. Progress, points and stats

| Item | Legacy lines | Status |
|---|---|---|
| `key(catId, word)` returns `catId + ':' + word` | 1837 | PASS — progress.test.ts |
| Points equals `learned.size`, not a separate counter | 2075-2079 | PASS — progress.test.ts + home.spec.ts points pill |
| `totalWords()` includes custom words | 1838 | PASS — progress.test.ts |
| `catLearned(cat)` | 1839 | PASS — progress.test.ts |
| `currentCategory()` step 1: return `lastCat` if not fully learned | 2206-2216 | PASS — progress.test.ts + home.spec.ts hero |
| `currentCategory()` step 2: highest completion ratio in progress | 2206-2216 | PASS — progress.test.ts |
| `currentCategory()` step 3: first untouched category | 2206-2216 | PASS — progress.test.ts |
| `currentCategory()` step 4: fall back to `cats[0]` | 2206-2216 | PASS — progress.test.ts |
| `lastCat` persisted only by `enterCat()`, not by `startGame()` | 1823 | PASS — quiz.spec.ts asserts `lia:lastcat` unchanged after startGame |
| `STAR_STEP = 10` and `wordsToNextStar()` | 1845-1846 | PASS — progress.test.ts / stars.ts |
| `celebrate()` fires every 10th learned word — **only from the category word-tile path**, not from games or practice (defect D13) | 3451 | FAIL — category WordTile marks learned but never fires the celebrate overlay; D13 carried and still unported |

---

## 6. Persistence — 7 keys

`K` at 1633-1637. Backends tried in order: IndexedDB (`lia-words` / `kv` / v1),
`window.storage`, in-memory `Map` (1662-1745). No `localStorage` use.

| Key | Value shape | Status |
|---|---|---|
| `lia:progress` | `string[]` of `"catId:word"` | PASS — storage.test.ts + home/category/parent e2e via `__talkiStorageE2E` |
| `lia:settings` | settings object | PASS — parent.spec.ts settings persist |
| `lia:stats` | `{ [key]: { seen, wrong } }` | PASS — game e2e + progress store |
| `lia:custom:index` | `string[]` of custom ids | PASS — custom-words.test.ts |
| `lia:custom:<id>` | `{ id, word, emoji, photo }` | PASS — custom-words.test.ts (photo field present; capture FAIL, see §4) |
| `lia:rec:<catId:word>` | audio data URL string | FAIL — native stores a file + flag; export boundary is a data URL; device record/play not attested |
| `lia:lastcat` | category id string | PASS — category enterCat + quiz.spec.ts |

---

## 7. Settings

Defaults at 1647. Two further keys are written at runtime and must survive
round-tripping.

| Key | Default | Notes | Status |
|---|---|---|---|
| `rate` | `0.85` | parent options 0.6 / 0.85 / 1 | PASS — parent.spec.ts + settings store |
| `niqqud` | `true` | | PASS — parent.spec.ts |
| `sounds` | `true` | SFX | PASS — parent.spec.ts |
| `effects` | `true` | confetti / animations | PASS — parent.spec.ts (toggle persisted; device animation not measured) |
| `music` | `true` | | PASS — parent.spec.ts |
| `musicVol` | `0.5` | parent options 0.25 / 0.5 / 0.85 | PASS — parent.spec.ts |
| `voice` | `true` | voice prompts | PASS — parent.spec.ts |
| `lastBackup` | absent | ISO string, set on export (1771) | PASS — backup-export.test.ts |
| `puzzleLevel` | absent | 1-5, adaptive (2973-2978) | PASS — puzzle-difficulty.test.ts |

---

## 8. Backup — version 1

`exportBackup()` 1754-1775, `importBackup()` 1777-1799, `BACKUP_VERSION = 1`
at 1752.

| Item | Detail | Status |
|---|---|---|
| Export payload shape | `{app, version, exported_at, word_count, data}` | PASS — backup-export.test.ts |
| `app` is `"talki"` on export | 1758 | PASS — backup-export.test.ts |
| `word_count` equals `learned.size` | 1761 | PASS — backup-export.test.ts |
| `data` is every `Store` key verbatim | 1755-1756 | PASS — backup-export.test.ts |
| Filename `talki-backup-YYYY-MM-DD.json` | 1767-1768 | FAIL — web export path not attested as a real file download on a device share sheet |
| Export sets `settings.lastBackup` | 1771 | PASS — backup-export.test.ts |
| Import accepts `app === "talki"` | 1781 | PASS — backup-import.test.ts |
| Import **also** accepts legacy `app === "lia-words"` | 1781 | PASS — backup-import.test.ts |
| Import rejects a payload with no `data` | 1781 | PASS — backup-import.test.ts |
| Import rejects unparseable JSON with a toast, not a crash | 1779-1780 | PASS — backup-import.test.ts + parent import path |
| `replace` mode deletes all keys first | 1783-1785 | PASS — backup-import.test.ts |
| `merge` mode unions `lia:progress` arrays via Set | 1788-1790 | PASS — backup-import.test.ts |
| `merge` mode overwrites all other keys | 1791-1792 | PASS — backup-import.test.ts |
| Import clears the recordings cache and reloads state | 1795-1797 | PASS — backup-roundtrip.test.ts |
| Recordings survive export and re-import as data URLs | — | FAIL — unit roundtrip covers the shape; a real recorded file on disk was not exported on a device |

---

## 9. Audio

`assets/audio/audio-logic.js` is the pure policy. `audio-manager.js` is the
DOM runtime that must be rewritten.

| Item | Detail | Status |
|---|---|---|
| 22 semantic SFX events resolve to real files | `SFX_FILES` | PASS — audio-policy-parity.test.ts |
| 10 music state keys resolve | `MUSIC_FILES` | PASS — audio-policy-parity.test.ts |
| `rewardScreen` reuses the home track | | PASS — audio-policy-parity.test.ts |
| Home screen plays a per-session random *gameplay* track, never `home` | `welcomeMusicProfile` 2008-2017 | FAIL — policy ported; real `expo-audio` playback on a device not attested |
| Per-game music assignment is fixed, not random | `GAME_MUSIC_PROFILE` 2001-2007 | PASS — policy + useGameAudio; device playback FAIL (same as row above) |
| `SPEECH_VIEWS` membership forces `speechOrListeningTask` | 2018-2024 | PASS — PracticeGate + policy tests |
| Crossfade 600 ms in / 500 ms out, both tracks loop | audio-manager.js 101-142 | FAIL — timings in the engine; not measured on a device |
| Reward screen music multiplier `0.72` | | PASS — audio-policy-parity.test.ts |
| Duck priority speaking > listening > voicePrompt | `DUCK` | PASS — audio-policy-parity.test.ts |
| Duck `voicePrompt` music 0.32 sfx 0.55 attack 100 release 350 | | PASS — audio-policy-parity.test.ts |
| Duck `listening` music 0.18 sfx 0.25 attack 120 release 450 | | PASS — audio-policy-parity.test.ts |
| Duck `speaking` music 0.08 sfx 0.0 attack 80 release 500 | | PASS — audio-policy-parity.test.ts |
| Cooldowns tap 60, answer 400, celebration 800 | `COOLDOWN_MS` | PASS — audio-policy-parity.test.ts |
| `MAX_SIMULTANEOUS_SFX = 3` | | PASS — audio-policy-parity.test.ts |
| SFX hard-blocked while the child is speaking | `shouldPlaySfx` | PASS — audio-policy-parity.test.ts |
| `NEVER_COMBINE` pairs never fire together | | FAIL — still declared and unit-tested, still not consulted by `shouldPlaySfx` (legacy D10 carried) |
| Volume math clamps to 0..1 | | PASS — audio-policy-parity.test.ts |
| Music crossfade between states | audio-manager.js | FAIL — not measured on a device |
| Pause on background, resume on foreground | audio-manager.js | FAIL — not attested on a device |
| User music-volume multiplier applies | audio-manager.js | FAIL — settings persist; audible multiply not attested on a device |
| First-gesture audio unlock | 4068-4084 | FAIL — audio-lab exists; device unlock not attested |

Music files on disk that are **not** mapped and must stay unmapped unless a
decision is recorded: `02_gameplay_bouncy.mp3`, `03_gameplay_curious.mp3`,
`04_gameplay_gentle.mp3`.

---

## 10. Voice, recording and recognition

| Item | Legacy lines | Status |
|---|---|---|
| `say(catId, word)` prefers a parent recording over TTS | 1888-1987 | PASS — word-voice.test.ts (preference); device playback FAIL |
| TTS `lang = 'he-IL'`, `rate = settings.rate`, `pitch = 1.1` | 1888-1987 | FAIL — args ported in WordVoiceService; no device confirmed a he-IL voice exists |
| `opts.core` bypasses the `settings.voice` gate | 1888-1987 | PASS — word-voice.test.ts |
| Graceful behaviour when no Hebrew voice exists | 1888-1987 | PASS — degradeNativeApis e2e leaves screens usable |
| `preloadRecs(catId)` lazy-loads a category's recordings | 3921-3927 | PASS — recordings.test.ts; not every rec on mount |
| Recording capped at 4 seconds | 3919-3957 | PASS — recording-service.test.ts cap; device mic FAIL |
| Recording stored at `lia:rec:<catId:word>` | 3919-3957 | FAIL — native file + index; device write not attested |
| `startListening()` for the speech game, `he-IL`, Levenshtein <= 1 | 3841-3876 | FAIL — levenshtein.test.ts PASS; device recognition FAIL |
| `listenForAnything()` for temptation, any sound opens the jar, 8s timeout | 3885-3917 | FAIL — reducer exists; device mic timeout not attested |
| Every screen survives missing TTS / mic / recognition | interaction_suite test 10 | PASS — degradeNativeApis across game/practice specs, web |

---

## 11. Rewards — 24 stickers

`STICKERS` 2417-2442, `stickerUnlocked()` 2443-2447.

| # | Image | Unlock | Status |
|---|---|---|---|
| 1 | `talki-sticker-dog.png` | animals / כֶּלֶב | FAIL — unlock logic PASS (stickers.test.ts); art is an emoji tile, not the PNG |
| 2 | `talki-sticker-cat.png` | animals / חָתוּל | FAIL — same: unlock PASS, PNG art missing |
| 3 | `talki-sticker-elephant.png` | animals / פִּיל | FAIL — same |
| 4 | `talki-sticker-rabbit.png` | animals / אַרְנָב | FAIL — same |
| 5 | `talki-sticker-bird.png` | animals / צִפּוֹר | FAIL — same |
| 6 | `talki-sticker-butterfly.png` | animals / פַּרְפַּר | FAIL — same |
| 7 | `talki-sticker-apple.png` | food / תַּפּוּחַ | FAIL — same |
| 8 | `talki-sticker-cake.png` | food / עוּגָה | FAIL — same |
| 9 | `talki-sticker-icecream.png` | food / גְּלִידָה | FAIL — same |
| 10 | `talki-sticker-car.png` | outside / מְכוֹנִית | FAIL — same |
| 11 | `talki-sticker-house.png` | outside / בַּיִת | FAIL — same |
| 12 | `talki-sticker-sun.png` | outside / שֶׁמֶשׁ | FAIL — same |
| 13 | `talki-sticker-tree.png` | outside / עֵץ | FAIL — same |
| 14 | `talki-sticker-balloon.png` | colors / בָּלוֹן | FAIL — same |
| 15 | `talki-sticker-heart.png` | colors / לֵב | FAIL — same |
| 16 | `talki-sticker-flower.png` | colors / פֶּרַח | FAIL — same |
| 17 | `talki-sticker-rainbow.png` | colors / צִבְעוֹנִי | FAIL — same |
| 18 | `talki-sticker-ball.png` | home / כַּדּוּר | FAIL — same |
| 19 | `talki-sticker-kid-boy.png` | family / אָח | FAIL — same |
| 20 | `talki-sticker-kid-girl.png` | family / יַלְדָּה | FAIL — same |
| 21 | `talki-sticker-numbers.png` | numbers category complete | FAIL — unlock PASS (stickers.test.ts); PNG art missing |
| 22 | `talki-sticker-star.png` | milestone 1 | FAIL — unlock PASS; PNG art missing |
| 23 | `talki-sticker-sparkle.png` | milestone 25 | FAIL — unlock PASS; PNG art missing |
| 24 | `talki-sticker-gift.png` | milestone 75 | FAIL — unlock PASS; PNG art missing |

| Item | Legacy lines | Status |
|---|---|---|
| Filter chips: `all` plus each category present in STICKERS | 2448-2454 | PASS — stickers.spec.ts |
| "N of 24 collected" counter | 2471 | PASS — stickers.spec.ts (`N מתוך 24 מדבקות נאספו`) |
| Locked stickers render greyed, not hidden | 2456-2459 | PASS — stickers.spec.ts opacity 0.35 |
| Star badge on learned word tiles | 3448-3449 | PASS — WordTile + category.spec.ts |

---

## 12. Parent area

| Item | Legacy lines | Status |
|---|---|---|
| Entry is a 900 ms hold on `#parentBtn`; a short tap only toasts | 4050-4058 | PASS — parent.spec.ts (950 ms hold; move >12 px cancels) |
| Gate is a multiplication question, a in 3..9, b in 2..9 | 3232-3233 | PASS — parent-gate.test.ts + parent.spec.ts |
| Numeric keypad 0-9, clear, OK | 3230-3247 | PASS — ParentGateScreen keypad; clear empties input; parent-gate.test.ts + parent.spec.ts |
| Wrong answer does not unlock | 3764-3772 | PASS — parent.spec.ts |
| Leaving the parent view re-locks it | 2098-2100 | PASS — parent.spec.ts + useParentLock |
| Tab `settings` | 3248-3295 | PASS — parent.spec.ts |
| Tab `record` | 3296-3318 | PASS — parent.spec.ts visits the tab; device mic FAIL |
| Tab `words` | 3319-3342 | PASS — parent.spec.ts visits the tab; photo pick FAIL |
| Tab `report` | 3358-3376 | PASS — parent.spec.ts |
| Tab `method` | 3343-3357 | PASS — parent.spec.ts |
| Progress reset clears learned/stats/lastCat, keeps recordings and custom | — | PASS — progress-reset.test.ts (exact keys) |
| Report shows per-category progress and top 10 hard words by `stats.wrong` | 3358-3376 | PASS — report domain + parent report tab |
| Custom word CRUD with a 320x320 JPEG photo | 3319-3342 | FAIL — word CRUD exists; PhotoService.pick is a stub |
| Per-word recording management by category | 3296-3318 | FAIL — UI + 4000 ms cap exist; device record/play/deny not attested |
| Storage engine name and quota shown | — | FAIL — Settings tab never shows engine name or quota |
| No adult control is reachable from any child screen | interaction_suite test 12b | PASS — no `<select>` on child screens (navigation.spec.ts + game specs) |

---

## 13. Platform and shell

| Item | Legacy lines | Status |
|---|---|---|
| App id `com.yonicks.talki` | capacitor.config.ts | PASS — app.config.ts + eas.json (`com.yonicks.talki` / `.dev`) |
| Splash 1400 ms, background `#FFF6E4` | capacitor.config.ts | FAIL — colour in extra.splashBackground; 1400 ms native splash not attested (`expo-splash-screen` not installed) |
| Status bar DARK on `#FFF6E4` | capacitor.config.ts, 4137-4138 | FAIL — native uses DARK on `#FFF8EA` (D2 recorded); not attested on a device |
| AdMob adaptive banner, bottom centre | 4092-4131 | FAIL — flags + reservation PASS (ad-layout.spec.ts); `react-native-google-mobile-ads` not installed; no device banner |
| AdMob `tagForChildDirectedTreatment: true` | 4099-4100 | PASS — adConfig.ts verbatim; live request log not captured on a device |
| AdMob `maxAdContentRating: 'General'` | 4099-4100 | PASS — adConfig.ts verbatim |
| AdMob `npa: true` non-personalised | 4104-4110 | PASS — adConfig.ts verbatim |
| Ad height reserved in layout, no content occlusion | 4092-4131 | PASS — ad-layout.spec.ts with `__talkiSetAdReserved` |
| Wake lock while in use | 4085-4087 | FAIL — `expo-keep-awake` not added (phase-13-report.md) |
| Works offline after first load | sw.js, test_suite test 6 | FAIL — no service worker on Expo; cold start with no network not attested |
| Hebrew RTL throughout | test_suite test 2 | PASS — TalkiScreen `dir="rtl"` + full-sweep / gallery RTL tests, web |
| Niqqud toggle affects display but never TTS input | 1828-1830 | PASS — WordTile + word-voice.test.ts |
| Every child-facing touch target is at least 48 x 48 | interaction_suite test 2 | PASS — auditTouchTargets across e2e; web only |
| No horizontal overflow at any supported viewport | test_suite test 1 | PASS — overflow asserts in e2e + full-sweep, web |
| Rapid repeated taps never double-score or double-advance | interaction_suite test 5 | PASS — burst() in quiz and others, web |
| Re-rendering does not accumulate event listeners | interaction_suite test 4 | PASS — countListeners in game specs, web |
| Hardware back navigates rather than exiting | 2118-2124 | FAIL — `page.goBack()` works on web; hardware back / Android predictive back not attested |

---

## 14. Deliberate deviations from parity

These are intentional changes, not gaps. Each needs a recorded decision, not a
PASS.

| Deviation | Legacy behaviour | Native behaviour | Recorded in | Status |
|---|---|---|---|---|
| Orientation | Hard portrait lock (`screen.orientation.lock('portrait')` 4088, `manifest.json`) | Games and practice landscape, other routes responsive | phase-04-plan.md | N/A — INTENDED; device lock not attested |
| Opening sequence | Static bumper | Animated Yonicks Studios sequence | phase-06-plan.md | N/A — INTENDED; intro.spec.ts, web |
| Recording storage | Data URL string in the KV store | File on disk, data URL only at the export boundary | phase-03-plan.md | N/A — INTENDED; device file I/O not attested |
| Home layout | Current implementation | Approved mock `docs/design/talki-home-approved.png` | phase-07-plan.md | N/A — INTENDED; compared in phase-14-comparison.md |
| Ads library | `@capacitor-community/admob` | `react-native-google-mobile-ads` | phase-13-plan.md | FAIL — the recorded library was never installed; web is `noopAds`; native file is a log-only seam |

---

## 15. Known legacy defects — carry forward or fix, but decide

Graded in Phase 0 against the code. Each row is a decision to make, not
necessarily a fix. Ids match `00-current-state.md` section 18.

| Defect | Status |
|---|---|
| **D1** `tools/prepare_www.js` never copies `audio-manager.js` into `www/`, although `index.html` and `sw.js` both reference it — the Capacitor build ships with no audio runtime | N/A — Capacitor packaging; native uses `audioEngine`. Leave until Phase 15 retires Capacitor |
| **D2** Background colour is `#FFF6E4` in Capacitor but `#FFF8EA` in the manifest, the `theme-color` meta and the native shell polish | N/A — recorded; native splash `#FFF6E4`, status bar `#FFF8EA` (phase-13). Do not unify |
| **D3** Every AdMob id on all three platforms is a Google test id | FAIL for store — repo still ships the sample id; real ids via `EXPO_PUBLIC_ADMOB_BANNER_ID` only |
| **D4** The wake lock is requested and re-requested but never released | FAIL — native did not port a wake lock at all |
| **D5** Storage write failures are silent everywhere except recording | FAIL — not re-verified; no new user-visible write-failure path |
| **D6** `body.has-ad` is toggled but no CSS rule consumes it | N/A — native uses `reservedAdHeight` / `composeContentBottom` instead |
| **D7** `launch()` always toasts "at least 4 words" even when `MIN_ITEMS` is 1 or 2 | FAIL — `START_GAME_TOAST` is still that same sentence (`startGame.ts`) |
| **D8** The `count` game writes neither `learned` nor `stats`, so playing it never advances progress | N/A — FIXED in native: `CountScreen` calls `markLearned`. Legacy still broken |
| **D9** CI runs neither `tests/audio-logic.test.js` nor `tests/word-speak-playwright.mjs` | N/A — legacy CI unchanged on purpose; mobile job runs vitest + playwright |
| **D10** `NEVER_COMBINE` is declared and unit-tested but never enforced at runtime | FAIL — `shouldPlaySfx` still ignores the pairs (audioPolicy.ts) |
| **D11** `game.countdownTick`, `game.countdownGo` and `system.softAttention` are mapped but never fired | N/A — carried unused, matching legacy |
| **D12** Deploy publishes the whole repository to Pages, including `android/` and `ios/` | N/A — legacy Pages job; not a native-app row |
| **D13** `celebrate()` is documented as firing on every 10th word learned anywhere, but its only call site is the category word-tile handler | FAIL — native still has no celebrate on the category word-tile path |
| `tests/interaction_suite.py` declares `SHOT_DIR` and never writes a screenshot | N/A — legacy harness; mobile writes screenshots |
| `tools/sweep.js` and `tools/audio-check.js` default to port 5173 while everything else uses 8000 | N/A — legacy tools; mobile Playwright uses 8081 once |
| `tools/make_store.py` hardcodes `/home/claude/build/lia-app` | N/A — legacy tool |
| `tools/screenshot.js` documents an unimplemented `--wait=selector` | N/A — legacy tool |
| `assets/audio/music/02`, `03`, `04` exist on disk but are unmapped | N/A — stay unmapped unless a decision is recorded |
