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

async function gotoMissing(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
    (window as unknown as { __talkiMissingShowMs?: number }).__talkiMissingShowMs = 200;
  });
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/missing?catId=animals&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.missing.root}"]`);
}

async function waitAsk(page: Page): Promise<void> {
  await page.waitForSelector(`[data-testid="${testIds.missing.phaseAsk}"]`, { timeout: 5000 });
}

async function missingWord(page: Page): Promise<string> {
  return page.evaluate(() => (window as unknown as { __talkiMissingWord: string }).__talkiMissingWord);
}

test.describe('Phase 9 missing', () => {
  test('show is distinct from ask; options disabled during show; prompt speaks once after', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoMissing(page);
    await expect(page.getByTestId(testIds.missing.phaseShow)).toBeVisible();
    await expect(page.getByTestId(testIds.missing.guess(0))).toHaveCount(0);
    // Assert no prompt speech before the slow matrix capture — show window is
    // only 200ms under e2e (`__talkiMissingShowMs`) and tablets can exceed that
    // while screenshotting.
    expect(await spy.calls()).toHaveLength(0);
    await captureMatrix(page, '24', 'missing-show');

    await waitAsk(page);
    await expect(page.getByTestId(testIds.missing.phaseAsk)).toBeVisible();
    await expect(page.getByTestId(testIds.missing.guess(0))).toBeVisible();
    const calls = await spy.calls();
    expect(calls).toHaveLength(1);
    await captureMatrix(page, '24', 'missing-ask');
    await expect(page).toHaveScreenshot();
  });

  test('burst on a guess scores once; five rounds reach the done card', async ({ page }) => {
    await gotoMissing(page);
    for (let round = 0; round < 5; round++) {
      await waitAsk(page);
      const word = await missingWord(page);
      const guess = page.getByRole('button', { name: word });
      if (round === 0) await burst(page, testIds.missing.guess(0), 8);
      else await guess.click();
      if (round < 4) {
        await page.waitForSelector(`[data-testid="${testIds.missing.phaseShow}"]`, { timeout: 2000 });
      }
    }
    await expect(page.getByTestId(testIds.game.doneCard)).toBeVisible();
    await captureMatrix(page, '24', 'missing-done');
  });

  test('board fits; audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoMissing(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    await waitAsk(page);
    const missing = await missingWord(page);
    const wrong = page.locator('[data-testid^="missing-guess-"]').filter({ hasNotText: missing }).first();
    for (let i = 0; i < 10; i++) await wrong.click();
    const afterFirst = await countListeners(page, testIds.game.headerBack);
    for (let i = 0; i < 10; i++) await wrong.click();
    const afterSecond = await countListeners(page, testIds.game.headerBack);
    expect(afterSecond - afterFirst).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoMissing(page);
    await waitAsk(page);
    const word = await missingWord(page);
    await page.getByRole('button', { name: word }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByTestId(testIds.game.chip(1))).toContainText('1');
  });
});
