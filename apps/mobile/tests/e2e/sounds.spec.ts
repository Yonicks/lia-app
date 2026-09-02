import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  burst,
  captureMatrix,
  countListeners,
  degradeNativeApis,
  openApp,
  speechSpy,
} from './_helpers';

type RouterBridge = { push: (path: string) => void };

async function gotoSounds(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
    (window as unknown as { __talkiPlaceCorrectAt?: number }).__talkiPlaceCorrectAt = 0;
  });
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/sounds?catId=food&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.sounds.root}"]`);
}

test.describe('Phase 10 sounds', () => {
  test('three options; play replays the onomatopoeia; ignores requested category', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoSounds(page);
    await expect(page.getByTestId(testIds.sounds.option(0))).toBeVisible();
    await expect(page.getByTestId(testIds.sounds.option(2))).toBeVisible();
    await expect(page.getByTestId(testIds.sounds.option(3))).toHaveCount(0);
    const first = await spy.calls();
    expect(first.length).toBeGreaterThanOrEqual(1);
    await page.getByTestId(testIds.sounds.play).click();
    const after = await spy.calls();
    expect(after.length).toBe(first.length + 1);
    await captureMatrix(page, '10', 'sounds-board');
    await expect(page).toHaveScreenshot();
  });

  test('burst on option 0 scores once; six rounds reach done', async ({ page }) => {
    await gotoSounds(page);
    await burst(page, testIds.sounds.option(0), 8);
    await page.waitForTimeout(1200);
    for (let i = 1; i < 6; i++) {
      await page.getByTestId(testIds.sounds.option(0)).click();
      await page.waitForTimeout(1200);
    }
    await expect(page.getByTestId(testIds.game.doneCard)).toBeVisible();
    await captureMatrix(page, '10', 'sounds-done');
  });

  test('audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoSounds(page);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    for (let i = 0; i < 8; i++) await page.getByTestId(testIds.sounds.play).click();
    const a = await countListeners(page, testIds.sounds.play);
    for (let i = 0; i < 8; i++) await page.getByTestId(testIds.sounds.play).click();
    const b = await countListeners(page, testIds.sounds.play);
    expect(b - a).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoSounds(page);
    await page.getByTestId(testIds.sounds.option(0)).click();
    await expect(page.getByTestId(testIds.sounds.root)).toBeVisible();
  });
});
