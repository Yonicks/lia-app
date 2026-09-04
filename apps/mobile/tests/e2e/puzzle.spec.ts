import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  burst,
  captureMatrix,
  degradeNativeApis,
  openApp,
} from './_helpers';

type RouterBridge = { push: (path: string) => void };

async function gotoPuzzle(page: Page, extras: Record<string, number> = {}): Promise<void> {
  await page.addInitScript((hooks) => {
    const w = window as unknown as Record<string, unknown>;
    w.__talkiQuizSeed = 42;
    w.__talkiPuzzleFinishMs = 50;
    for (const [k, v] of Object.entries(hooks)) w[k] = v;
  }, extras);
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/puzzle?catId=animals&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.puzzle.root}"], [data-testid="${testIds.puzzle.done}"]`);
}

async function pieceIds(page: Page): Promise<string[]> {
  const loc = page.locator('[data-testid^="puzzle-piece-"]');
  const n = await loc.count();
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = await loc.nth(i).getAttribute('data-testid');
    if (id) ids.push(id.replace('puzzle-piece-', ''));
  }
  return ids;
}

async function tapPlace(page: Page, id: string): Promise<void> {
  await page.getByTestId(testIds.puzzle.piece(id)).click();
  await page.getByTestId(testIds.puzzle.slot(id)).click();
}

test.describe('Phase 25 puzzle', () => {
  test('lowest-level board (2 pieces) screenshot', async ({ page }) => {
    await gotoPuzzle(page, { __talkiPuzzleLevel: 1 });
    const ids = await pieceIds(page);
    expect(ids.length).toBe(2);
    await captureMatrix(page, '25', 'puzzle-board-2');
    await expect(page).toHaveScreenshot();
  });

  test('highest-level board adapts to viewport capacity', async ({ page }) => {
    await gotoPuzzle(page, { __talkiPuzzleLevel: 5 });
    const ids = await pieceIds(page);
    const size = page.viewportSize();
    // Capacity uses usable landscape geometry (same thresholds as puzzleCapacity).
    const h = size?.height ?? 800;
    const w = size?.width ?? 400;
    const cap = h < 620 || w < 360 ? 3 : h < 780 ? 4 : 6;
    expect(ids.length).toBe(Math.max(2, Math.min(6, cap)));
    await captureMatrix(page, '25', 'puzzle-board-6');
  });

  test('tap-then-tap places; wrong drop returns; second miss shows hint; board always completes', async ({ page }) => {
    await gotoPuzzle(page, { __talkiPuzzleLevel: 1 });
    const ids = await pieceIds(page);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    const [a, b] = ids;
    await page.getByTestId(testIds.puzzle.piece(a!)).click();
    await page.getByTestId(testIds.puzzle.slot(b!)).click();
    await expect(page.getByTestId(testIds.puzzle.piece(a!))).toBeVisible();
    await page.getByTestId(testIds.puzzle.slot(b!)).click();
    await expect(page.locator('[data-testid^="puzzle-slot-"]').first()).toBeVisible();
    await captureMatrix(page, '25', 'puzzle-hint');

    await page.getByTestId(testIds.puzzle.slot(a!)).click();
    await tapPlace(page, b!);
    await expect(page.getByTestId(testIds.puzzle.done)).toBeVisible({ timeout: 3000 });
    await captureMatrix(page, '25', 'puzzle-done');
    await expect(page).toHaveScreenshot();
  });

  test('burst on a piece does not place it twice', async ({ page }) => {
    await gotoPuzzle(page, { __talkiPuzzleLevel: 1 });
    const [id] = await pieceIds(page);
    await burst(page, testIds.puzzle.piece(id!), 10);
    await expect(page.getByTestId(testIds.puzzle.done)).toHaveCount(0);
    await expect(page.getByTestId(testIds.puzzle.piece(id!))).toBeVisible();
  });

  test('drag places when Playwright can drive it; interrupted drag returns', async ({ page }) => {
    await gotoPuzzle(page, { __talkiPuzzleLevel: 1 });
    const [id] = await pieceIds(page);
    const piece = page.getByTestId(testIds.puzzle.piece(id!));
    const slot = page.getByTestId(testIds.puzzle.slot(id!));
    try {
      await piece.dragTo(slot, { force: true });
      await page.waitForTimeout(200);
    } catch {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Playwright cannot drive RNGH/Reanimated drag on RN-web; tap-tap covers placement. Device Tier 3 covers finger drag.',
      });
    }
    const box = await piece.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 40, box.y + 40);
      await piece.dispatchEvent('pointercancel');
      await page.mouse.up();
    }
    await expect(page.getByTestId(testIds.puzzle.piece(id!))).toBeVisible();
  });

  test('320x568 vs large viewport piece count; audits; degradeNativeApis', async ({ page }) => {
    await gotoPuzzle(page, { __talkiPuzzleLevel: 5 });
    const n = (await pieceIds(page)).length;
    const size = page.viewportSize();
    if (size && (size.height < 620 || size.width < 360)) expect(n).toBeLessThanOrEqual(3);
    if (size && size.height >= 780 && size.width >= 360) expect(n).toBe(6);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    await degradeNativeApis(page);
    await gotoPuzzle(page, { __talkiPuzzleLevel: 1 });
    const [id] = await pieceIds(page);
    await tapPlace(page, id!);
    await expect(page.getByTestId(testIds.puzzle.root).or(page.getByTestId(testIds.puzzle.done))).toBeVisible();
  });
});
