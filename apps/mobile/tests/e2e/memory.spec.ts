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
type MemCard = { idx: number; pair: number; word: string };

async function gotoMemory(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
  });
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/memory?catId=animals&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.memory.root}"]`);
}

async function layout(page: Page): Promise<MemCard[]> {
  await page.waitForFunction(
    () => ((window as unknown as { __talkiMemoryLayout?: MemCard[] }).__talkiMemoryLayout ?? []).length >= 12,
  );
  return page.evaluate(() => (window as unknown as { __talkiMemoryLayout: MemCard[] }).__talkiMemoryLayout);
}

test.describe('Phase 9 memory', () => {
  test('board fits without clipping; screenshots', async ({ page }) => {
    await gotoMemory(page);
    const overflow = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="memory-root"]');
      if (!root) return true;
      return root.scrollHeight > root.clientHeight + 4 || document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(false);
    await captureMatrix(page, '09', 'memory-board');
    await expect(page).toHaveScreenshot();
  });

  test('a third card cannot open while two unmatched are face-up', async ({ page }) => {
    await gotoMemory(page);
    const cards = await layout(page);
    const a = cards[0]!;
    const b = cards.find((c) => c.pair !== a.pair)!;
    const c = cards.find((x) => x.idx !== a.idx && x.idx !== b.idx)!;
    await page.getByTestId(testIds.memory.card(a.idx)).click();
    await page.getByTestId(testIds.memory.card(b.idx)).click();
    await burst(page, testIds.memory.card(c.idx), 8);
    await expect(page.getByTestId(testIds.memory.card(c.idx))).toHaveAttribute('aria-label', 'סגור');
  });

  test('matching all six pairs reaches the done card with the attempt count', async ({ page }) => {
    await gotoMemory(page);
    const cards = await layout(page);
    const pairs = new Map<number, number[]>();
    for (const c of cards) {
      const list = pairs.get(c.pair) ?? [];
      list.push(c.idx);
      pairs.set(c.pair, list);
    }
    for (const [pair, idxs] of pairs) {
      await page.getByTestId(testIds.memory.card(idxs[0]!)).click();
      await page.getByTestId(testIds.memory.card(idxs[1]!)).click();
      if (pair === 0) await captureMatrix(page, '09', 'memory-matched');
    }
    await expect(page.getByTestId(testIds.game.doneCard)).toBeVisible();
    await expect(page.getByTestId(testIds.game.doneCard)).toContainText('ניסיונות');
    await captureMatrix(page, '09', 'memory-done');
    await expect(page).toHaveScreenshot();
  });

  test('touch, reachability, degradeNativeApis, no listener growth', async ({ page }) => {
    await gotoMemory(page);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    const first = await layout(page);
    for (let i = 0; i < 10; i++) await page.getByTestId(testIds.memory.card(first[0]!.idx)).click();
    const afterFirst = await countListeners(page, testIds.memory.card(first[0]!.idx));
    for (let i = 0; i < 10; i++) await page.getByTestId(testIds.memory.card(first[0]!.idx)).click();
    const afterSecond = await countListeners(page, testIds.memory.card(first[0]!.idx));
    expect(afterSecond - afterFirst).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoMemory(page);
    const cards = await layout(page);
    const a = cards[0]!;
    const mate = cards.find((c) => c.pair === a.pair && c.idx !== a.idx)!;
    await page.getByTestId(testIds.memory.card(a.idx)).click();
    await page.getByTestId(testIds.memory.card(mate.idx)).click();
    await expect(page.getByTestId(testIds.memory.chipPairs)).toContainText('1/6');
  });
});
