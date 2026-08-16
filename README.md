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
progress bar per category.

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

### Personalization
Parents can add custom words with a photo (or emoji) and a real voice
recording — e.g. a grandparent's name, a neighbor's dog, a favorite toy —
so the vocabulary isn't limited to generic stock categories. Real recorded
voice is preferred everywhere over synthesized TTS when available, because
a familiar voice works better for a child than a robotic one.

### Parent screen
Long-press the 👤 icon and solve a random one-digit multiplication problem
to get in (keeps a toddler out, not a determined adult). Five tabs:
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

- **Single-file app.** `index.html` (~2,500 lines) contains all markup,
  CSS, and JS — no build step, no bundler, no framework, no npm
  dependencies for the app itself. Rendering is a hand-rolled
  `render()`/view-state pattern (`view = 'home' | 'category' | 'quiz' | ...`),
  not React/Vue/etc.
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
- **No backend, no accounts, no analytics, no ads, no external network
  calls at runtime.** This is a deliberate product constraint (see Kids
  category / app-store notes below), not just a current limitation.

## Repo layout

```
talki/
├── index.html          the entire app (markup + CSS + JS)
├── manifest.json        PWA manifest (name, icons, shortcuts, portrait lock)
├── sw.js                 service worker — precaches the shell, cache-first
├── icons/                192, 512, 512-maskable, apple-touch (180), favicon
├── splash/                iOS launch images, 5 device sizes
├── store/                 store listing assets
│   ├── play/               5 screenshots, 1080x1920, captioned
│   ├── appstore/           5 screenshots, 1290x2796 (6.7")
│   └── feature-graphic-1024x500.png
├── tools/                  Python asset/art generation scripts
│   ├── make_assets.py       app icons + iOS splash screens
│   ├── make_art.py          mascot (5 expressions) + category patterns (inline SVG)
│   └── make_store.py        store screenshots, captured from the running app
├── tests/
│   └── test_suite.py         Playwright end-to-end suite
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

A Playwright suite covers layout at four screen sizes, every category and
game opening, four games played to completion, IndexedDB persistence,
backup export/restore, and PWA basics (manifest, icons, service worker,
offline).

```bash
pip install playwright && python -m playwright install chromium
python3 -m http.server 8000 &
BASE_URL=http://localhost:8000 python3 tests/test_suite.py
```

`.github/workflows/test-and-deploy.yml` runs the suite on every push and
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

## Shipping to app stores (optional)

The web app can be wrapped for the Play Store / App Store without
rewriting anything.

### Android — Play Store via TWA
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR-URL/manifest.json
bubblewrap build          # produces a signed .aab
```

### iOS — App Store via Capacitor
```bash
npm init -y && npm i @capacitor/core @capacitor/cli
npx cap init "Talki" com.yourname.talki --web-dir=.
npx cap add ios && npx cap sync && npx cap open ios
```
Requires a Mac, Xcode, and an Apple Developer account ($99/yr). Apple
rejects thin web wrappers under guideline 4.2 — the offline mode,
microphone recording, and local-only storage are the native-value story
to lead with in a review submission.

### Kids category requirements (both stores)
- A privacy policy URL is mandatory.
- No third-party analytics, no ads, no external links — the app has none
  of these today, so this is a constraint to preserve, not a TODO.
- Google Play Data Safety form: declare **no data collected, no data
  shared** — literally true, since nothing ever leaves the device.
