import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { openApp } from './_helpers';

type RouterBridge = { push: (path: string) => void };

async function pushRoute(page: Page, path: string): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate((p) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(p), path);
}

test.describe('Phase 7 / 19 navigation spine', () => {
  test('every hub and rewards is reachable from Home', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await page.getByTestId(testIds.nav.sideEnd).click();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();

    await page.getByTestId(testIds.nav.rewards).click();
    await expect(page.getByTestId(testIds.stickers.root)).toBeVisible();

    await page.goBack();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();

    await page.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
  });

  test('hub cycle uses replace — history does not unwind through hubs', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    // Home → Games → Practice → Home via side nav (replace semantics).
    await page.getByTestId(testIds.nav.sideEnd).click();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await page.getByTestId(testIds.nav.sideEnd).click();
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    await page.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    // After the cycle, push a detail and goBack must return Home — not Practice/Games.
    await page.getByTestId(testIds.home.category('animals')).click();
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    await expect(page.getByTestId(testIds.practiceMenu.root)).toHaveCount(0);
    await expect(page.getByTestId(testIds.gamesMenu.root)).toHaveCount(0);
  });

  test('opening a category and going back returns to Home, never exiting', async ({ page }) => {
    await openApp(page);
    await page.getByTestId(testIds.home.category('animals')).click();
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();

    await page.goBack();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    // Landscape side chrome remains on the hub (no bottom tab bar).
    await expect(page.getByTestId(testIds.nav.sideStart)).toBeVisible();
    await expect(page.getByTestId(testIds.nav.sideEnd)).toBeVisible();
  });

  test('game and practice cards route from hubs, and back returns correctly', async ({ page }) => {
    await openApp(page);
    // Phase 20: Home no longer hosts featured game/practice rows — open via side nav hubs.
    await page.getByTestId(testIds.nav.sideEnd).click();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await page.getByTestId(testIds.gamesMenu.card('memory')).click();
    await expect(page.getByTestId(testIds.game.shellRoot)).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await page.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await page.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    await page.getByTestId(testIds.practiceMenu.card('focus')).click();
    await expect(page.getByTestId(testIds.focus.card)).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    await page.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
  });

  test('the games menu and practice menu are reachable and their cards route to a stub', async ({ page }) => {
    await openApp(page);
    await pushRoute(page, '/games');
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await expect(page.getByTestId(testIds.gamesMenu.chip('animals'))).toBeVisible();
    await expect(page.getByTestId(testIds.gamesMenu.chip('mine'))).toHaveCount(0);
    await page.getByTestId(testIds.gamesMenu.card('quiz')).click();
    await expect(page.getByTestId(testIds.game.shellRoot)).toBeVisible();

    await pushRoute(page, '/practice');
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
  });

  test('the games menu and practice menu remain reachable via route and cards', async ({ page }) => {
    await openApp(page);
    await pushRoute(page, '/games');
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    // Phase 21 owns Games hub matrix evidence (`games.spec.ts` → phase-21/).
    await expect(page.getByTestId(testIds.gamesMenu.card('quiz'))).toBeVisible();

    await pushRoute(page, '/practice');
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    // Phase 22 owns Practice hub matrix evidence (`practice.spec.ts` → phase-22/).
    await expect(page.getByTestId(testIds.practiceMenu.card('focus'))).toBeVisible();
    await expect(page.getByTestId(testIds.practiceMenu.grid)).toBeVisible();
  });

  test('no adult control (no <select>, no dropdown) on any child screen', async ({ page }) => {
    await openApp(page);
    for (const path of ['/games', '/practice']) {
      await pushRoute(page, path);
      await page.waitForTimeout(200);
      const selects = await page.evaluate(() => document.querySelectorAll('select').length);
      expect(selects, `adult control found on ${path}`).toBe(0);
    }
  });
});
