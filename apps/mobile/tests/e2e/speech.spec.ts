import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, countListeners, degradeNativeApis, speechSpy } from './_helpers';
import { gotoPath } from './_practice';

test.describe('Phase 25 speech game', () => {
  test('unsupported screen when recognition is not available', async ({ page }) => {
    await gotoPath(page, '/game/speech?catId=animals&seed=42', testIds.speech.unsupported);
    await expect(page.getByText('הדפדפן הזה לא תומך בזיהוי דיבור')).toBeVisible();
    await captureMatrix(page, '25', 'speech-unsupported');
    await expect(page).toHaveScreenshot();
  });

  test('board renders when forced on; skip always works; speaks once', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoPath(page, '/game/speech?catId=animals&seed=42', testIds.speech.root, () => {
      const w = window as unknown as { __talkiSpeechGameEnabled?: boolean; __talkiForceSpeechSupported?: boolean };
      w.__talkiSpeechGameEnabled = true;
      w.__talkiForceSpeechSupported = true;
    });
    await expect(page.getByTestId(testIds.speech.skip)).toBeVisible();
    await expect(page.getByTestId(testIds.speech.mic)).toBeVisible();
    // Mic must not be clipped by the viewport / safe bottom.
    const micBox = await page.getByTestId(testIds.speech.mic).boundingBox();
    const vp = page.viewportSize();
    expect(micBox).toBeTruthy();
    expect(micBox!.y + micBox!.height).toBeLessThanOrEqual((vp?.height ?? 0) + 1);
    expect((await spy.calls()).length).toBe(1);
    await captureMatrix(page, '25', 'speech-board');
    await page.getByTestId(testIds.speech.skip).click();
    await expect(page.getByTestId(testIds.speech.skip)).toBeVisible();
  });

  test('audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoPath(page, '/game/speech?catId=animals&seed=42', testIds.speech.unsupported);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    const a = await countListeners(page, testIds.game.headerBack);
    await page.getByTestId(testIds.speech.unsupported).click();
    const b = await countListeners(page, testIds.game.headerBack);
    expect(b - a).toBeLessThanOrEqual(1);
  });

  test('still usable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoPath(page, '/game/speech?catId=animals&seed=42', testIds.speech.unsupported);
    await expect(page.getByTestId(testIds.speech.unsupported)).toBeVisible();
  });
});
