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

async function gotoCards(page: Page, catId = 'animals'): Promise<void> {
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(
    (id) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(`/cards/${id}`),
    catId,
  );
  await page.waitForSelector(`[data-testid="${testIds.cards.root}"]`);
}

test.describe('Phase 9 cards', () => {
  test('prev and next move through the category; counter is correct at both ends', async ({ page }) => {
    await gotoCards(page);
    await expect(page.getByTestId(testIds.cards.counter)).toContainText('1/');
    await captureMatrix(page, '09', 'cards-first');
    const label = await page.getByTestId(testIds.cards.counter).innerText();
    const total = Number(label.split('/')[1]);
    await page.getByTestId(testIds.cards.next).click();
    await expect(page.getByTestId(testIds.cards.counter)).toHaveText('2/' + total);
    await captureMatrix(page, '09', 'cards-middle');
    for (let i = 2; i < total; i++) await page.getByTestId(testIds.cards.next).click();
    await expect(page.getByTestId(testIds.cards.counter)).toHaveText(`${total}/${total}`);
    await page.getByTestId(testIds.cards.next).click();
    await expect(page.getByTestId(testIds.cards.counter)).toHaveText(`1/${total}`);
    await page.getByTestId(testIds.cards.prev).click();
    await expect(page.getByTestId(testIds.cards.counter)).toHaveText(`${total}/${total}`);
    await expect(page).toHaveScreenshot();
  });

  test('say speaks once per press; burst does not double-advance', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoCards(page);
    const before = await page.getByTestId(testIds.cards.counter).innerText();
    await page.getByTestId(testIds.cards.say).click();
    expect(await spy.calls()).toHaveLength(1);
    await burst(page, testIds.cards.say, 8);
    await expect(page.getByTestId(testIds.cards.counter)).toHaveText(before);
  });

  test('a swipe on the card changes the word', async ({ page }) => {
    await gotoCards(page);
    const box = await page.getByTestId(testIds.cards.word).boundingBox();
    expect(box).toBeTruthy();
    const y = box!.y + box!.height / 2;
    await page.mouse.move(box!.x + box!.width * 0.7, y);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width * 0.2, y, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByTestId(testIds.cards.counter)).toContainText('2/');
  });

  test('an empty category returns home', async ({ page }) => {
    await openApp(page);
    await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
    await page.evaluate(() =>
      (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/cards/mine'),
    );
    await expect(page.getByTestId(testIds.home.root).first()).toBeVisible();
    await expect(page.getByTestId(testIds.cards.root)).toHaveCount(0);
  });

  test('board fits; audits; degradeNativeApis; no listener growth', async ({ page }) => {
    await gotoCards(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    for (let i = 0; i < 10; i++) await page.getByTestId(testIds.cards.say).click();
    const afterFirst = await countListeners(page, testIds.cards.say);
    for (let i = 0; i < 10; i++) await page.getByTestId(testIds.cards.say).click();
    const afterSecond = await countListeners(page, testIds.cards.say);
    expect(afterSecond - afterFirst).toBeLessThanOrEqual(1);
  });

  test('still playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoCards(page);
    await page.getByTestId(testIds.cards.next).click();
    await expect(page.getByTestId(testIds.cards.counter)).toContainText('2/');
  });
});
