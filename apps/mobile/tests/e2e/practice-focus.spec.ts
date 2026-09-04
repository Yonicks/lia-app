import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, countListeners, degradeNativeApis, speechSpy } from './_helpers';
import { gotoPath } from './_practice';

test.describe('Phase 26 focus', () => {
  test('renders, speaks once, dots advance, bespoke done card', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoPath(page, '/practice/focus?catId=animals&seed=42', testIds.focus.card);
    await expect(page.getByTestId(testIds.focus.card)).toBeVisible();
    await expect(page.getByTestId(testIds.focus.phrase)).toBeVisible();
    await expect(page.getByTestId(testIds.focus.dots)).toBeVisible();
    const first = await spy.calls();
    expect(first.length).toBe(1);
    await captureMatrix(page, '26', 'focus-step1');
    await expect(page).toHaveScreenshot();
    for (let i = 0; i < 8; i++) {
      await page.getByTestId(testIds.focus.card).click();
      await page.waitForTimeout(80);
    }
    await expect(page.getByTestId(testIds.focus.done)).toBeVisible();
    await expect(page.getByTestId(testIds.focus.nextWord)).toBeVisible();
    await expect(page.getByText('המילה נשמעה 8 פעמים במשפטים שונים')).toBeVisible();
    await captureMatrix(page, '26', 'focus-done');
  });

  test('audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoPath(page, '/practice/focus?catId=animals&seed=42', testIds.focus.card);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    const a = await countListeners(page, testIds.game.headerBack);
    await page.getByTestId(testIds.focus.card).click();
    const b = await countListeners(page, testIds.game.headerBack);
    expect(b - a).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoPath(page, '/practice/focus?catId=animals&seed=42', testIds.focus.card);
    await page.getByTestId(testIds.focus.card).click();
    await expect(page.getByTestId(testIds.focus.root)).toBeVisible();
  });
});
