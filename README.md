# Talki

A Hebrew early-speech practice app grounded in real speech-language-pathology
techniques for late talkers. It runs as an installable PWA with **no backend,
no accounts, and no network required after first load** — every word tap,
recording, and setting lives in IndexedDB on the child's own device.

> תרגום קצר: Talki היא אפליקציית PWA לתרגול דיבור בעברית, מבוססת על שיטות
> קליניות לעיכוב שפה (גירוי ממוקד, זיהוי לפני הפקה, זוגות מינימליים ועוד).
> הכול רץ במכשיר בלבד — בלי שרת, בלי חשבון, בלי אינטרנט אחרי הטעינה הראשונה.

## Who this is for

- **Product / non-technical readers** — read "What the app does" and
  "Feature tour" below to understand the experience end to end without
  opening the code.
- **Developers** — the whole app is one `index.html` (vanilla JS, no
  build step, no framework). Read "Architecture" and "Repo layout" before
  touching code.

## What the app does

Talki teaches a young child first spoken words in Hebrew. The core loop is: tap a
picture → hear the word spoken aloud (real recorded voice if a parent
recorded one, otherwise Hebrew text-to-speech) → repeat it back. On top of
that vocabulary loop sit two families of activities:

1. **Games** — arcade-style word games (quiz, memory, matching, etc.)
   that reinforce vocabulary the child already has some exposure to.
2. **Speech practice** — six activities modeled directly on techniques a
   speech-language pathologist would use with a late-talking toddler
   (see "The clinical method" below). These aren't generic edutainment;
   each one maps to a named intervention technique with a research basis,
   and that mapping is explained in-app on the parent screen so a parent
   (or an actual SLP) can see exactly what's being practiced and why.

A **parent screen**, gated behind a simple math problem so a toddler can't
wander in, gives caregivers control: settings, real voice recording,
adding personal/family words, a progress report, and a plain-language
explanation of the method. Everything — progress, settings, custom words,
voice recordings — exports to a single JSON backup file, because the
device is the only copy of the data.

## Feature tour

### Vocabulary categories
Ten built-in categories (**182 words**), each a themed set of illustrated
word tiles — plus **הַמִּלִּים שֶׁלִּי** ("my words"), a category built
entirely from words a parent adds (see below). Tapping any tile speaks the
word and marks it "learned" with a sticker; the home screen shows a
progress bar per category. Category titles on the home screen are displayed cleanly without niqqud.

#### 🐶 חַיּוֹת (animals) — 26
כֶּלֶב (dog), חָתוּל (cat), פָּרָה (cow), אַרְיֵה (lion), פִּיל (elephant),
בַּרְוָוז (duck), סוּס (horse), תַּרְנְגוֹלֶת (chicken), כִּבְשָׂה (sheep),
קוֹף (monkey), חֲזִיר (pig), צְפַרְדֵּעַ (frog), פַּרְפַּר (butterfly),
אַרְנָב (rabbit), צָב (turtle), דָּג (fish), צִפּוֹר (bird), דֹּב (bear),
גִּ'ירָפָה (giraffe), נָחָשׁ (snake), עַכְבָּר (mouse), זֶבְּרָה (zebra),
יַנְשׁוּף (owl), דְּבוֹרָה (bee), נְמָלָה (ant), פִּינְגְּוִין (penguin)

#### 🍎 אוֹכֶל (food) — 26
תַּפּוּחַ (apple), בָּנָנָה (banana), מַיִם (water), לֶחֶם (bread),
גְּלִידָה (ice cream), עַגְבָנִיָּה (tomato), מְלָפְפוֹן (cucumber),
חָלָב (milk), עֲנָבִים (grapes), תּוּת (strawberry), תַּפּוּז (orange),
אֲבַטִּיחַ (watermelon), בֵּיצָה (egg), גְּבִינָה (cheese), עוֹף (chicken),
פִּצָּה (pizza), מָרָק (soup), עוּגָה (cake), עוּגִיָּה (cookie), מִיץ (juice),
כָּרִיךְ (sandwich), פּוֹפְּקוֹרְן (popcorn), שׁוֹקוֹלָד (chocolate),
גֶּזֶר (carrot), תִּירָס (corn), לִימוֹן (lemon)

#### 🎨 צְבָעִים וְצוּרוֹת (colors & shapes) — 26
אָדוֹם (red), כָּחוֹל (blue), צָהוֹב (yellow), יָרוֹק (green), כָּתוֹם (orange),
סָגוֹל (purple), וָרוֹד (pink), חוּם (brown), שָׁחוֹר (black), לָבָן (white),
אָפוֹר (gray), תְּכֵלֶת (light blue), צִבְעוֹנִי (colorful), כּוֹכָב (star),
לֵב (heart), עִיגּוּל (circle), רִיבּוּעַ (square), מְשׁוּלָּשׁ (triangle),
מְעוּיָּן (diamond), חֵץ (arrow), יָרֵחַ (moon), טִפָּה (drop), פֶּרַח (flower),
תִּלְתָּן (clover), כֶּתֶר (crown), בָּלוֹן (balloon)

#### 🧸 בַּבַּיִת (home) — 26
כַּדּוּר (ball), בּוּבָּה (doll), מִיטָה (bed), נַעֲלַיִם (shoes),
מוֹצֵץ (pacifier), סֵפֶר (book), כִּסֵּא (chair), סַפָּה (sofa),
טֶלֶוִיזְיָה (television), דֶּלֶת (door), חַלּוֹן (window), שְׂמִיכָה (blanket),
אַמְבַּטְיָה (bathtub), מִבְרֶשֶׁת שִׁנַּיִם (toothbrush), סַבּוֹן (soap),
שֵׁירוּתִים (toilet), צַלַּחַת (plate), כּוֹס (cup), כַּף (spoon),
שָׁעוֹן (clock), טֶלֶפוֹן (phone), מַפְתֵּחַ (key), מַשְׁקָפַיִם (glasses),
מִטְרִיָּה (umbrella), בְּגָדִים (clothes), גַּרְבַּיִם (socks)

#### 👨‍👩‍👧 מִשְׁפָּחָה (family) — 12
אִמָּא (mom), אַבָּא (dad), סַבְתָּא (grandma), סַבָּא (grandpa),
תִּינוֹק (baby), אָח (brother), אָחוֹת (sister), יַלְדָּה (girl),
דּוֹדָה (aunt), דּוֹד (uncle), חָבֵר (friend), מִשְׁפָּחָה (family)

#### 👀 הַגּוּף (body) — 12
עַיִן (eye), אֹזֶן (ear), אַף (nose), פֶּה (mouth), יָד (hand), רֶגֶל (foot),
אֶצְבַּע (finger), שֵׁן (tooth), לָשׁוֹן (tongue), שֵׂעָר (hair), לֵב (heart),
בֶּרֶךְ (knee)

#### 🏃 פְּעוּלוֹת (actions) — 16
אוֹכֶלֶת (eating), שׁוֹתָה (drinking), יְשֵׁנָה (sleeping), רָצָה (running),
קוֹפֶצֶת (jumping), מוֹחֵאת כַּפַּיִם (clapping), מְנַשֶּׁקֶת (kissing),
מְחַבֶּקֶת (hugging), בּוֹכָה (crying), צוֹחֶקֶת (laughing),
מִתְרַחֶצֶת (bathing), שָׁרָה (singing), מְצַיֶּרֶת (drawing),
הוֹלֶכֶת (walking), שׂוֹחָה (swimming), רוֹקֶדֶת (dancing)

#### 🔢 מִסְפָּרִים (numbers) — 10
אַחַת (one), שְׁתַּיִם (two), שָׁלוֹשׁ (three), אַרְבַּע (four), חָמֵשׁ (five),
שֵׁשׁ (six), שֶׁבַע (seven), שְׁמוֹנֶה (eight), תֵּשַׁע (nine), עֶשֶׂר (ten)

#### 🌳 בַּחוּץ (outside) — 18
עֵץ (tree), שֶׁמֶשׁ (sun), עָנָן (cloud), גֶּשֶׁם (rain), שֶׁלֶג (snow),
מְכוֹנִית (car), אוֹטוֹבּוּס (bus), אוֹפַנַּיִם (bicycle), מָטוֹס (airplane),
סִירָה (boat), רַכֶּבֶת (train), בַּיִת (house), גַּן שַׁעֲשׁוּעִים (playground),
יָם (sea), חוֹל (sand), דֶּשֶׁא (grass), צֶמַח (plant), כּוֹכָבִים (stars)

#### 😊 רְגָשׁוֹת (emotions) — 10
שְׂמֵחָה (happy), עֲצוּבָה (sad), כּוֹעֶסֶת (angry), מְפֻחֶדֶת (scared),
עֲיֵפָה (tired), מֻפְתַּעַת (surprised), אוֹהֶבֶת (loving), מִתְבַּיֶּשֶׁת (shy),
רְעֵבָה (hungry), מִשְׁתַּעֲמֶמֶת (bored)

#### 💜 הַמִּלִּים שֶׁלִּי (my words)
Empty until a parent adds custom words (photo or emoji + optional real
voice recording) from the parent screen.

### Flashcards
A swipe-through, one-word-at-a-time card view for focused repetition,
separate from the tap-grid.

### Interactive Word-Speak UI & Speech-Rate Controls
To make pronunciation guidance more engaging and accessible, the app includes:
- **Interactive Speech Feedback:** Guided speech bubbles, pointing hands, target markers, and intuitive play/pause/navigation controls that visually direct the child's focus during voice playback.
- **Top Bar Controls:** The compact child header carries three things only — the star/points count, the centred Talki brand mark (long-press for the parent screen) and the background/gameplay music toggle. Hebrew speech rate is set from the speed control in parent settings.

### Navigation
The app features a persistent bottom navigation bar providing quick access to:
- **Home:** Main category view.
- **Games:** Central hub for all arcade-style activities.
- **Rewards:** Track stickers and progress milestones.

### Games (arcade-style vocabulary reinforcement)
| Game | What happens |
|---|---|
| 🎧 איפה ה...? (Quiz) | Hear a word, tap the matching picture |
| 🃏 משחק זיכרון (Memory) | Classic pairs match — picture ↔ word |
| 🙈 מה נעלם? (Missing) | Spot which picture disappeared |
| 🔗 חיבורים (Match) | Draw a line from word to picture |
| 🎤 תגידי את זה (Speech) | Say the word out loud; speech recognition checks it |
| 🖼️ כרטיסיות (Cards) | Flashcard mode, launched as a "game" from the menu |
| 🫧 בועות מילים (Bubbles) | Pop bubbles, hear the word behind each one |
| 🐮 מי אמר את זה? (Sounds) | Hear an animal sound, find the right animal |
| 🔢 כמה יש? (Count) | Count items, pick the matching number |
| 📦 לאיזו קופסה? (Sort) | Sort pictures into the right category |
| 🧩 שימי במקום (Puzzle) | Drag each picture onto its shadow — or tap the piece, then tap the shadow. Talki speaks the word as it snaps in. Shape tags are added to all puzzle vocabulary items for enhanced visual distinctness |

### Speech practice — the clinical method
Six activities under "תרגול דיבור", each tied to a named early-intervention
technique for late talkers (explained in full, in Hebrew, on the parent
screen's "השיטה" tab):

| Activity | Technique | Idea |
|---|---|---|
| 🎯 מילה במיקוד (Focused word) | Focused stimulation | One target word modeled ~8 times across short natural sentences |
| 👉 תראי לי (Show me) | Receptive identification | No speech required — child points; difficulty (2→3→4 options) only increases after 3 correct in a row |
| ⏸️ משלימים ביחד (Fill it in) | Expectant delay / cloze | A familiar sentence stops one word short, then 5 seconds of silence with an expectant look |
| 🫙 הצנצנת (The jar) | Communication temptation | A desirable object requires the child to initiate — any attempt counts (word, syllable, sound, or tap) |
| 👂 דומה אבל לא (Similar but not) | Minimal pairs | Distinguishing words that differ by one sound (עֵץ/עֵז, יָד/יָם) at the listening stage, before production |
| ➕ שתי מילים (Two words) | Semantic expansion / recast | Core words ("more", "no more", "big", "mine") get recast into a full sentence on every choice |

The in-app explanation is explicit that **the app supports practice, it
does not replace a speech-language pathologist** — if there's a real
concern about speech delay, it says to get evaluated.

### Adaptive word selection
Games don't pick words uniformly at random. `weightedPick()` is a
lightweight spaced-repetition heuristic: words the child has gotten wrong
more often are weighted to appear more; words seen many times recently are
weighted down; a little randomness keeps it from feeling mechanical. The
parent report surfaces the resulting "words worth reviewing" list.

### Personalization & Playback Customization
Parents can add custom words with a photo (or emoji) and a real voice
recording — e.g. a grandparent's name, a neighbor's dog, a favorite toy —
so the vocabulary isn't limited to generic stock categories. Real recorded
voice is preferred everywhere over synthesized TTS when available, because
a familiar voice works better for a child than a robotic one. Background gameplay music and UI sound feedback can be adjusted globally.

### Parent screen
Long-press the Talki brand mark in the header — the only way in, now that the
child navigation has three destinations and none of them is this screen — and
solve a random one-digit multiplication problem to get in (keeps a toddler out,
not a determined adult). Five tabs:
- **⚙️ הגדרות (Settings)** — speech rate, niqqud (vowel points) on/off,
  background music + volume, feedback sounds, confetti/animation effects,
  install prompt, backup/restore, progress reset.
- **🎙️ הקלטות (Recordings)** — record real voice per word, per category,
  play back or delete.
- **💜 מילים שלי (My words)** — add/remove custom words with photo + emoji.
- **📊 דוח (Report)** — per-category progress bars, total words learned,
  a "words to review" list driven by the same wrong-answer weighting used
  in games.
- **📚 השיטה (The method)** — the plain-language technique explanations
  described above.

### Data & backup
All state (learned words, per-word stats, settings, custom words, voice
recordings as blobs) lives in **IndexedDB** — nothing is ever sent over
the network. Export writes one JSON file with everything (recordings
included, base64-encoded); import supports merge or full replace. There is
no cloud sync, so **the on-device backup file is the only way data
survives a lost or reset device** — the app nags for this on the settings
tab.

### Installable PWA / offline
A service worker (`sw.js`) precaches the whole app shell cache-first, so
after the first load the app works with no network at all. It installs to
the home screen on Android (native prompt) and iOS (manual "Add to Home
Screen" — iOS never auto-prompts), launching full-screen with a splash
screen when opened from the home-screen icon rather than the browser.

### Platform differences
| Feature | Android/Chrome | iOS/Safari |
|---|---|---|
| Offline, install, icons, splash | ✅ | ✅ |
| Text-to-speech (Hebrew) | ✅ | ✅ (needs a Hebrew voice installed) |
| Voice recording | ✅ webm/opus | ✅ mp4/aac (auto-detected) |
| Speech recognition ("תגידי את זה", games needing mic input) | ✅ | ❌ not implemented in Safari |
| Wake lock (screen stays on) | ✅ | ⚠️ partial |

Speech-recognition-dependent games degrade gracefully on iOS rather than
breaking: "הצנצנת" still works via tap, "תגידי את זה" shows an explanation
instead of a broken mic prompt.

## Architecture

- **Single-file app.** `index.html` contains all markup, CSS, and JS — no build step, no bundler, no framework, no npm dependencies for the app itself. Rendering is a hand-rolled `render()`/view-state pattern (`view = 'home' | 'category' | 'quiz' | ...`), not React/Vue/etc.
- **Storage.** IndexedDB via a small wrapper (`detect/get/set/del/keys`),
  used for progress, settings, custom words, per-word stats, and voice
  recordings.
- **Audio.** Web Speech API (`speechSynthesis`) for Hebrew TTS, falling
  back gracefully where unsupported; `MediaRecorder` for parent-recorded
  voice (format auto-detected per browser); Web Speech API
  `SpeechRecognition` for the games that listen for the child speaking
  (Chrome/Android only).
- **Offline.** `sw.js` is a cache-first service worker; bump `VERSION`
  inside it on every deploy to bust old caches (see "Updating" below).
- **Mascot & art.** כּוֹכִי the mascot and the category background
  patterns are inline SVG, generated by `tools/make_art.py` and pasted
  into a generated-art block at the top of `index.html`'s script — they
  are not separate asset files.
- **Ads.** The browser PWA has no ads. The Capacitor Android wrapper
  shows a child-directed, G-rated, non-personalized AdMob banner after
  the start gate. Replace the Google sample IDs before a store release.

## Repo layout

```
talki/
├── index.html          the entire app (markup + CSS + JS)
├── manifest.json        PWA manifest (name, icons, shortcuts, portrait lock)
├── sw.js                 service worker — precaches the shell, cache-first
├── assets/               images (game-menu cards, navigation icons)
├── icons/                192, 512, 512-maskable, apple-touch (180), favicon
├── splash/                iOS launch images, 5 device sizes
├── privacy.html          store-required privacy policy (GitHub Pages)
├── store/                 store listing assets
│   ├── listing.md          titles, descriptions, age, ads declaration
│   ├── play/               5 screenshots, 1080x1920, captioned
│   ├── appstore/           5 screenshots, 1290x2796 (6.7")
│   └── talki-play-store-feature-graphic.png  1024x500, Play Store feature graphic
├── capacitor.config.ts Capacitor wrapper (Play Store + App Store)
├── android/              native Android project
├── ios/                  native Xcode project (build on a Mac)
├── docs/git/             git workflows and project configuration
├── tools/                  Python asset/art generation scripts
│   ├── make_assets.py       app icons + iOS splash screens
│   ├── make_art.py          mascot (5 expressions) + category patterns (inline SVG)
│   ├── make_store.py        store screenshots, captured from the running app
│   ├── make_native_icons.py Android/iOS launcher icons + splash
│   └── prepare_www.js       copy the PWA into www/ for Capacitor
├── tests/
│   ├── test_suite.py         Playwright end-to-end suite (state)
│   ├── interaction_suite.py  Real touch/pointer/keyboard + reachability audit
│   └── word-speak-playwright.mjs  tile/flashcard tap-to-speak (mock TTS)
└── .github/workflows/
    └── test-and-deploy.yml   CI: run tests on push/PR, deploy to Pages on main
```

## Running it locally

The app needs a secure context (service worker, mic access, and speech
recognition all require HTTPS or localhost) — opening `index.html` via
`file://` will not work correctly.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Tests & CI

Two Playwright Python suites, plus a node script for tap-to-speak.

**`tests/test_suite.py`** covers layout at four screen sizes, every category and
game opening, games played to completion, IndexedDB persistence, backup
export/restore, and PWA basics (manifest, icons, service worker, offline). It
drives the app with programmatic `element.click()`, which is ideal for checking
state transitions.

**`tests/interaction_suite.py`** is the other half: a JS click succeeds happily
on a button that is covered by the bottom nav, sized 30px, or parked off-screen,
so this suite uses real Playwright actions — `click()` with its actionability and
hit-test checks, `touchscreen.tap()`, stepped pointer drags, keyboard — plus a
DOM reachability and touch-size audit across eight device viewports. It covers
every control being reachable and at least 48px, every game opening and finishing
under a real tap, rapid taps scoring once, the Back button, the parent gate, the
Match & Drop puzzle (drag, tap→tap, keyboard, escalating help, resize, reduced
motion), degraded audio APIs, and offline.

**`tests/word-speak-playwright.mjs`** checks that tapping a word tile or flashcard
calls `speechSynthesis.speak()` and is not cancelled mid-word by a re-render.

```bash
pip install playwright && python -m playwright install chromium
python3 -m http.server 8000 &
BASE_URL=http://localhost:8000 python3 tests/test_suite.py
BASE_URL=http://localhost:8000 python3 tests/interaction_suite.py
node tests/word-speak-playwright.mjs
```

Both python-based test suites accept `CHROMIUM_PATH=/path/to/chrome` to use a prebuilt browser instead of
the managed download. The puzzle's word choice is randomised in production;
`?seed=7` (or `window.__talkiSeed`) makes it reproducible so tests never flake on
which words came up.

`.github/workflows/test-and-deploy.yml` runs both suites on every push and
pull request. On `master`, a passing run deploys to GitHub Pages and
rewrites the service worker's cache version to the commit SHA so
returning devices always pick up the new build. Pages is configured
(Settings → Pages → Source → GitHub Actions) and live at
https://yonicks.github.io/talki/. The repo is public, which GitHub
Pages requires on the free plan.

## Updating

Bump `VERSION` in `sw.js` (e.g. `talki-v1` → `talki-v2`) on every deploy. Old
caches are purged on activation, and returning users see a "new version"
toast on next launch.

## Deploying elsewhere

- **Netlify Drop** — drag the folder onto https://app.netlify.com/drop.
  Free, HTTPS included, done in a minute.
- **GitHub Pages** — see "Tests & CI" above.

## Regenerating art & store assets

The mascot and category patterns are inline SVG generated by
`tools/make_art.py`; re-run it and paste the output over the
generated-art block at the top of `index.html`'s script. Store
screenshots are captured from the real running app rather than mocked, so
they can't drift from what actually ships:

```bash
python3 tools/make_store.py
```

## Backing up a child's data

Parent screen (long-press 👤 → solve the math problem) → ⚙️ הגדרות →
גיבוי ושחזור → ייצוא. This writes one JSON file with everything, including
voice recordings. **Do this after any recording session** — the device is
the only copy.

## Shipping to Google Play and the App Store

Talki is a PWA plus Capacitor wrappers. The website stays installable from
the browser; the **Play Store** and **App Store** builds are the `android/`
and `ios/` projects. Package ID on both: `com.yonicks.talki`.

Privacy policy (paste this URL in both consoles):
**https://yonicks.github.io/talki/privacy.html**

Listing text, age rating, and ads answers: `store/listing.md`.
Screenshots: `store/play/` and `store/appstore/`.

Replace Google **sample** AdMob IDs with your real ones before release
(`admob_app_id` in Android `strings.xml`, `GADApplicationIdentifier` in
iOS `Info.plist`, and `ADMOB.banner` in `index.html`).

```bash
npm install
python tools/make_native_icons.py
npm run sync
```

### Google Play
1. Pay the one-time Google Play developer fee.
2. `npm run android` — Android Studio opens.
3. **Build → Generate Signed Bundle / APK** → Android App Bundle (`.aab`).
   Create a upload keystore once and keep it offline (not in git).
4. Play Console → Create app → Education, **designed for children**.
5. Upload the `.aab`, attach screenshots + feature graphic, paste the listing.
6. Content rating questionnaire, target age, Data Safety (**ads: yes**;
   Talki itself stores nothing in the cloud), privacy policy URL.
7. Submit for review.

### Apple App Store
Requires a Mac, Xcode, and an Apple Developer account ($99/year).

1. `npm run ios` on a Mac — Xcode opens.
2. Signing & Capabilities → your Team. Bundle ID `com.yonicks.talki`.
3. Product → Archive → Distribute to App Store Connect.
4. App Store Connect → new iOS app, age **4+**, category Education.
5. Paste listing copy, privacy URL, screenshots from `store/appstore/`.
6. Encryption: **ITSAppUsesNonExemptEncryption** is already `false`
   (HTTPS only). Do **not** enable App Tracking Transparency.
7. Submit for review. Lead with offline mode, on-device recordings, and
   parent-gated settings — Apple rejects empty web wrappers (4.2).

### Kids / ads
- Banner only, child-directed, G-rated, non-personalized.
- No ATT / advertising ID.
- A privacy policy is mandatory because of ads.
