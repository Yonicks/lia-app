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
} from './_helpers';

type StorageBridge = { set<T>(key: string, value: T): Promise<void> };

/** Seeds `lia:progress`/`lia:lastcat` through the real storage bridge, then
 *  reloads so the app's Zustand stores hydrate fresh from the seeded
 *  values — a Zustand store is a module-level singleton, so a plain
 *  `page.evaluate()` after mount would race the store that already read
 *  empty storage on first render. */
async function seedProgress(page: Page, progress: string[], lastCat: string | null): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiStorageE2E?: unknown }).__talkiStorageE2E));
  await page.evaluate(
    async ([p, lc]) => {
      const bridge = (window as unknown as { __talkiStorageE2E: StorageBridge }).__talkiStorageE2E;
      await bridge.set('lia:progress', p);
      if (lc !== null) await bridge.set('lia:lastcat', lc);
    },
    [progress, lastCat] as const,
  );
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('Phase 7 / 20 Home', () => {
  test('renders landscape Home composition: hero above category strip, no bottom nav', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await openApp(page);
    await seedProgress(page, ['animals:כֶּלֶב', 'animals:חָתוּל'], 'animals');
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    const hero = page.getByTestId(testIds.home.hero);
    const categories = page.getByTestId(testIds.home.sectionCategories);
    await expect(hero).toBeVisible();
    await expect(categories).toBeVisible();
    await expect(page.getByTestId(testIds.nav.sideStart)).toBeVisible();
    await expect(page.getByTestId(testIds.nav.sideEnd)).toBeVisible();
    await expect(page.locator('[data-testid^="bottom-nav"]')).toHaveCount(0);

    const [heroBox, catBox] = await Promise.all([hero.boundingBox(), categories.boundingBox()]);
    expect(heroBox!.y).toBeLessThan(catBox!.y);

    // Former Home practice/games rows are not on the landscape Home surface.
    await expect(page.getByTestId(testIds.home.sectionPractice)).toHaveCount(0);
    await expect(page.getByTestId(testIds.home.sectionGames)).toHaveCount(0);

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);
  });

  test('the hero uses currentCategory(), pointing at the seeded lastCat while it is not fully learned', async ({
    page,
  }) => {
    await openApp(page);
    await seedProgress(page, ['animals:כֶּלֶב'], 'animals');
    await expect(page.getByTestId(testIds.home.hero)).toBeVisible();
    await expect(page.getByTestId(testIds.home.hero)).toContainText('חיות');
    await expect(page.getByTestId(testIds.home.heroContinue)).toHaveText('המשך ללמוד');
  });

  test('the hero is a welcome banner on a completely fresh app (learned.size === 0), not a fabricated 0% continue card', async ({
    page,
  }) => {
    await openApp(page);
    await expect(page.getByTestId(testIds.home.hero)).toBeVisible();
    await expect(page.getByTestId(testIds.home.hero)).toContainText('היי כאן דברי');
    await expect(page.getByTestId(testIds.home.heroContinue)).toHaveText('מתחילים ללמוד');
  });

  test('all categories including mine remain reachable in the strip', async ({ page }) => {
    await openApp(page);
    const expected = [
      'animals',
      'food',
      'colors',
      'home',
      'outside',
      'actions',
      'family',
      'body',
      'numbers',
      'emotions',
      'mine',
    ] as const;
    for (const id of expected) {
      await expect(page.getByTestId(testIds.home.category(id))).toBeAttached();
    }
    // Scroll the strip end-ward so mine is interactable, then open it.
    await page.getByTestId(testIds.home.category('mine')).scrollIntoViewIfNeeded();
    await page.getByTestId(testIds.home.category('mine')).click();
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
  });

  test('side nav reaches Games and Practice hubs (replacing former Home rows)', async ({ page }) => {
    await openApp(page);
    await page.getByTestId(testIds.nav.sideEnd).click();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await page.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await page.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
  });

  test('touch targets and reachability are clean, with no horizontal page overflow', async ({ page }) => {
    await openApp(page);
    await seedProgress(page, ['animals:כֶּלֶב'], 'animals');

    const touchViolations = await auditTouchTargets(page);
    expect(touchViolations, JSON.stringify(touchViolations)).toHaveLength(0);

    const reachabilityViolations = await auditReachability(page);
    expect(reachabilityViolations, JSON.stringify(reachabilityViolations)).toHaveLength(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
  });

  test('burst(home-category-animals, 10) navigates exactly once', async ({ page }) => {
    await openApp(page);
    await burst(page, testIds.home.category('animals'), 10);
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
    await expect(page.getByTestId(testIds.category.title)).toHaveText('חיות');
    await page.goBack();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
  });

  test('no listener growth on the music toggle across ten re-renders', async ({ page }) => {
    await openApp(page);
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('topbar-music').click();
    }
    const afterFirstBatch = await countListeners(page, 'topbar-music');
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('topbar-music').click();
    }
    const afterSecondBatch = await countListeners(page, 'topbar-music');
    expect(afterSecondBatch - afterFirstBatch).toBeLessThanOrEqual(1);
  });

  test('still renders and stays usable with every native API degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    await expect(page.getByTestId(testIds.home.sectionCategories)).toBeVisible();
  });

  test('captures the Home baseline screenshot', async ({ page }) => {
    await openApp(page);
    await seedProgress(page, ['animals:כֶּלֶב'], 'animals');
    await expect(page).toHaveScreenshot();
    await captureMatrix(page, '20', 'home');
  });

  test('captures the empty-progress Home baseline screenshot', async ({ page }) => {
    await openApp(page);
    await captureMatrix(page, '20', 'home-empty');
  });

  test('captures the seeded-progress Home baseline screenshot', async ({ page }) => {
    await openApp(page);
    await seedProgress(page, ['animals:כֶּלֶב', 'animals:חָתוּל', 'animals:סוּס'], 'animals');
    await captureMatrix(page, '20', 'home-progressed');
  });
});
