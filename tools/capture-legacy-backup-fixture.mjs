/**
 * Drives the RUNNING LEGACY APP with Playwright to produce
 * docs/migration/fixtures/legacy-backup-v1.json — the differential-testing
 * fixture Phase 3's backup-import tests import against.
 *
 * A hand-written fixture only tests the author's belief about backup
 * version 1's shape. A generated one tests the format Talki actually
 * produces, which is the entire point of this phase (phase-03-plan.md, "The
 * backup fixture is generated from the real legacy app, not written by
 * hand"). So wherever practical this script drives real UI: real category
 * tile taps for progress, a real file upload for the custom word's photo,
 * and the real exportBackup() button wired to a real captured download.
 *
 * Two exceptions, both precedented by tests/test_suite.py's test_storage
 * (the phase prompt explicitly says to follow this pattern):
 *   - The recording is injected directly via `sSet(K.rec(...), dataURL)`
 *     rather than actually recording audio through getUserMedia/
 *     MediaRecorder, which headless Chromium cannot do without a fake
 *     media device and device permissions that add fragility for zero
 *     format benefit — the export code path that turns a stored recording
 *     into `data.lia:rec:*` in the payload is identical either way.
 *   - Stats are seeded by calling the app's own real `markSeen()` function
 *     (not by fabricating the {seen,wrong} shape ourselves) rather than by
 *     playing a game to natural completion, so wrong-answer counts are
 *     deterministic and fast to produce.
 *
 * Usage:  node tools/capture-legacy-backup-fixture.mjs [--base=http://localhost:8000]
 *                                                       [--out=<path>]
 * Requires the legacy app to be served already (npm run dev /
 * node tools/dev-server.js).
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const BASE = args.base || process.env.BASE_URL || 'http://localhost:8000';
const OUT = path.resolve(REPO_ROOT, args.out || 'docs/migration/fixtures/legacy-backup-v1.json');

/* A 1x1 red JPEG, valid enough for the browser's <img> decode step inside
 * handlePhoto()'s canvas resize (index.html 3965-3980) to succeed, so the
 * custom word's `photo` field in the export is a real product of that code
 * path, not a fabricated data URL. */
const SEED_PHOTO_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

async function main() {
  await mkdir(path.dirname(OUT), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    acceptDownloads: true,
    locale: 'he-IL',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  const gate = await page.$('#gateBtn');
  if (gate) {
    await gate.click();
    await page.waitForTimeout(300);
  }

  // ---- 1. Progress across at least two categories, via real taps ----
  // JS-click (mirroring tests/test_suite.py's `jc` helper) rather than
  // Playwright's native click: it survives animated/covered elements the
  // same way the existing legacy suite already relies on.
  const jsClick = (sel, i = 0) =>
    page.evaluate(
      ([s, idx]) => {
        const el = [...document.querySelectorAll(s)];
        if (!el[idx]) return false;
        el[idx].click();
        return true;
      },
      [sel, i],
    );

  await jsClick('[data-cat="animals"]');
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    await jsClick('.tile', i);
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => {
    view = 'home';
    render();
  });
  await page.waitForTimeout(200);

  await jsClick('[data-cat="food"]');
  await page.waitForTimeout(300);
  for (let i = 0; i < 3; i++) {
    await jsClick('.tile', i);
    await page.waitForTimeout(300);
  }
  const learnedCount = await page.evaluate(() => learned.size);
  if (learnedCount < 6) {
    throw new Error(`expected at least 6 words learned across two categories, got ${learnedCount}`);
  }

  // ---- 2. Stats with non-zero seen AND wrong, via the real markSeen() ----
  await page.evaluate(() => {
    markSeen('animals', CATEGORIES.animals.items[0].word, false); // seen++, correct
    markSeen('animals', CATEGORIES.animals.items[0].word, true); // seen++, wrong++
    markSeen('food', CATEGORIES.food.items[0].word, true); // seen++, wrong++
  });
  const statsSnapshot = await page.evaluate(() => JSON.parse(JSON.stringify(stats)));
  const hasNonZeroWrong = Object.values(statsSnapshot).some((s) => s.wrong > 0);
  const hasNonZeroSeen = Object.values(statsSnapshot).some((s) => s.seen > 0);
  if (!hasNonZeroWrong || !hasNonZeroSeen) {
    throw new Error(`expected seeded stats with non-zero seen and wrong, got ${JSON.stringify(statsSnapshot)}`);
  }

  // ---- 3. At least two settings away from defaults, including puzzleLevel ----
  await page.evaluate(async () => {
    settings.rate = 0.6; // default 0.85
    settings.niqqud = false; // default true
    settings.puzzleLevel = 3; // absent from the defaults literal at all
    await saveSettings();
  });

  // ---- 4. A custom word WITH a photo, via the real parent-words form ----
  await page.evaluate(() => {
    unlocked = true;
    view = 'parent';
    parentTab = 'words';
    render();
  });
  await page.waitForTimeout(400);
  await page.fill('#cwWord', 'סַבְתָּא רוּתִי');
  await page.fill('#cwEmoji', '👵');
  await page.setInputFiles('#cwPhoto', {
    name: 'grandma.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from(SEED_PHOTO_JPEG_BASE64, 'base64'),
  });
  await page.waitForTimeout(400); // canvas resize in handlePhoto() is async
  await page.click('#cwAdd');
  await page.waitForTimeout(400);
  const customCount = await page.evaluate(() => custom.length);
  const customHasPhoto = await page.evaluate(() => !!(custom[0] && custom[0].photo));
  if (customCount !== 1 || !customHasPhoto) {
    throw new Error(`expected exactly one custom word with a photo, got count=${customCount} hasPhoto=${customHasPhoto}`);
  }

  // ---- 5. A recording for at least one word (see file header for why this
  //         one step is injected rather than actually recorded) ----
  await page.evaluate(async () => {
    const k = key('animals', CATEGORIES.animals.items[0].word);
    const dataUrl =
      'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggI1TbuMU6uEO1O7a1OsggU3TbuMU6uEP1SGZUC7g==';
    const ok = await sSet(K.rec(k), dataUrl);
    recordings[k] = dataUrl;
    if (!ok) throw new Error('sSet(K.rec(...)) reported failure');
  });
  const recKeys = await page.evaluate(() => Object.keys(recordings).filter((k) => recordings[k]));
  if (recKeys.length < 1) {
    throw new Error('expected at least one recording to be seeded');
  }

  // ---- 6. Trigger the real exportBackup() and capture the real download ----
  await page.evaluate(() => {
    view = 'parent';
    parentTab = 'settings';
    render();
  });
  await page.waitForTimeout(400);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#exportBtn')]);
  const downloadPath = await download.path();
  const { readFile } = await import('node:fs/promises');
  const raw = await readFile(downloadPath, 'utf8');
  const payload = JSON.parse(raw);

  // ---- sanity checks before writing, so a broken capture fails loudly
  //      instead of silently committing a bad fixture ----
  if (payload.app !== 'talki') throw new Error(`expected app 'talki', got ${payload.app}`);
  if (payload.version !== 1) throw new Error(`expected version 1, got ${payload.version}`);
  if (!payload.data || typeof payload.data !== 'object') throw new Error('payload has no data');
  const dataKeys = Object.keys(payload.data);
  if (!dataKeys.some((k) => k.startsWith('lia:rec:'))) throw new Error('export is missing the seeded recording');
  if (!dataKeys.includes('lia:custom:index')) throw new Error('export is missing the custom word index');
  if (!dataKeys.includes('lia:progress')) throw new Error('export is missing progress');
  if (!dataKeys.includes('lia:stats')) throw new Error('export is missing stats');
  if (!dataKeys.includes('lia:settings')) throw new Error('export is missing settings');

  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  if (pageErrors.length) {
    console.error(`\n${pageErrors.length} page error(s) during capture:`);
    for (const e of pageErrors) console.error('  -', e);
  }

  console.log(`wrote ${path.relative(REPO_ROOT, OUT)} (${raw.length} bytes)`);
  console.log(`  app=${payload.app} version=${payload.version} word_count=${payload.word_count}`);
  console.log(`  data keys: ${dataKeys.length} (${dataKeys.join(', ')})`);

  await context.close();
  await browser.close();

  if (pageErrors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
