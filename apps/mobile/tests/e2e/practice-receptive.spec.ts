import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, countListeners, degradeNativeApis, speechSpy } from './_helpers';
import { gotoPath } from './_practice';

async function gotoReceptive(page: Parameters<typeof gotoPath>[0]) {
  await gotoPath(page, '/practice/receptive?catId=animals&seed=42', testIds.receptive.root, () => {
    (window as unknown as { __talkiPlaceCorrectAt?: number }).__talkiPlaceCorrectAt = 0;
  });
}

test.describe('Phase 26 receptive', () => {
  test('starts at level 2 with two options; columns follow the rule', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoReceptive(page);
    await expect(page.getByTestId(testIds.receptive.option(0))).toBeVisible();
    await expect(page.getByTestId(testIds.receptive.option(1))).toBeVisible();
    await expect(page.getByTestId(testIds.receptive.option(2))).toHaveCount(0);
    expect((await spy.calls()).length).toBe(1);
    await captureMatrix(page, '26', 'receptive-level2');
    await expect(page).toHaveScreenshot();
    for (let i = 0; i < 6; i++) {
      await page.getByTestId(testIds.receptive.option(0)).click();
      await page.waitForTimeout(1200);
    }
    await expect(page.getByTestId(testIds.receptive.option(3))).toBeVisible();
    await expect(page.getByTestId(testIds.receptive.level)).toContainText('4');
    await captureMatrix(page, '26', 'receptive-level4');
  });

  test('audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoReceptive(page);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    const a = await countListeners(page, testIds.game.headerBack);
    await page.getByTestId(testIds.receptive.replay).click();
    const b = await countListeners(page, testIds.game.headerBack);
    expect(b - a).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoReceptive(page);
    await page.getByTestId(testIds.receptive.option(0)).click();
    await expect(page.getByTestId(testIds.receptive.root)).toBeVisible();
  });
});
