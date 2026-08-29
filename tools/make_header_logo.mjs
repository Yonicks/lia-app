/**
 * Builds the compact header mark from the full brand lockup.
 *
 * `assets/v2/brand/talki-header-logo.png` is the full lockup: the "Talki"
 * wordmark, the Hebrew tagline underneath it, and the star mascot to its
 * inline-end. The compact child header shows the wordmark and the star only —
 * and at ~148px wide, so shipping the 1917x639 / ~900KB original for it is
 * pure waste.
 *
 * This erases the tagline band (which sits under the wordmark, clear of the
 * star), trims to what is left, and writes a header-sized PNG.
 *
 *   node tools/make_header_logo.mjs
 *
 * Chromium does the pixel work, so this needs no image library beyond the
 * Playwright browser the visual checks already use.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets/v2/brand/talki-header-logo.png');
const OUT = path.join(ROOT, 'assets/v2/brand/talki-logo-mark.png');
const TARGET_W = 440; // ~3x the 148px the header paints, so it stays crisp on 3x screens

const dataUri = 'data:image/png;base64,' + readFileSync(SRC).toString('base64');

/* CI images sometimes ship a Chromium build that does not match the pinned
   Playwright revision; point at it with CHROMIUM_PATH instead of downloading. */
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();
await page.goto('about:blank');

const result = await page.evaluate(async ({ dataUri, targetW }) => {
  const img = new Image();
  img.src = dataUri;
  await img.decode();

  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, W, H).data;
  const alpha = (x, y) => px[(y * W + x) * 4 + 3];

  /* The star is the tall element on the inline-end side. Find where it starts
     by walking columns from the right and stopping at the first fully empty
     column — that gap separates the star from the wordmark. */
  const colFilled = x => {
    for (let y = 0; y < H; y++) if (alpha(x, y) > 24) return true;
    return false;
  };
  let starLeft = W - 1;
  for (let x = W - 1, sawStar = false; x >= 0; x--) {
    if (colFilled(x)) { sawStar = true; continue; }
    if (sawStar) { starLeft = x; break; }
  }

  /* Inside the wordmark half only, find the empty row that separates the
     wordmark from the tagline underneath it, scanning up from the bottom. */
  const rowFilled = y => {
    for (let x = 0; x < starLeft; x++) if (alpha(x, y) > 24) return true;
    return false;
  };
  let taglineTop = H;
  for (let y = H - 1, sawTagline = false; y >= 0; y--) {
    if (rowFilled(y)) { sawTagline = true; continue; }
    if (sawTagline) { taglineTop = y; break; }
  }

  // erase the tagline band, leaving the star untouched
  ctx.clearRect(0, taglineTop, starLeft, H - taglineTop);

  // trim to what remains
  const kept = ctx.getImageData(0, 0, W, H).data;
  const a2 = (x, y) => kept[(y * W + x) * 4 + 3];
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (a2(x, y) <= 24) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const cropW = x1 - x0 + 1, cropH = y1 - y0 + 1;

  const outW = targetW;
  const outH = Math.round((cropH / cropW) * outW);
  const out = document.createElement('canvas');
  out.width = outW; out.height = outH;
  const octx = out.getContext('2d');
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(c, x0, y0, cropW, cropH, 0, 0, outW, outH);

  return {
    source: { W, H }, starLeft, taglineTop,
    crop: { x0, y0, cropW, cropH },
    out: { outW, outH },
    png: out.toDataURL('image/png').split(',')[1]
  };
}, { dataUri, targetW: TARGET_W });

await browser.close();

writeFileSync(OUT, Buffer.from(result.png, 'base64'));
console.log(`source      ${result.source.W}x${result.source.H}`);
console.log(`star starts at x=${result.starLeft}, tagline band from y=${result.taglineTop}`);
console.log(`cropped     ${result.crop.cropW}x${result.crop.cropH} at (${result.crop.x0},${result.crop.y0})`);
console.log(`wrote       ${path.relative(ROOT, OUT)} ${result.out.outW}x${result.out.outH}`);
