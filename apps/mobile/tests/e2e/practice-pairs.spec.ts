import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, countListeners, degradeNativeApis, speechSpy } from './_helpers';
import { gotoPath } from './_practice';

test.describe('Phase 26 pairs', () => {
  test('two options; replay works', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoPath(page, '/practice/pairs?catId=animals&seed=42', testIds.pairs.root, () => {
      (window as unknown as { __talkiPlaceCorrectAt?: number }).__talkiPlaceCorrectAt = 0;
    });
    await expect(page.getByTestId(testIds.pairs.option(0))).toBeVisible();
    await expect(page.getByTestId(testIds.pairs.option(1))).toBeVisible();
    const first = await spy.calls();
    expect(first.length).toBe(1);
    await page.getByTestId(testIds.pairs.replay).click();
    expect((await spy.calls()).length).toBe(first.length + 1);
    await captureMatrix(page, '26', 'pairs-board');
    await expect(page).toHaveScreenshot();
  });

  test('audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoPath(page, '/practice/pairs?catId=animals&seed=42', testIds.pairs.root);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    const a = await countListeners(page, testIds.game.headerBack);
    await page.getByTestId(testIds.pairs.replay).click();
    const b = await countListeners(page, testIds.game.headerBack);
    expect(b - a).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoPath(page, '/practice/pairs?catId=animals&seed=42', testIds.pairs.root);
    await page.getByTestId(testIds.pairs.option(0)).click();
    await expect(page.getByTestId(testIds.pairs.root)).toBeVisible();
  });
});
