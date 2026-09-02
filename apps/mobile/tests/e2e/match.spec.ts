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

type RouterBridge = { push: (path: string) => void };

async function gotoMatch(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
  });
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/match?catId=animals&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.match.root}"]`);
}

async function playPair(page: Page, index: number): Promise<void> {
  const wordBtn = page.getByTestId(testIds.match.word(index));
  const word = (await wordBtn.innerText()).trim();
  await wordBtn.click();
  const pics = page.locator('[data-testid^="match-right-"]');
  const n = await pics.count();
  for (let i = 0; i < n; i++) {
    if ((await pics.nth(i).getAttribute('aria-label')) === word) {
      await pics.nth(i).click();
      return;
    }
  }
  throw new Error(`no picture for ${word}`);
}

test.describe('Phase 9 match', () => {
  test('selecting a word highlights it; a wrong pairing leaves both unmatched', async ({ page }) => {
    await gotoMatch(page);
    await page.getByTestId(testIds.match.word(0)).click();
    await expect(page.getByTestId(testIds.match.wordSelected)).toBeVisible();
    await captureMatrix(page, '09', 'match-selected');
    const word0 = await page.getByTestId(testIds.match.wordSelected).innerText();
    for (let i = 0; i < 5; i++) {
      const label = await page.getByTestId(testIds.match.picture(i)).getAttribute('aria-label');
      if (label && label !== word0) {
        await page.getByTestId(testIds.match.picture(i)).click();
        break;
      }
    }
    await expect(page.getByTestId(testIds.game.chip(0))).toContainText('0/');
    await captureMatrix(page, '09', 'match-board');
    await expect(page).toHaveScreenshot();
  });

  test('burst does not double-match; a full playthrough completes', async ({ page }) => {
    await gotoMatch(page);
    await burst(page, testIds.match.word(0), 8);
    for (let i = 0; i < 5; i++) {
      if (await page.getByTestId(testIds.game.doneCard).isVisible().catch(() => false)) break;
      await playPair(page, i);
    }
    await expect(page.getByTestId(testIds.game.doneCard)).toBeVisible();
    await captureMatrix(page, '09', 'match-done');
  });

  test('board fits; audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoMatch(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    for (let i = 0; i < 10; i++) await page.getByTestId(testIds.match.word(0)).click();
    const afterFirst = await countListeners(page, testIds.match.word(0));
    for (let i = 0; i < 10; i++) await page.getByTestId(testIds.match.word(0)).click();
    const afterSecond = await countListeners(page, testIds.match.word(0));
    expect(afterSecond - afterFirst).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoMatch(page);
    await playPair(page, 0);
    await expect(page.getByTestId(testIds.game.chip(0))).toContainText('1/');
  });
});
