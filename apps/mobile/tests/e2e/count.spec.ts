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

async function gotoCount(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
  });
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/count?catId=animals&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.count.root}"]`);
}

async function clickCorrect(page: Page): Promise<void> {
  const n = await page.evaluate(() => (window as unknown as { __talkiCountN: number }).__talkiCountN);
  await page.getByRole('button', { name: String(n) }).click();
}

test.describe('Phase 10 count', () => {
  test('stage shows exactly n images; three options; playthrough completes', async ({ page }) => {
    await gotoCount(page);
    const n = await page.evaluate(() => (window as unknown as { __talkiCountN: number }).__talkiCountN);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(5);
    await expect(page.getByTestId(testIds.count.option(0))).toBeVisible();
    await expect(page.getByTestId(testIds.count.option(2))).toBeVisible();
    await expect(page.getByTestId(testIds.count.option(3))).toHaveCount(0);
    const stageChildren = await page.locator(`[data-testid="${testIds.count.stage}"] > *`).count();
    expect(stageChildren).toBe(n);
    await captureMatrix(page, '10', 'count-board');
    await expect(page).toHaveScreenshot();

    const firstN = await page.evaluate(() => (window as unknown as { __talkiCountN: number }).__talkiCountN);
    const firstId =
      (await page.getByRole('button', { name: String(firstN) }).getAttribute('data-testid')) ?? testIds.count.option(0);
    await burst(page, firstId, 6);
    await page.waitForTimeout(1400);
    for (let i = 0; i < 4; i++) {
      await clickCorrect(page);
      await page.waitForTimeout(1400);
    }
    await expect(page.getByTestId(testIds.game.doneCard)).toBeVisible();
    await captureMatrix(page, '10', 'count-done');
  });

  test('audits and degradeNativeApis', async ({ page }) => {
    await gotoCount(page);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    await degradeNativeApis(page);
    await gotoCount(page);
    await clickCorrect(page);
    await expect(page.getByTestId(testIds.count.root).or(page.getByTestId(testIds.game.doneCard))).toBeVisible();
  });
});
