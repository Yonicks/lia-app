import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { STICKERS } from '../../src/domain/rewards/stickers';
import { auditReachability, auditTouchTargets, captureMatrix, openApp } from './_helpers';

type StorageBridge = { set<T>(key: string, value: T): Promise<void> };

async function seedProgress(page: Page, progress: string[]): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiStorageE2E?: unknown }).__talkiStorageE2E));
  await page.evaluate(async (p) => {
    const bridge = (window as unknown as { __talkiStorageE2E: StorageBridge }).__talkiStorageE2E;
    await bridge.set('lia:progress', p);
  }, progress);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/** Phase 27 may page stickers — bring absolute index into view via page dots. */
async function revealSticker(page: Page, index: number): Promise<void> {
  const item = page.getByTestId(testIds.stickers.item(index));
  if ((await item.count()) > 0 && (await item.isVisible())) return;
  const dots = page.locator(`[data-testid^="${testIds.stickers.pageIndicator}-dot-"]`);
  const n = await dots.count();
  for (let d = 0; d < n; d++) {
    await dots.nth(d).click();
    if ((await item.count()) > 0 && (await item.isVisible())) return;
  }
}

test.describe('Phase 27 stickers / rewards', () => {
  test('24 stickers render greyed when locked; filters and counter work', async ({ page }) => {
    await openApp(page);
    await page.getByTestId(testIds.nav.rewards).click();
    await expect(page.getByTestId(testIds.stickers.root)).toBeVisible();
    await expect(page.getByTestId(testIds.stickers.counter)).toHaveText('0 מתוך 24 מדבקות נאספו');

    for (let i = 0; i < STICKERS.length; i++) {
      await revealSticker(page, i);
      await expect(page.getByTestId(testIds.stickers.item(i))).toBeVisible();
    }

    await revealSticker(page, 0);
    const opacity = await page.getByTestId(testIds.stickers.item(0)).evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeLessThan(1);

    await captureMatrix(page, '27', 'stickers-all');

    await page.getByTestId(testIds.stickers.filter('animals')).click();
    const animalCount = STICKERS.filter((s) => s.cat === 'animals').length;
    for (let i = 0; i < animalCount; i++) {
      await revealSticker(page, i);
      await expect(page.getByTestId(testIds.stickers.item(i))).toBeVisible();
    }
    await expect(page.getByTestId(testIds.stickers.item(animalCount))).toHaveCount(0);
    await captureMatrix(page, '27', 'stickers-filtered');

    const touch = (await auditTouchTargets(page)).filter((v) => v.testId.startsWith('stickers-'));
    expect(touch, JSON.stringify(touch)).toHaveLength(0);
    const reach = (await auditReachability(page)).filter((v) => v.testId.startsWith('stickers-'));
    expect(reach, JSON.stringify(reach)).toHaveLength(0);
  });

  test('seeded progress unlocks the matching stickers and the counter', async ({ page }) => {
    await openApp(page);
    await seedProgress(page, ['animals:כֶּלֶב']);
    await page.getByTestId(testIds.nav.rewards).click();
    await expect(page.getByTestId(testIds.stickers.counter)).toHaveText('2 מתוך 24 מדבקות נאספו');
    await revealSticker(page, 0);
    const dogOpacity = await page.getByTestId(testIds.stickers.item(0)).evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(dogOpacity)).toBe(1);
    await captureMatrix(page, '27', 'stickers-progressed');
  });
});
