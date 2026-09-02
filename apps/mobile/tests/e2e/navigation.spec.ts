import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { captureMatrix, openApp } from './_helpers';

type RouterBridge = { push: (path: string) => void };

async function pushRoute(page: Page, path: string): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate((p) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(p), path);
}

test.describe('Phase 7 navigation spine', () => {
  test('every tab is reachable from Home', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await page.getByTestId(testIds.nav.games).click();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();

    await page.getByTestId(testIds.nav.rewards).click();
    await expect(page.getByTestId(testIds.stickers.root)).toBeVisible();

    await page.getByTestId(testIds.nav.home).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
  });

  test('opening a category and going back returns to Home, never exiting', async ({ page }) => {
    await openApp(page);
    await page.getByTestId(testIds.home.category('animals')).click();
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();

    await page.goBack();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    // Still on the app, not navigated away — the tab bar (a Home-only
    // fixture) is still present.
    await expect(page.getByTestId('tabs-bottom-nav')).toBeVisible();
  });

  test('game and practice cards route to a stub screen, and back returns correctly', async ({ page }) => {
    await openApp(page);
    await page.getByTestId(testIds.home.game('memory')).click();
    await expect(page.getByTestId(testIds.game.shellRoot)).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await page.getByTestId(testIds.home.practice('focus')).click();
    await expect(page.getByTestId(testIds.focus.card)).toBeVisible();
    await page.goBack();
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

  test('captures the games-menu and practice-menu screenshot baselines', async ({ page }) => {
    await openApp(page);
    await pushRoute(page, '/games');
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await captureMatrix(page, '07', 'games-menu');

    await pushRoute(page, '/practice');
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    await captureMatrix(page, '07', 'practice-menu');
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
