import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, countListeners, degradeNativeApis, speechSpy } from './_helpers';
import { gotoPath } from './_practice';

test.describe('Phase 11 combine', () => {
  test('modifier then picture builds the phrase', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoPath(page, '/practice/combine?catId=animals&seed=42', testIds.combine.root);
    expect((await spy.calls()).length).toBe(1);
    await captureMatrix(page, '11', 'combine-board');
    await expect(page).toHaveScreenshot();
    await page.getByTestId(testIds.combine.modifier(0)).click();
    await page.getByTestId(testIds.combine.picture(0)).click();
    await expect(page.getByTestId(testIds.combine.phrase)).not.toHaveText('');
    await captureMatrix(page, '11', 'combine-phrase');
  });

  test('audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoPath(page, '/practice/combine?catId=animals&seed=42', testIds.combine.root);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    const a = await countListeners(page, testIds.game.headerBack);
    await page.getByTestId(testIds.combine.modifier(0)).click();
    const b = await countListeners(page, testIds.game.headerBack);
    expect(b - a).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoPath(page, '/practice/combine?catId=animals&seed=42', testIds.combine.root);
    await page.getByTestId(testIds.combine.modifier(0)).click();
    await page.getByTestId(testIds.combine.picture(0)).click();
    await expect(page.getByTestId(testIds.combine.phrase)).toBeVisible();
  });
});
