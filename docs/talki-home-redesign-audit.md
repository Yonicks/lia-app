# Existing Home Architecture

> Audit for the Talki Home redesign. See [talki-home-redesign-cursor-plan.md](talki-home-redesign-cursor-plan.md) (source plan) and the phased plan derived from it for how this maps to implementation phases.

## Architecture summary

Talki is **not** a React/Vite/CRA app. It is a **single-file vanilla-JS PWA**: all HTML, inline CSS and inline JS live in [index.html](../index.html) (~2,986 lines). There is no bundler, no router, no component framework, no CSS modules and no state library. Navigation is a module-level `view` string; screens are functions that return HTML strings, injected into `#app` by `render()`.

Supporting files:

- [audio-manager.js](../audio-manager.js) — background music / SFX orchestration, loaded as a plain `<script src>`
- [assets/audio/audio-logic.js](../assets/audio/audio-logic.js) — pure audio-selection logic, has a Node unit test
- [capacitor.config.ts](../capacitor.config.ts) — the only TypeScript file, for the native wrapper
- [tools/prepare_www.js](../tools/prepare_www.js) — copies sources into `www/` for Capacitor; `tools/dev-server.js` serves the repo root on port 8000 for browser development



## Route

There is no URL router. A module-level variable `view` (default `'home'`) selects which render function `render()` calls. `view` and a companion `activeCat` are runtime-only and are **not** persisted or reflected in the URL.

```969:969:index.html
let view = 'home', activeCat = null, game = null, cardIdx = 0, parentTab = 'settings';
```



## Main component

`renderHome()` at `index.html:1376`, dispatched from the `views` map inside `render()`:

```1313:1334:index.html
function render(){
  updateHeader();
  const app = document.getElementById('app');
  const views = {
    home:renderHome, category:renderCategory, cards:renderCards,
    games:renderGamesMenu, practice:renderPractice, stickers:renderStickers, quiz:renderQuiz, memory:renderMemory,
    missing:renderMissing, match:renderMatch, speech:renderSpeech, parent:renderParent,
    bubbles:renderBubbles, sounds:renderSounds, count:renderCount, sort:renderSort,
    focus:renderFocus, cloze:renderCloze, temptation:renderTemptation,
    receptive:renderReceptive, pairs:renderPairs, combine:renderCombine
  };
  ...
  if(views[view]) document.body.dataset.view = view; else delete document.body.dataset.view;
  app.innerHTML = (views[view]||renderHome)();
  bind();
  syncBarHeight();
  syncBottomNav();
  window.scrollTo({top:0,behavior:'instant'});
  AudioManager.setMusicState(resolveMusicState());
}
```

`renderHome()` currently renders, top to bottom:

1. `.v2-header` illustrated banner — background image, waving mascot, star-count pill, gift button, greeting text, conditional "המשך ללמוד" CTA
2. Speech-support warning banner (only if the browser lacks TTS)
3. `.v2-continue` card, only if `currentCategory()` returns non-null
4. Section label `🗂️ קטגוריות` + `.v2-cat-grid` (all categories)
5. Section label `🗣️ תרגול דיבור` + "הכל ◀" pill + `.v2-practice-list` (first 3 of `PRACTICE_LIST`)
6. Section label `🎮 משחקים` + "הכל ◀" pill + `.v2-games-grid` (3 hardcoded games: quiz, memory, missing)



## Shared layout

There is no separate layout component — the shell is static HTML around `#app`:

```727:768:index.html
<div class="topbar">...</div>          <!-- persistent header, every screen -->
<div class="gate" id="gate">...</div>  <!-- one-time audio-unlock splash -->
<main id="app"></main>                 <!-- view content injected here -->
<div id="confettiHost" class="confetti"></div>
<div id="toast" class="toast"></div>
<nav class="bottom-nav" id="bottomNav">...</nav>  <!-- persistent footer, every screen -->
```

`.topbar` and `.bottom-nav` are **not** part of any view's markup — they exist once in the document and are shared across all ~20 screens. Any redesign touching them affects the whole app, not just Home.

## Header

Two header layers appear together on Home:

- `.topbar` (global, always visible): brand mark + wordmark/tagline, a hidden `.progress-pill` (progress ring, `display:none`), `#musicBtn` 🎵, `#speedBtn` 🐇, `#parentBtn` 👤
- `.v2-header` **(Home instance)**: mascot, `.v2-star-pill` (star count), `.v2-gift-btn` → `data-nav="stickers"`, greeting text, conditional CTA

Handlers:

```2810:2830:index.html
document.getElementById('musicBtn').addEventListener('click', ()=> setMusic(!settings.music));
document.getElementById('speedBtn').addEventListener('click', ()=>{
  settings.rate = settings.rate<=0.6 ? 0.85 : settings.rate<1 ? 1 : 0.6;
  saveSettings(); syncSpeedIcon();
  speakTTS('שלום',{});
});
let holdTimer = null, holdFired = false;
const pBtn = document.getElementById('parentBtn');
const startHold = ()=>{ holdFired = false; holdTimer = setTimeout(()=>{ holdFired = true;
  view='parent'; parentTab='settings'; render();
  preloadRecs(activeCat||'animals').then(()=>{ if(view==='parent') render(); });
}, 900); };
const cancelHold = ()=> clearTimeout(holdTimer);
['mousedown','touchstart'].forEach(ev=>pBtn.addEventListener(ev, startHold, {passive:true}));
['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>pBtn.addEventListener(ev, cancelHold));
pBtn.addEventListener('click', ()=>{ if(!holdFired) toast('להורים: לחיצה ארוכה על הכפתור'); });
```

`updateHeader()` runs on every `render()` and unconditionally writes to `#ringFill` — removing the ring element without updating this function will throw:

```1304:1311:index.html
function updateHeader(){
  const total = totalWords(), count = learned.size;
  document.getElementById('progressCount').textContent = count+'/'+total;
  const c = 2*Math.PI*15.5;
  const ring = document.getElementById('ringFill');
  ring.setAttribute('stroke-dasharray', c.toFixed(1));
  ring.setAttribute('stroke-dashoffset', (c*(1-(total?count/total:0))).toFixed(1));
}
```



## State / data sources

No Redux/Zustand/Context. State is module-level JS variables plus an IndexedDB-backed `Store` helper.

```957:970:index.html
const K = {
  progress:'lia:progress', settings:'lia:settings', stats:'lia:stats',
  customIndex:'lia:custom:index', custom:id=>'lia:custom:'+id, rec:key=>'lia:rec:'+key
};
...
let learned = new Set();                 // "catId:word" strings, persisted -> lia:progress
let stats = {};                          // "cat:word" -> {seen, wrong}, persisted -> lia:stats
let custom = [];                         // user-added "My Words" items
let recordings = {};                     // lazily loaded per-word voice recordings
let settings = { rate:0.85, niqqud:true, sounds:true, effects:true, music:true, musicVol:0.5, voice:true };
let view = 'home', activeCat = null, game = null, cardIdx = 0, parentTab = 'settings';
```

- **Points** = `learned.size` (count of learned words, not a separate currency)
- **Progress %** per category = `catLearned(cat) / cat.items.length`
- **Settings** persist via `saveSettings()` → `lia:settings`
- `view` / `activeCat` / `game` are runtime-only, never persisted — refresh always returns to Home



## Existing reusable components (CSS classes / render helpers)

These are shared across multiple screens — **must not be edited in place** during the Home redesign, only extended with new sibling classes:


| Class / helper                                 | Used by                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `.v2-header`                                   | `renderHome`, `renderCategory`, `renderPractice`, `renderGamesMenu`, `renderStickers` |
| `.v2-cat-card` / `.v2-cat-grid`                | `renderHome`                                                                          |
| `.v2-practice-card` / `pc-1`..`pc-6`           | `renderHome`, `renderPractice` (full 6-mode list)                                     |
| `.v2-game-card` (+ `.wide`, `.plain` variants) | `renderHome`, `renderGamesMenu`                                                       |
| `mascot(mood, size)`                           | many screens — returns `<span class="mascot-wrap">` with `MASCOT_IMG[mood]`           |
| `catGrad(id)`, `catIcon(id)`                   | Home + category screens                                                               |
| `.bottom-nav` / `.bn-item`                     | every screen                                                                          |
| `.topbar` / `.icon-btn`                        | every screen                                                                          |
| `display(word)` / `plain(word)`                | strips/keeps niqqud per `settings.niqqud`, used everywhere Hebrew is rendered         |




## Existing reusable assets

All under `assets/v2/` (PNG, generated from `svg/v2/` sources via `tools/make_art.py`):


| Directory                  | Count   | Content                                                                       |
| -------------------------- | ------- | ----------------------------------------------------------------------------- |
| `assets/v2/backgrounds/`   | 5       | per-screen hero banners, incl. `talki-bg-home-hero.png`                       |
| `assets/v2/mascot/`        | 12      | star mascot poses (`talki-star-waving.png`, `-idle`, `-cheer`, etc.)          |
| `assets/v2/categories/`    | 10      | one icon per built-in category (`talki-cat-icon-{id}.png`)                    |
| `assets/v2/game-menu/`     | 7       | game card thumbnails, incl. all 3 Home games (memory, where-is, missing)      |
| `assets/v2/games/`         | 8       | in-game background scenes                                                     |
| `assets/v2/speech/`        | 11      | practice-mode backgrounds + 5 microphone states                               |
| `assets/v2/icons/`         | 10      | UI chrome: home, games, gift, star, settings, back, close, mic, play, speaker |
| `assets/v2/brand/`         | 4       | app icon, loading mark, splash star, `talki-star-mark.png`                    |
| `assets/v2/decorations/`   | 5       | bunting, flowers (left/right), sparkles, podium                               |
| `assets/v2/effects/`       | 12      | confetti/particle/sparkle/star effects                                        |
| `assets/v2/stickers/`      | 24      | reward sticker illustrations                                                  |
| `assets/v2/badges/`        | 8       | achievement badges                                                            |
| `assets/words/{category}/` | 10 dirs | per-word illustrations, `talki-{cat}-{slug}.png`                              |


No `.webp` files exist yet despite being referenced by name in the source plan and in some `body[data-view]` CSS rules — confirm at integration time whether any referenced `.webp` paths are actually `.png` on disk.

## Category model

Defined in `CATEGORIES` (`index.html:804-916`), each entry: `{ id, title, icon (emoji, legacy), cls, items: [{word, emoji, img, sound?}] }`.


| id                              | Hebrew title       | Words                | Notes                                             |
| ------------------------------- | ------------------ | -------------------- | ------------------------------------------------- |
| animals                         | חַיּוֹת            | 26                   |                                                   |
| food                            | אוֹכֶל             | 26                   |                                                   |
| colors                          | צְבָעִים וְצוּרוֹת | 26                   |                                                   |
| home                            | בַּבַּיִת          | 26                   |                                                   |
| family                          | מִשְׁפָּחָה        | 12                   |                                                   |
| body                            | הַגּוּף            | 12                   |                                                   |
| actions                         | פְּעוּלוֹת         | 16                   | **not shown in the mockup**                       |
| numbers                         | מִסְפָּרִים        | 10                   | **not shown in the mockup**                       |
| outside                         | בַּחוּץ            | 18                   |                                                   |
| emotions                        | רְגָשׁוֹת          | 10                   |                                                   |
| mine (`allCats()` appends this) | הַמִּלִּים שֶׁלִּי | dynamic (`custom[]`) | icon is `talki-star-mark.png`, not a category PNG |


```1142:1150:index.html
function allCats(){
  const list = Object.values(CATEGORIES).map(c=>({...c}));
  list.push({ id:'mine', title:'הַמִּלִּים שֶׁלִּי', icon:'💜', cls:'c-mine', items:custom });
  return list;
}
function getCat(id){ return allCats().find(c=>c.id===id); }
function key(catId,word){ return catId+':'+word; }
function totalWords(){ return allCats().reduce((s,c)=>s+c.items.length,0); }
function catLearned(cat){ return cat.items.filter(i=>learned.has(key(cat.id,i.word))).length; }
```

**Total: 11 categories**, not the 9 drawn in the mockup — the redesign must render all 11 from `allCats()`.

## Continue-learning behavior

No persisted "last category" key. The resume target is recomputed every render:

```1359:1365:index.html
function currentCategory(){
  const cats = allCats().filter(c=>c.items.length);
  if(!cats.length) return null;
  const inProgress = cats.filter(c=>{ const d=catLearned(c); return d>0 && d<c.items.length; });
  if(inProgress.length) return inProgress.sort((a,b)=>(catLearned(b)/b.items.length)-(catLearned(a)/a.items.length))[0];
  return cats.find(c=>catLearned(c)===0) || cats[0];
}
```

Priority: (1) highest-% partially-learned category, (2) first fully-untouched category, (3) first category. Surfaced today via the hero CTA (`.v2-cta[data-cat]`) and the continue card (`.v2-continue[data-cat]`); both route through the same `data-cat` handler.

## Audio/music behavior

`audio-manager.js` (`AudioManager`) drives background music state via `resolveMusicState()`, called after every `render()`. `settings.music` (boolean) gates it; `setMusic()` toggles and persists. SFX are separate short clips in `assets/audio/sfx/`.

## Practice routes

`PRACTICE_LIST` (`index.html:1367-1374`), 6 entries; Home shows only the first 3 (`.slice(0,3)`):

```1367:1374:index.html
const PRACTICE_LIST = [
  ['focus','🎯','מילה במיקוד','מילה אחת, שמונה משפטים קצרים','pc-1'],
  ['receptive','👈','תראי לי','מזהים בלי צורך לדבר','pc-2'],
  ['cloze','⏸️','משלימים ביחד','עוצרים מילה לפני הסוף ומחכים','pc-3'],
  ['temptation','🫙','הצנצנת','משמיעים קול כדי לפתוח','pc-4'],
  ['pairs','👂','דומה אבל לא','עֵץ או עֵז? מבחינים בין צלילים','pc-5'],
  ['combine','➕','שתי מילים','מחברים "עוד" + מילה','pc-6']
];
```

Routing: click → `bind()`'s `[data-game]` handler → `launch(g, activeCat||fallback)` → `startGame(type, catId)` sets `view = type`. Each mode has a dedicated `render*` function (`renderFocus`, `renderReceptive`, etc.) and its own `body[data-view="..."]` background.

## Game routes

Home shows 3 hardcoded games (quiz, memory, missing) out of a larger set available from `renderGamesMenu()` (adds cards, sounds, count, match, bubbles, sort, speech):

```1633:1633:index.html
const MIN_ITEMS = {quiz:4,memory:4,match:4,missing:4,sort:4,receptive:4,sounds:4, ...};
```

`startGame()` falls back to any category with enough items if the active one is too small — this fallback behavior must be preserved. `?game=` query param on the start gate deep-links directly into a game.

## RTL setup

```2:2:index.html
<html lang="he" dir="rtl">
```

CSS uses a mix of logical properties (`padding-inline`, `inset-inline`, `inset-inline-start/end`, `text-align:start`) and some physical leftovers (a few `left`/`right` rules in game-specific code). Forward chevrons point left (`◀`); back chevrons point right (`▶`). `tests/test_suite.py` includes `test_rtl()` validating `dir`, visual order and chevron direction — expect to touch its selectors if Home class names change.

## Theme/tokens

All inline in `:root` (`index.html:28-41`). Two token sets coexist: a legacy/base palette (`--cream`, `--ink`, `--berry`, `--grape`, etc.) still used by older screens, and a V2 subset (`--v2-purple`, `--v2-mint`, `--v2-radius-card`, etc.) used by the newer Home/category/practice/games/stickers screens. No `--talki-*` prefixed tokens exist yet — those are proposed in the source plan and must be added additively.

## Existing test/dev tooling


| Tool                                    | Purpose                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev` → `tools/dev-server.js`   | serves the repo root on **port 8000**                                                 |
| `tests/test_suite.py`                   | Python + Playwright E2E: layout, RTL, screens, backup, audio gate                     |
| `tests/audio-logic.test.js`             | Node built-in test runner, unit-tests `assets/audio/audio-logic.js`                   |
| `tools/screenshot.js`                   | ad-hoc single-screenshot helper (fixed in Phase 0 to target port 8000 via `BASE_URL`) |
| `tools/sweep.js`                        | multi-view screenshot sweep with console-error capture                                |
| `.github/workflows/test-and-deploy.yml` | CI: serves on 8000, runs the Python suite, deploys to GitHub Pages                    |


There is **no** `npm run lint`, `typecheck`, `build`, or JS-based `test` script, and no `playwright.config.`* — despite `@playwright/test` being a listed devDependency.

## Risks

1. **Shared-class collisions.** `.v2-header`, `.v2-cat-card`, `.v2-practice-card`, `.v2-game-card` are used by 4+ other screens. Editing them in place instead of adding new `.home-`* classes will silently redesign those screens too.
2. `updateHeader()` **/** `#ringFill` **coupling.** Removing the topbar progress ring without updating `updateHeader()` throws on every render.
3. `--barh` **/ sticky offset coupling.** `syncBarHeight()` measures `.topbar` into `--barh`, consumed by `.cat-header`'s `top` offset on category/games screens. Header height changes must be re-verified there.
4. **Event-listener leak in** `bind()`**.** `on()` (`index.html:2220`) does `document.querySelectorAll(sel).forEach(el=>el.addEventListener(...))` and `bind()` runs on every `render()`. Any `[data-nav]`/`[data-cat]`/`[data-game]` element that persists across renders (i.e. anything outside `#app`, such as the bottom nav) accumulates a duplicate handler per render. This must be fixed (scope `bind()` to `#app`, delegate persistent chrome once at startup) **before** Phase 2 moves the gift button into the persistent topbar.
5. **No build step / no bundler.** All edits are directly to a single 2,986-line HTML file; there is elevated risk of merge conflicts or accidental duplicate CSS rules. Careful, scoped diffs are required.
6. **No JS lint/typecheck.** Quality gates for Phase 12 are limited to `node --check` (syntax only, and inapplicable to inline `<script>` in `index.html`), the two existing test suites, and manual console/screenshot inspection.
7. `www/` **is a generated, gitignored mirror.** `tools/prepare_www.js` must be re-run (or verified) after asset changes so the Capacitor/native build stays in sync; it is easy to forget since the dev server bypasses it.



## Recommended refactor boundary

- Touch only: `renderHome()` (`index.html:1376-1436`), the `:root` token block (additive only), a new `/* Home V3 */` CSS block, `.topbar` markup/CSS, `.bottom-nav` markup/CSS, `updateHeader()`, and `bind()`'s listener scoping.
- Do not touch: `CATEGORIES`, `allCats()`, `currentCategory()`, `catLearned()`, `PRACTICE_LIST` data, `startGame()`/`launch()`, `Store`, or any other screen's render function — except where a Home-only class rename requires a one-line selector update in `tests/test_suite.py`.
- New CSS classes should be prefixed `.home-` to make the Home-only surface obvious and avoid any future collision with `.v2-*`.

## Pre-redesign test baseline

Recorded during Phase 0.5, against the **untouched** app (before any Home redesign code changes), to give later phases something honest to diff against.

Environment setup used (system Python is externally managed, so a local venv was used instead of `pip install --break-system-packages`):

```bash
python3 -m venv .venv
.venv/bin/pip install --upgrade pip playwright
.venv/bin/python -m playwright install chromium
```

### `node --test tests/audio-logic.test.js`

```text
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

**Result: 18/18 PASS.**

### `BASE_URL=http://localhost:8000 SHOT_DIR=/tmp/talki-phase0.5-shots .venv/bin/python tests/test_suite.py`

```text
Testing http://localhost:8000/index.html

1. Layout across devices
  ✓ phone: 13 categories, no overflow, no errors
  ✓ ipad: 13 categories, no overflow, no errors
  ✓ desktop: 13 categories, no overflow, no errors
  ✓ phone-landscape: 13 categories, no overflow, no errors

2. Hebrew RTL semantics
  ✓ document declares and computes Hebrew RTL
  ✓ header brand follows RTL visual order
  ✓ bottom navigation follows RTL visual order
  ✓ category grid follows RTL visual order
  ✓ continue card follows RTL visual order
  ✓ practice card follows RTL visual order
  ✓ forward actions consistently use left-pointing RTL chevrons

3. Every category and game opens without errors
  ✓ all categories render tiles
  ✓ all 16 games open and stay open

4. Games can actually be completed
  ✓ quiz completed
  ✓ memory completed
  ✓ focus completed
  ✓ cloze advanced past the spoken phrase
  ✓ bubble popped

5. Storage, persistence and backup
  ✓ IndexedDB is the active backend
  ✓ progress, custom words and recordings survive reload
  ✓ export contains progress, custom words and recordings
  ✓ full wipe then restore recovers everything
  ✓ junk import is rejected safely

6. PWA: manifest, icons, service worker, offline
  ✓ manifest valid with 192/512/maskable icons
  ✓ all icon and splash files resolve
  ✓ service worker active
  ✓ precached 17 files
  ✓ start gate unlocks audio

============================================================
ALL CHECKS PASSED
```

**Result: 26/26 checks PASS.** No pre-existing failures.

### Baseline summary for Phase 12

There are **zero known pre-existing failures**. This means Phase 12 has a clean bar: any test that fails after the redesign is a genuine regression, not a pre-existing issue being surfaced. Notably `test_suite.py` reports "13 categories" (its layout check counts category tiles including any locked/example states) and "16 games open" — both are useful cross-checks against the "11 categories from `allCats()`" and "3 games on Home" counts elsewhere in this document; the suite exercises the full games menu (16), not just the 3 shown on Home.

