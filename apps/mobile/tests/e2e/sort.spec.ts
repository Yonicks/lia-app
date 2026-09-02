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

async function gotoSort(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
  });
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/sort?catId=animals&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.sort.root}"]`);
}

async function clickCorrectBox(page: Page): Promise<string> {
  const id = await page.evaluate(() => (window as unknown as { __talkiSortCorrect: string }).__talkiSortCorrect);
  await page.getByTestId(testIds.sort.box(id)).click();
  return id;
}

test.describe('Phase 10 sort', () => {
  test('two boxes; a correct tap scores; six rounds complete', async ({ page }) => {
    await gotoSort(page);
    await expect(page.locator('[data-testid^="sort-box-"]')).toHaveCount(2);
    await expect(page.getByTestId(testIds.sort.item)).toBeAttached();
    await captureMatrix(page, '10', 'sort-board');
    await expect(page).toHaveScreenshot();

    const first = await page.evaluate(() => (window as unknown as { __talkiSortCorrect: string }).__talkiSortCorrect);
    await burst(page, testIds.sort.box(first), 8);
    await page.waitForTimeout(1200);
    for (let i = 1; i < 6; i++) {
      await clickCorrectBox(page);
      await page.waitForTimeout(1200);
    }
    await expect(page.getByTestId(testIds.game.doneCard)).toBeVisible();
    await captureMatrix(page, '10', 'sort-done');
  });

  test('audits and degradeNativeApis', async ({ page }) => {
    await gotoSort(page);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    await degradeNativeApis(page);
    await gotoSort(page);
    await clickCorrectBox(page);
    await expect(page.getByTestId(testIds.sort.root).or(page.getByTestId(testIds.game.doneCard))).toBeVisible();
  });
});
