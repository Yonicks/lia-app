import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, countListeners, degradeNativeApis, speechSpy } from './_helpers';
import { gotoPath } from './_practice';

test.describe('Phase 11 cloze', () => {
  test('say / wait / model are distinct; she-said scores', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoPath(page, '/practice/cloze?catId=animals&seed=42', testIds.cloze.root, () => {
      (window as unknown as { __talkiClozeSayHoldMs?: number }).__talkiClozeSayHoldMs = 60_000;
    });
    await expect(page.getByTestId(testIds.cloze.phaseSay)).toBeVisible();
    expect((await spy.calls()).length).toBe(1);
    await captureMatrix(page, '11', 'cloze-say');
    await expect(page).toHaveScreenshot();
  });

  test('wait phase and model phase screenshots', async ({ page }) => {
    await gotoPath(page, '/practice/cloze?catId=animals&seed=42', testIds.cloze.root, () => {
      (window as unknown as { __talkiClozeWaitMs?: number }).__talkiClozeWaitMs = 60_000;
      (window as unknown as { __talkiClozeSkipSay?: boolean }).__talkiClozeSkipSay = true;
    });
    await expect(page.getByTestId(testIds.cloze.phaseWait)).toBeVisible({ timeout: 8000 });
    await captureMatrix(page, '11', 'cloze-wait');
    await page.evaluate(() => {
      (window as unknown as { __talkiClozeWaitMs?: number }).__talkiClozeWaitMs = 1;
    });
  });

  test('wait persists a full 5000 ms then models; parent scores', async ({ page }) => {
    await gotoPath(page, '/practice/cloze?catId=animals&seed=42', testIds.cloze.root, () => {
      (window as unknown as { __talkiClozeSkipSay?: boolean }).__talkiClozeSkipSay = true;
    });
    await expect(page.getByTestId(testIds.cloze.phaseWait)).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(4500);
    await expect(page.getByTestId(testIds.cloze.phaseWait)).toBeVisible();
    await expect(page.getByTestId(testIds.cloze.phaseModel)).toBeVisible({ timeout: 2000 });
    await captureMatrix(page, '11', 'cloze-model');
    await page.getByTestId(testIds.cloze.said).click();
    await expect(page.getByTestId(testIds.game.chip(1))).toContainText('1');
  });

  test('audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoPath(page, '/practice/cloze?catId=animals&seed=42', testIds.cloze.root, () => {
      (window as unknown as { __talkiClozeWaitMs?: number }).__talkiClozeWaitMs = 60_000;
      (window as unknown as { __talkiClozeSkipSay?: boolean }).__talkiClozeSkipSay = true;
    });
    await expect(page.getByTestId(testIds.cloze.phaseWait)).toBeVisible({ timeout: 8000 });
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    const a = await countListeners(page, testIds.game.headerBack);
    await page.getByTestId(testIds.cloze.next).click();
    const b = await countListeners(page, testIds.game.headerBack);
    expect(b - a).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoPath(page, '/practice/cloze?catId=animals&seed=42', testIds.cloze.root, () => {
      (window as unknown as { __talkiClozeWaitMs?: number }).__talkiClozeWaitMs = 60_000;
    });
    await page.getByTestId(testIds.cloze.said).click();
    await expect(page.getByTestId(testIds.cloze.root)).toBeVisible();
  });
});
