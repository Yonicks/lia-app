/**
 * Right-sizes the child navigation icons.
 *
 * The source art arrives at 1254x1254 (~1MB each). The bottom bar paints them
 * at 30px, 33px on a tablet — so shipping the masters means ~3.2MB of always-
 * loaded PNG to fill 90px of screen. This rewrites each one at NAV_PX, which
 * is still 4x the largest painted size and therefore crisp on a 3x screen.
 *
 *   node tools/resize_nav_icons.mjs
 *
 * Re-running is safe: an icon already at or below NAV_PX is left alone. The
 * masters stay in git history if the art ever needs regenerating larger.
 *
 * Chromium does the resampling, so this needs no image library beyond the
 * Playwright browser the visual checks already use. CHROMIUM_PATH overrides
 * the browser binary when the pinned revision is not the one installed.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAV_PX = 132;
const ICONS = ['talki-nav-home.png', 'talki-nav-games.png', 'talki-nav-rewards.png'];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();
await page.goto('about:blank');

for (const name of ICONS) {
  const file = path.join(ROOT, 'assets/v2/nav', name);
  const before = statSync(file).size;
  const dataUri = 'data:image/png;base64,' + readFileSync(file).toString('base64');

  const out = await page.evaluate(async ({ dataUri, px }) => {
    const img = new Image();
    img.src = dataUri;
    await img.decode();
    if (img.naturalWidth <= px) return null; // already small enough

    const c = document.createElement('canvas');
    c.width = px;
    c.height = Math.round((img.naturalHeight / img.naturalWidth) * px);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { w: c.width, h: c.height, png: c.toDataURL('image/png').split(',')[1] };
  }, { dataUri, px: NAV_PX });

  if (!out) {
    console.log(`${name} already <= ${NAV_PX}px, left alone`);
    continue;
  }
  writeFileSync(file, Buffer.from(out.png, 'base64'));
  const after = statSync(file).size;
  console.log(`${name}  ${out.w}x${out.h}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}

await browser.close();
