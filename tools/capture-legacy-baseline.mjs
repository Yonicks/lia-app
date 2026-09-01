/**
 * Capture the legacy app's visual baseline: every view at every viewport in the
 * migration's Playwright matrix. The React Native port is graded against these
 * images, so the run has to be repeatable — two runs on an unchanged tree must
 * produce byte-identical files.
 *
 * Three things are pinned to get there:
 *   - Math.random is replaced with a seeded generator, re-seeded to the same
 *     value before every single view, so a screenshot never depends on which
 *     views were captured before it.
 *   - Animations, transitions and caret blink are disabled via stylesheet.
 *   - Progress is seeded to a fixed word set, so stars and progress bars are
 *     the same on a cold profile as on a used one.
 *
 * Views are entered by assigning the app's own state variables and calling
 * render(), the technique tools/sweep.js already uses. Several views are
 * unreachable through the UI without playing a game to completion, and this is
 * a visual reference rather than an interaction test.
 *
 * Usage:  node tools/capture-legacy-baseline.mjs [--base=http://localhost:8000]
 *                                                [--out=<dir>] [--only=<name>]
 * Requires the legacy app to be served already (npm run dev).
 */
import { chromium } from 'playwright';
import { mkdir, rm, readdir } from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const BASE = args.base || process.env.BASE_URL || 'http://localhost:8000';
const OUT = args.out || 'docs/migration/screenshots/legacy-baseline';
const ONLY = args.only || null;

/* Matches docs/migration/validation.md. The first six mirror the legacy Python
   suites; the last four are landscape, where the native games will live. */
const VIEWPORTS = [
  { name: 'iphone-se1', width: 320, height: 568 },
  { name: 'android-compact', width: 360, height: 800 },
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'iphone-pro-max', width: 430, height: 932 },
  { name: 'ipad-mini', width: 768, height: 1024 },
  { name: 'ipad-air', width: 834, height: 1112 },
  { name: 'landscape-844', width: 844, height: 390 },
  { name: 'landscape-932', width: 932, height: 430 },
  { name: 'tablet-4-3', width: 1024, height: 768 },
  { name: 'tablet-16-10', width: 1280, height: 800 },
];

/* All 23 entries of the views map in render() (index.html 2085-2093), plus
   parent-locked for the gate and category-animals for a category showing
   partial progress. 25 names x 10 viewports = 250 files. */
const VIEWS = [
  ['home', "view='home';"],
  ['category', "activeCat='food';view='category';"],
  ['category-animals', "activeCat='animals';view='category';"],
  ['cards', "activeCat='animals';view='cards';cardIdx=0;"],
  ['games', "view='games';"],
  ['practice', "view='practice';"],
  ['stickers', "view='stickers';"],
  ['quiz', "activeCat='animals';view='quiz';"],
  ['memory', "activeCat='food';view='memory';"],
  ['missing', "activeCat='home';view='missing';"],
  ['match', "activeCat='family';view='match';"],
  ['speech', "activeCat='animals';view='speech';"],
  ['bubbles', "activeCat='outside';view='bubbles';"],
  ['sounds', "activeCat='animals';view='sounds';"],
  ['count', "activeCat='numbers';view='count';"],
  ['sort', "activeCat='colors';view='sort';"],
  ['puzzle', "activeCat='animals';view='puzzle';"],
  ['focus', "activeCat='animals';view='focus';"],
  ['cloze', "activeCat='animals';view='cloze';"],
  ['temptation', "activeCat='animals';view='temptation';"],
  ['receptive', "activeCat='animals';view='receptive';"],
  ['pairs', "activeCat='animals';view='pairs';"],
  ['combine', "activeCat='animals';view='combine';"],
  // The gate re-locks on leaving the parent view, so locked is the honest
  // default and unlocked has to be forced.
  ['parent-locked', "unlocked=false;lockAnswer=null;lockInput='';view='parent';"],
  ['parent', "unlocked=true;view='parent';"],
];

const SEED = 20260901;

/* Chromium rasterises images on a threaded, progressively-refined pipeline, so
   two runs can land on slightly different anti-aliasing for the same pixels.
   Left alone this produced sub-0.2%-of-pixels diffs on the art-heavy views.
   These flags pin rasterisation to a single deterministic path. */
const CHROMIUM_DETERMINISM_ARGS = [
  '--disable-checker-imaging',
  '--disable-partial-raster',
  '--disable-skia-runtime-opts',
  '--disable-threaded-animation',
  '--disable-threaded-scrolling',
  '--disable-image-animation-resync',
  '--disable-lcd-text',
  '--force-color-profile=srgb',
  '--force-device-scale-factor=1',
  '--run-all-compositor-stages-before-draw',
  '--disable-new-content-rendering-timeout',
  '--disable-gpu',
  '--in-process-gpu',
];

/* Installed before any app code runs. A seeded LCG keeps game setup, which
   shuffles and samples words, identical between runs. */
const initScript = seed => `
  (() => {
    let s = ${seed};
    const next = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    Math.random = next;
    window.__reseed = n => { s = n; };
  })();
`;

/* A fixed delay is not enough: image-heavy views (the home hero, the 24
   stickers, a 26-tile category) sometimes paint before their art has decoded,
   which showed up as 9 of 250 files differing between runs. Wait for fonts and
   every image to settle, then let two frames pass so layout is committed. */
async function waitForStablePaint(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => (
      img.complete ? null : new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      })
    )));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
  /* #toast is a transient overlay that can cover the bottom nav. Headless
     Chromium ships no Hebrew speech voice, so the app's "this browser cannot
     read Hebrew" warning fires on the speech-bearing views and raced the
     capture. It is not part of any view's layout, so keep it out of the
     reference set. See docs/migration/00-current-state.md section 12. */
  #toast { display: none !important; }
`;

/* 30 words: enough for three stars (STAR_STEP is 10) and a partly filled
   animals category, so progress chrome is exercised rather than empty. */
const SEED_PROGRESS = `
  (() => {
    const take = (cat, n) => CATEGORIES[cat].items.slice(0, n).map(i => cat + ':' + i.word);
    learned = new Set([...take('animals', 12), ...take('food', 10), ...take('colors', 8)]);
  })();
`;

async function main() {
  const outDir = path.resolve(OUT);
  await mkdir(outDir, { recursive: true });
  // Remove stale files so a renamed view cannot leave an orphan behind. Skipped
  // for --only, which is a debugging aid and must not wipe the full set.
  if (!ONLY) {
    for (const f of await readdir(outDir).catch(() => [])) {
      if (f.endsWith('.png')) await rm(path.join(outDir, f));
    }
  }

  const views = ONLY ? VIEWS.filter(([n]) => n === ONLY) : VIEWS;
  if (!views.length) {
    console.error(`No view named "${ONLY}". Known: ${VIEWS.map(v => v[0]).join(', ')}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ args: CHROMIUM_DETERMINISM_ARGS });
  const problems = [];
  let written = 0;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.width < 900,
      hasTouch: vp.width < 900,
      locale: 'he-IL',
      timezoneId: 'Asia/Jerusalem',
      reducedMotion: 'reduce',
    });
    await context.addInitScript(initScript(SEED));
    const page = await context.newPage();
    page.on('pageerror', e => problems.push(`${vp.name}/<load>: ${e}`));

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: FREEZE_CSS });

    // Clear the opening gate so the app is on the home route.
    const gate = await page.$('#gateBtn');
    if (gate) { await gate.click(); await page.waitForTimeout(250); }
    await waitForStablePaint(page);

    await page.evaluate(SEED_PROGRESS);

    for (const [name, setup] of views) {
      const before = problems.length;
      try {
        await page.evaluate(`
          window.__reseed(${SEED});
          window.__err = null;
          try { game = null; ${setup} render(); }
          catch (e) { window.__err = String(e); }
        `);
        await page.waitForTimeout(200);
        const err = await page.evaluate(() => window.__err || null);
        if (err) problems.push(`${vp.name}/${name}: render threw: ${err}`);
        await waitForStablePaint(page);
      } catch (e) {
        problems.push(`${vp.name}/${name}: evaluate failed: ${e.message}`);
      }
      await page.screenshot({ path: path.join(outDir, `${vp.name}-${name}.png`) });
      written++;
      if (problems.length > before) process.stdout.write('!');
      else process.stdout.write('.');
    }
    process.stdout.write(` ${vp.name}\n`);
    await context.close();
  }

  await browser.close();

  console.log(`\n${written} screenshots written to ${OUT}`);
  if (problems.length) {
    console.log(`\n${problems.length} problems:`);
    for (const p of problems) console.log('  -', p);
    process.exit(1);
  }
  console.log('No render errors.');
}

main().catch(e => { console.error(e); process.exit(1); });
