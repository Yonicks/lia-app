/**
 * Right-sizes the Home hero art.
 *
 * The masters arrive from the image tool at 1916x821 / 1448x1086 / 1254x1254
 * and 0.8-1.7MB each. The hero paints at most 766 CSS px wide, the mascot at
 * 252 and the category tile at 58 — so the masters carry 5-20x more pixels
 * than any screen can show. Shipping them unchanged would add ~13MB, which is
 * the opposite of what tools/resize_nav_icons.mjs and tools/make_header_logo.mjs
 * exist to prevent.
 *
 * Unlike resize_nav_icons.mjs this does NOT rewrite in place: it reads the
 * masters from a staging directory and writes only the small outputs, so the
 * multi-megabyte originals never enter git history. Stage the files, run this,
 * then delete them.
 *
 *   node tools/make_home_hero_art.mjs            # reads assets/v2
 *   SRC_DIR=~/Downloads node tools/make_home_hero_art.mjs
 *
 * Outputs are WebP. A canvas cannot palette-quantize the way tools/make_art.py
 * does with Pillow, so a 640px RGBA PNG out of toDataURL lands at 250-400KB
 * where the WebP lands near 45KB. Every target (Chrome 32+, iOS 14+, Android
 * WebView 4.4+) reads WebP, tools/prepare_www.js copies assets/ wholesale with
 * no extension filter, and sw.js precaches only the shell.
 *
 * Chromium does the resampling and the encoding, so this needs no image
 * library beyond the Playwright browser the visual checks already use.
 * CHROMIUM_PATH overrides the browser binary.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = process.env.SRC_DIR
  ? path.resolve(process.env.SRC_DIR.replace(/^~/, process.env.HOME))
  : path.join(ROOT, 'assets/v2');

const SCENE = 'ChatGPT Image Aug 31, 2026, 11_53_02 PM';
const ART   = 'ChatGPT Image Aug 31, 2026, 11_51_50 PM';

/* The cutout files are numbered in REVERSE subject order — every one was
   opened and confirmed visually before this table was written. */
const CUTOUTS = [
  ['(1)', 'animals'], ['(2)', 'food'],     ['(3)', 'colors'],
  ['(4)', 'home'],    ['(5)', 'family'],   ['(6)', 'actions'],
  ['(7)', 'body'],    ['(8)', 'numbers'],  ['(9)', 'emotions'],
  ['(10)', 'outside']
];

const JOBS = [
  /* Scenes are starless: the mascot is a separate layer, so these only ever
     need to survive a `cover` crop. No alpha trim — the frame IS the art. */
  { src: `${SCENE} (1).png`, out: 'assets/v2/home/talki-hero-scene-wide.webp',    w: 1536, q: 0.80, trim: false },
  { src: `${SCENE} (3).png`, out: 'assets/v2/home/talki-hero-scene-compact.webp', w: 1152, q: 0.80, trim: false },
  { src: `${ART} (11).png`,  out: 'assets/v2/home/talki-hero-star.webp',          w: 640,  q: 0.86, trim: true  },
  ...CUTOUTS.map(([n, id]) => ({
    src: `${ART} ${n}.png`,
    out: `assets/v2/categories/talki-cat-art-${id}.webp`,
    w: 256, q: 0.86, trim: true
  }))
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();
await page.goto('about:blank');

let before = 0, after = 0;
for (const job of JOBS) {
  const src = path.join(SRC_DIR, job.src);
  const dest = path.join(ROOT, job.out);
  mkdirSync(path.dirname(dest), { recursive: true });

  const srcBytes = statSync(src).size;
  const dataUri = 'data:image/png;base64,' + readFileSync(src).toString('base64');

  const out = await page.evaluate(async ({ dataUri, w, q, trim }) => {
    const img = new Image();
    img.src = dataUri;
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;

    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    /* Trim transparent padding so the CSS width maps to the VISIBLE subject.
       The generator left wildly different margins per cutout (63%-94% of the
       canvas), so untrimmed the tiles would not look like one set. */
    let x0 = 0, y0 = 0, cw = W, ch = H;
    if (trim) {
      const px = ctx.getImageData(0, 0, W, H).data;
      let minX = W, minY = H, maxX = -1, maxY = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (px[(y * W + x) * 4 + 3] <= 8) continue;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (maxX >= minX) { x0 = minX; y0 = minY; cw = maxX - minX + 1; ch = maxY - minY + 1; }
    }

    const outW = Math.min(w, cw);
    const outH = Math.round((ch / cw) * outW);
    const o = document.createElement('canvas');
    o.width = outW; o.height = outH;
    const octx = o.getContext('2d');
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(c, x0, y0, cw, ch, 0, 0, outW, outH);
    return { w: outW, h: outH, data: o.toDataURL('image/webp', q).split(',')[1] };
  }, { dataUri, w: job.w, q: job.q, trim: job.trim });

  writeFileSync(dest, Buffer.from(out.data, 'base64'));
  const destBytes = statSync(dest).size;
  before += srcBytes; after += destBytes;
  console.log(
    `${path.relative(ROOT, dest).padEnd(48)} ${String(out.w + 'x' + out.h).padEnd(10)}` +
    ` ${(srcBytes / 1024).toFixed(0).padStart(5)}KB -> ${(destBytes / 1024).toFixed(0).padStart(4)}KB`
  );
}

await browser.close();
console.log(`\n${JOBS.length} files  ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024).toFixed(0)}KB`);
