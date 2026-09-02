import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, countListeners, degradeNativeApis, speechSpy } from './_helpers';
import { gotoPath } from './_practice';

test.describe('Phase 11 temptation', () => {
  test('closed jar, manual open, no failure', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoPath(page, '/practice/temptation?catId=animals&seed=42', testIds.temptation.root);
    await expect(page.getByTestId(testIds.temptation.jar)).toBeVisible();
    await expect(page.getByTestId(testIds.temptation.open)).toBeVisible();
    expect((await spy.calls()).length).toBe(1);
    await captureMatrix(page, '11', 'temptation-closed');
    await expect(page).toHaveScreenshot();
    await page.getByTestId(testIds.temptation.open).click();
    await expect(page.getByTestId(testIds.temptation.next)).toBeVisible();
    await captureMatrix(page, '11', 'temptation-open');
  });

  test('stubbed recognition of ANY content opens the jar', async ({ page }) => {
    await gotoPath(page, '/practice/temptation?catId=animals&seed=42', testIds.temptation.root, () => {
      const w = window as unknown as {
        __talkiForceSpeechSupported?: boolean;
        __talkiRecognitionResult?: { recognized: boolean; transcript: string | null };
      };
      w.__talkiForceSpeechSupported = true;
      w.__talkiRecognitionResult = { recognized: false, transcript: 'zzzz-not-a-word' };
    });
    await page.getByTestId(testIds.temptation.mic).click();
    await expect(page.getByTestId(testIds.temptation.next)).toBeVisible();
  });

  test('audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoPath(page, '/practice/temptation?catId=animals&seed=42', testIds.temptation.root);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    const a = await countListeners(page, testIds.game.headerBack);
    await page.getByTestId(testIds.temptation.mic).click();
    const b = await countListeners(page, testIds.game.headerBack);
    expect(b - a).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoPath(page, '/practice/temptation?catId=animals&seed=42', testIds.temptation.root);
    await page.getByTestId(testIds.temptation.open).click();
    await expect(page.getByTestId(testIds.temptation.next)).toBeVisible();
  });
});
