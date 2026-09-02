import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { captureMatrix } from './_helpers';

/** Frame timestamps the phase prompt requires captured at every viewport
 *  (phase-06 work item 8), plus the two extra "action" checkpoints (tap and
 *  the final settle) exercised by the other tests below. */
const FRAME_TIMESTAMPS_MS = [0, 300, 700, 1000, 1400, 1800] as const;

/** Wall-clock tolerance for `setTimeout`-scheduled animation steps under a
 *  loaded CI runner. The timeline itself (`timeline.ts`) is exact; this is
 *  slack for the browser event loop and Playwright's own IPC round-trips,
 *  not slack in the product's timing. */
const TOLERANCE_MS = 500;

/**
 * Loads the real app root with the intro suppressed (`?intro=0`, exactly
 * legacy's own bypass — index.html 4171-4177), waits for the custom
 * Assistant/Rubik fonts to finish loading, then client-navigates to the
 * isolated `/intro` route via `e2eRouterBridge.ts`.
 *
 * The font wait matters more here than anywhere else in the suite:
 * Playwright's `page.screenshot()` internally awaits `document.fonts.ready`
 * on its first call per page, which can take upwards of two seconds the
 * very first time a custom `@font-face` is fetched+parsed — long enough to
 * blow straight past this sequence's entire 1800ms runtime before the
 * first "frame" is even captured. Warming the font cache on `/` (a page
 * with no time-sensitive content) before entering the timed route removes
 * that variable from every timestamp assertion below.
 *
 * Returns the reference start time `t0`, sampled right after `intro-root`
 * first appears in the DOM — the earliest point at which layer opacities
 * are guaranteed to be responding to the timeline's `at: 0` step.
 */
async function gotoIntro(page: Page): Promise<number> {
  await page.goto('/?intro=0');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() => {
    (window as unknown as { __talkiRouterE2E: { push: (path: string) => void } }).__talkiRouterE2E.push('/intro');
  });
  await page.waitForSelector(`[data-testid="${testIds.intro.root}"]`);
  return Date.now();
}

/** Waits until `targetMs` has elapsed since `t0`, or returns immediately if
 *  that point has already passed. */
async function waitUntil(page: Page, t0: number, targetMs: number): Promise<void> {
  const remaining = targetMs - (Date.now() - t0);
  if (remaining > 0) await page.waitForTimeout(remaining);
}

interface LayerRect {
  testId: string;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Reads every `intro-layer-*` element's computed opacity and bounding box
 *  in one pass, so a caller can assert "every VISIBLE layer's box lies
 *  fully inside the viewport" (phase-06 work item 8) without a round trip
 *  per layer. */
async function readLayerRects(page: Page): Promise<LayerRect[]> {
  return page.evaluate(() => {
    const out: LayerRect[] = [];
    document.querySelectorAll<HTMLElement>('[data-testid^="intro-layer-"]').forEach((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out.push({
        testId: el.getAttribute('data-testid') || '',
        opacity: parseFloat(cs.opacity || '1'),
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      });
    });
    return out;
  });
}

/** Sub-pixel slack for a scale-up transform (the 1200ms star glow overshoots
 *  to 1.08x around its own centre) rounding a fraction of a CSS pixel past
 *  its box — immaterial to a human eye, not a real clip. */
const SUBPIXEL_SLACK = 2;

function assertNoClipping(rects: LayerRect[], viewportWidth: number, viewportHeight: number): void {
  for (const r of rects) {
    if (r.opacity <= 0.01 || r.width < 1 || r.height < 1) continue; // not visible — legacy TOUCH_SIZES-style skip
    expect(r.x, `${r.testId} clips left`).toBeGreaterThanOrEqual(-SUBPIXEL_SLACK);
    expect(r.y, `${r.testId} clips top`).toBeGreaterThanOrEqual(-SUBPIXEL_SLACK);
    expect(r.x + r.width, `${r.testId} clips right`).toBeLessThanOrEqual(viewportWidth + SUBPIXEL_SLACK);
    expect(r.y + r.height, `${r.testId} clips bottom`).toBeLessThanOrEqual(viewportHeight + SUBPIXEL_SLACK);
  }
}

test.describe('Phase 6 opening sequence', () => {
  test('plays from real assets with no clipping or console errors at every captured frame, then hands off', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    const t0 = await gotoIntro(page);
    const viewport = page.viewportSize()!;

    // First frame background must match the native splash colour
    // (#FFF6E4, capacitor.config.ts) — no colour flash on hand-off.
    const bg = await page.getByTestId(testIds.intro.root).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(255, 246, 228)');

    for (const ms of FRAME_TIMESTAMPS_MS) {
      await waitUntil(page, t0, ms);
      const rects = await readLayerRects(page);
      assertNoClipping(rects, viewport.width, viewport.height);
      await captureMatrix(page, '06', `intro-${ms}`);
    }

    // "the sequence completes and the next route is interactive by 1800 ms
    // plus a tolerance"
    await waitUntil(page, t0, 1800 + TOLERANCE_MS);
    await expect(page.getByTestId('intro-next-route-placeholder')).toBeVisible();

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);
  });

  test('captures the final settled frame baseline', async ({ page }) => {
    // The un-reduced timeline never holds still at any single instant — the
    // background's 1500-1800ms exit fade is still in flight at every
    // millisecond of that window, so any real timestamp there is
    // definitionally unstable for a pixel-diffed screenshot. Reduced
    // motion's "jump to settled, then hold" state (verified above) is the
    // one genuinely static "final frame" this component ever produces, and
    // is exactly the frame this baseline is meant to catch a regression in.
    // A plain, single `page.screenshot()` + `toMatchSnapshot`, not
    // `toHaveScreenshot`: the latter polls for two consecutive
    // pixel-identical captures before accepting one, and the reduced-motion
    // hold this frame lives in is itself only 400ms long (by design — "a
    // parent opening the app for the twentieth time must not be made to
    // sit through something charming") — not always enough room for that
    // poll to converge before `finish()` unmounts the component out from
    // under it.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const t0 = await gotoIntro(page);
    await waitUntil(page, t0, 150);
    const shot = await page.getByTestId(testIds.intro.root).screenshot({ animations: 'disabled' });
    expect(shot).toMatchSnapshot('intro-final-frame.png');
  });

  test('tapping anywhere skips immediately to the end state', async ({ page }) => {
    const t0 = await gotoIntro(page);
    await waitUntil(page, t0, 400);
    await page.getByTestId(testIds.intro.skipLayer).click({ position: { x: 5, y: 5 } });
    // FAST_SKIP_MS (150ms) fade-out, not the full remaining ~1400ms of the
    // untouched timeline — proves the tap actually short-circuited it.
    await expect(page.getByTestId('intro-next-route-placeholder')).toBeVisible({ timeout: 800 });
    expect(Date.now() - t0).toBeLessThan(1200);
  });

  test('?intro=0 bypasses the sequence entirely on the real app root', async ({ page }) => {
    await page.goto('/?intro=0');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    await expect(page.getByTestId(testIds.intro.root)).toHaveCount(0);
  });

  test('reduced motion shows the final frame immediately and still hands off', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const t0 = await gotoIntro(page);

    // "show the final frame and move on" — layers should already read as
    // fully settled well before the un-reduced timeline would even reach
    // its first step's midpoint.
    await page.waitForTimeout(150);
    const rects = await readLayerRects(page);
    const visibleLayers = rects.filter((r) => r.opacity > 0.01);
    expect(visibleLayers.length).toBeGreaterThan(0);
    for (const r of visibleLayers) {
      expect(r.opacity, `${r.testId} not settled under reduced motion`).toBeGreaterThan(0.9);
    }

    await expect(page.getByTestId('intro-next-route-placeholder')).toBeVisible({ timeout: 800 });
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});
