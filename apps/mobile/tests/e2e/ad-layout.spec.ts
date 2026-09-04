import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, openApp } from './_helpers';

type RouterBridge = { push: (path: string) => void };

async function pushRoute(page: Page, path: string): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E),
  );
  await page.evaluate(
    (p) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(p),
    path,
  );
}

test.describe('Phase 28 ad placement', () => {
  test('eligible hub can reserve strip; gameplay reclaims it', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __talkiAdReservedPx?: number }).__talkiAdReservedPx = 50;
    });
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    await expect(page.getByTestId(testIds.ads.banner)).toHaveCount(0);
    await expect(page.getByTestId(testIds.ads.reserved)).toBeVisible();
    const withBox = await page.getByTestId(testIds.ads.reserved).boundingBox();
    expect(withBox?.height).toBeGreaterThanOrEqual(50);
    await captureMatrix(page, '28', 'ad-eligible-home');

    await pushRoute(page, '/game/quiz?catId=animals&seed=42');
    await expect(page.getByTestId(testIds.quiz.root)).toBeVisible();
    await expect(page.getByTestId(testIds.ads.reserved)).toHaveCount(0);
    await captureMatrix(page, '28', 'ad-ineligible-quiz');

    // Failure/reclaim path — strip stays gone on ineligible routes even if
    // an E2E helper tries to inject reserved height.
    await page.evaluate(() => {
      (window as unknown as { __talkiSetAdReserved?: (n: number) => void }).__talkiSetAdReserved?.(50);
    });
    await expect(page.getByTestId(testIds.ads.reserved)).toHaveCount(0);

    // Return to an eligible hub that is not the Stack's hidden prior Home.
    await pushRoute(page, '/games');
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    // Remount re-reads __talkiAdReservedPx from the init script.
    await expect(page.getByTestId(testIds.ads.reserved)).toBeVisible();
    const again = await page.getByTestId(testIds.ads.reserved).boundingBox();
    expect(again?.height).toBeGreaterThanOrEqual(50);

    await page.evaluate(() => {
      (window as unknown as { __talkiSetAdReserved?: (n: number) => void }).__talkiSetAdReserved?.(0);
    });
    await expect(page.getByTestId(testIds.ads.reserved)).toHaveCount(0);
    await captureMatrix(page, '28', 'ad-reclaimed-games');
  });

  test('practice detail and category are ineligible', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __talkiAdReservedPx?: number }).__talkiAdReservedPx = 50;
    });
    await openApp(page);

    await pushRoute(page, '/practice');
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    await expect(page.getByTestId(testIds.ads.reserved)).toBeVisible();

    await pushRoute(page, '/practice/focus?catId=animals&seed=42');
    await expect(page.getByTestId(testIds.focus.root)).toBeVisible();
    await expect(page.getByTestId(testIds.ads.reserved)).toHaveCount(0);

    await pushRoute(page, '/category/animals');
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
    await expect(page.getByTestId(testIds.ads.reserved)).toHaveCount(0);
  });
});

test.describe('Phase 13 ad layout (compat)', () => {
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
