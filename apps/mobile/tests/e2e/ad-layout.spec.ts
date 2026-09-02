import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, openApp } from './_helpers';

test.describe('Phase 13 ad layout', () => {
  test('no ad element on web; reserved space can be simulated and reclaimed', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __talkiAdReservedPx?: number }).__talkiAdReservedPx = 50;
    });
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    await expect(page.getByTestId(testIds.ads.banner)).toHaveCount(0);
    await expect(page.getByTestId(testIds.ads.reserved)).toBeVisible();
    const withBox = await page.getByTestId(testIds.ads.reserved).boundingBox();
    expect(withBox?.height).toBeGreaterThanOrEqual(50);
    await captureMatrix(page, '13', 'with-ad-space');

    const touch = (await auditTouchTargets(page)).filter((v) => !v.testId.startsWith('ad-'));
    expect(touch, JSON.stringify(touch)).toHaveLength(0);
    const reach = (await auditReachability(page)).filter((v) => !v.testId.startsWith('ad-'));
    expect(reach, JSON.stringify(reach)).toHaveLength(0);

    await page.evaluate(() => {
      (window as unknown as { __talkiSetAdReserved?: (n: number) => void }).__talkiSetAdReserved?.(0);
    });
    await expect(page.getByTestId(testIds.ads.reserved)).toHaveCount(0);
    await expect(page.getByTestId(testIds.ads.banner)).toHaveCount(0);
    await captureMatrix(page, '13', 'without-ad-space');
  });
});
