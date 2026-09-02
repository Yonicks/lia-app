import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  captureMatrix,
  degradeNativeApis,
  openApp,
  speechSpy,
} from './_helpers';

type RouterBridge = { push: (path: string) => void };

async function gotoBubbles(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
  });
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/bubbles?catId=animals&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.bubbles.root}"]`);
}

test.describe('Phase 10 bubbles', () => {
  test('bubbles spawn and pop; one speak per pop; screenshot', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoBubbles(page);
    await page.waitForSelector('[data-testid^="bubbles-bubble-"]', { timeout: 4000 });
    await captureMatrix(page, '10', 'bubbles-stage');
    await expect(page).toHaveScreenshot();
    const before = (await spy.calls()).length;
    await page.locator('[data-testid^="bubbles-bubble-"]').first().click();
    await page.waitForTimeout(200);
    const after = await spy.calls();
    expect(after.length).toBe(before + 1);
  });

  test('spawner stops on navigation away', async ({ page }) => {
    await gotoBubbles(page);
    await page.waitForSelector('[data-testid^="bubbles-bubble-"]', { timeout: 4000 });
    await page.getByTestId(testIds.game.headerBack).click();
    await expect(page.getByTestId(testIds.home.root).first()).toBeVisible();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId(testIds.bubbles.root)).toHaveCount(0);
  });

  test('audits and degradeNativeApis', async ({ page }) => {
    await gotoBubbles(page);
    await page.waitForSelector('[data-testid^="bubbles-bubble-"]', { timeout: 4000 });
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    await degradeNativeApis(page);
    await gotoBubbles(page);
    await page.waitForSelector('[data-testid^="bubbles-bubble-"]', { timeout: 4000 });
    await page.locator('[data-testid^="bubbles-bubble-"]').first().click();
    await expect(page.getByTestId(testIds.bubbles.root)).toBeVisible();
  });
});
