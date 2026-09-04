import { expect, test, type Page } from '@playwright/test';

import { PRACTICE_LIST } from '../../src/domain/practice/list';
import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  captureMatrix,
  openApp,
} from './_helpers';

const PRACTICE_IDS = PRACTICE_LIST.map(([id]) => id);

/** First visible proof that a practice mode launched from the hub. */
const MODE_ROOT: Record<(typeof PRACTICE_IDS)[number], string> = {
  focus: testIds.focus.card,
  receptive: testIds.receptive.root,
  cloze: testIds.cloze.phrase,
  temptation: testIds.temptation.jar,
  pairs: testIds.pairs.root,
  combine: testIds.combine.root,
};

async function openPracticeHub(page: Page): Promise<void> {
  await openApp(page);
  // Home → Practice via side-nav replace (single hub mounted).
  await page.getByTestId(testIds.nav.sideStart).click();
  await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
}

test.describe('Phase 22 Practice hub', () => {
  test('renders landscape 3×2 composition with title, grid, and no bottom nav', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await openPracticeHub(page);
    const hub = page.getByTestId(testIds.practiceMenu.root);
    await expect(hub.getByTestId(testIds.practiceMenu.title)).toBeVisible();
    await expect(hub.getByTestId(testIds.practiceMenu.grid)).toBeVisible();
    await expect(hub.getByTestId(testIds.nav.sideStart)).toBeVisible();
    await expect(hub.getByTestId(testIds.nav.sideEnd)).toBeVisible();
    await expect(page.locator('[data-testid^="bottom-nav"]')).toHaveCount(0);

    for (const id of PRACTICE_IDS) {
      await expect(hub.getByTestId(testIds.practiceMenu.card(id))).toBeVisible();
    }
    expect(PRACTICE_IDS).toHaveLength(6);

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);
  });

  test('every registered practice mode launches correctly', async ({ page }) => {
    await openPracticeHub(page);
    const hub = page.getByTestId(testIds.practiceMenu.root);

    for (const id of PRACTICE_IDS) {
      await hub.getByTestId(testIds.practiceMenu.card(id)).click();
      await expect(page.getByTestId(MODE_ROOT[id])).toBeVisible();
      await page.goBack();
      await expect(hub).toBeVisible();
    }
  });

  test('category chips and side nav still work', async ({ page }) => {
    await openPracticeHub(page);
    const hub = page.getByTestId(testIds.practiceMenu.root);
    await expect(hub.getByTestId(testIds.practiceMenu.chip('animals'))).toBeVisible();
    await expect(page.getByTestId(testIds.practiceMenu.chip('mine'))).toHaveCount(0);

    await hub.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await page.getByTestId(testIds.nav.sideStart).click();
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    await page.getByTestId(testIds.practiceMenu.root).getByTestId(testIds.nav.sideEnd).click();
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
  });

  test('touch targets and reachability are clean without page overflow', async ({ page }) => {
    await openPracticeHub(page);
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();

    const touchViolations = await auditTouchTargets(page);
    expect(touchViolations, JSON.stringify(touchViolations)).toHaveLength(0);

    const reachabilityViolations = await auditReachability(page, testIds.practiceMenu.root);
    expect(reachabilityViolations, JSON.stringify(reachabilityViolations)).toHaveLength(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test('captures Practice hub screenshots across the landscape matrix', async ({ page }) => {
    await openPracticeHub(page);
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    await captureMatrix(page, '22', 'practice');
  });
});
