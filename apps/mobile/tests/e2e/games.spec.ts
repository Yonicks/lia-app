import { expect, test, type Page } from '@playwright/test';

import { GAME_IDS } from '../../src/domain/games/ids';
import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  captureMatrix,
  openApp,
} from './_helpers';

async function openGamesHub(page: Page): Promise<void> {
  await openApp(page);
  // Side-nav replace keeps a single hub mounted (unlike router push stack).
  await page.getByTestId(testIds.nav.sideEnd).click();
  await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
}

test.describe('Phase 21 Games hub', () => {
  test('renders landscape 3×2 composition with title, grid, and no bottom nav', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await openGamesHub(page);
    const hub = page.getByTestId(testIds.gamesMenu.root);
    await expect(hub.getByTestId(testIds.gamesMenu.title)).toBeVisible();
    await expect(hub.getByTestId(testIds.gamesMenu.grid)).toBeVisible();
    await expect(hub.getByTestId(testIds.gamesMenu.page(0))).toBeVisible();
    await expect(hub.getByTestId(testIds.nav.sideStart)).toBeVisible();
    await expect(hub.getByTestId(testIds.nav.sideEnd)).toBeVisible();
    await expect(page.locator('[data-testid^="bottom-nav"]')).toHaveCount(0);
    await expect(hub.getByTestId(testIds.gamesMenu.pageIndicator)).toBeVisible();

    // First page exposes six cards; page-2 cards are not mounted yet.
    for (const id of GAME_IDS.slice(0, 6)) {
      await expect(hub.getByTestId(testIds.gamesMenu.card(id))).toBeVisible();
    }
    for (const id of GAME_IDS.slice(6)) {
      await expect(page.getByTestId(testIds.gamesMenu.card(id))).toHaveCount(0);
    }

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);
  });

  test('every registered game is reachable across pages and launches correctly', async ({ page }) => {
    await openGamesHub(page);
    const hub = page.getByTestId(testIds.gamesMenu.root);

    for (const id of GAME_IDS.slice(0, 6)) {
      await hub.getByTestId(testIds.gamesMenu.card(id)).click();
      await expect(page.getByTestId(testIds.game.shellRoot)).toBeVisible();
      await page.goBack();
      await expect(hub).toBeVisible();
    }

    await hub.getByTestId(`${testIds.gamesMenu.pageIndicator}-dot-1`).click();
    await expect(hub.getByTestId(testIds.gamesMenu.page(1))).toBeVisible();
    for (const id of GAME_IDS.slice(6)) {
      await expect(hub.getByTestId(testIds.gamesMenu.card(id))).toBeVisible();
      await hub.getByTestId(testIds.gamesMenu.card(id)).click();
      await expect(page.getByTestId(testIds.game.shellRoot)).toBeVisible();
      await page.goBack();
      await expect(hub).toBeVisible();
      // Returning from a game remounts page 0 — restore page 2 for remaining cards.
      if (!(await hub.getByTestId(testIds.gamesMenu.page(1)).isVisible().catch(() => false))) {
        await hub.getByTestId(`${testIds.gamesMenu.pageIndicator}-dot-1`).click();
        await expect(hub.getByTestId(testIds.gamesMenu.page(1))).toBeVisible();
      }
    }

    expect(GAME_IDS).toHaveLength(11);
  });

  test('category chips and side nav still work', async ({ page }) => {
    await openGamesHub(page);
    const hub = page.getByTestId(testIds.gamesMenu.root);
    await expect(hub.getByTestId(testIds.gamesMenu.chip('animals'))).toBeVisible();
    await expect(page.getByTestId(testIds.gamesMenu.chip('mine'))).toHaveCount(0);

    await hub.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await page.getByTestId(testIds.nav.sideEnd).click();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await page.getByTestId(testIds.gamesMenu.root).getByTestId(testIds.nav.sideEnd).click();
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
  });

  test('touch targets and reachability are clean without page overflow', async ({ page }) => {
    await openGamesHub(page);
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();

    const touchViolations = await auditTouchTargets(page);
    expect(touchViolations, JSON.stringify(touchViolations)).toHaveLength(0);

    const reachabilityViolations = await auditReachability(page, testIds.gamesMenu.root);
    expect(reachabilityViolations, JSON.stringify(reachabilityViolations)).toHaveLength(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test('captures Games hub screenshots for both pages across the landscape matrix', async ({ page }) => {
    await openGamesHub(page);
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await captureMatrix(page, '21', 'games');

    await page
      .getByTestId(testIds.gamesMenu.root)
      .getByTestId(`${testIds.gamesMenu.pageIndicator}-dot-1`)
      .click();
    await expect(page.getByTestId(testIds.gamesMenu.page(1))).toBeVisible();
    await captureMatrix(page, '21', 'games-page-2');
  });
});
