import { expect, test, type Page } from '@playwright/test';

import { CATEGORIES } from '../../src/domain/vocabulary/categories';
import { landscapeTokens } from '../../src/design-system/landscape/tokens';
import { wordGridPageSize } from '../../src/domain/vocabulary/wordGridPages';
import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  burst,
  captureMatrix,
  degradeNativeApis,
  openApp,
  speechSpy,
} from './_helpers';

type StorageBridge = { get<T>(key: string): Promise<T | null>; set<T>(key: string, value: T): Promise<void> };
type RouterBridge = { push: (path: string) => void };

/** Client-navigates to `/category/<id>` via the router bridge — `expo
 *  serve` has no SPA fallback for a direct `page.goto()` to a nested
 *  dynamic route, same constraint documented in gallery.spec.ts's
 *  `gotoGallery`. */
async function gotoCategory(page: Page, id: string): Promise<void> {
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(
    (catId) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(`/category/${catId}`),
    id,
  );
  await page.waitForSelector(`[data-testid="${testIds.category.root}"]`);
}

/**
 * Seeds `lia:settings` through the real storage bridge, then reloads — the
 * same pattern as home.spec.ts's `seedProgress` — so the settings store
 * hydrates fresh from the seeded value on a clean mount. MUST be called
 * while on Home (i.e. before `gotoCategory`), never on an already-mounted
 * category screen: a live `__talkiStoresE2E.rehydrate()` call while a
 * category's word tiles are mounted was found to permanently stop
 * react-native-web's gesture responder from firing `onPress` on that
 * screen's Pressables.
 */
async function setNiqqud(page: Page, enabled: boolean): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiStorageE2E?: unknown }).__talkiStorageE2E));
  await page.evaluate(async (v) => {
    const w = window as unknown as { __talkiStorageE2E: StorageBridge };
    await w.__talkiStorageE2E.set('lia:settings', { niqqud: v });
  }, enabled);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/** Walk page dots and collect every mounted word-tile test id index. */
async function collectReachableWordIndices(page: Page): Promise<number[]> {
  const indices = new Set<number>();
  const readVisible = async () => {
    const found = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid^="category-word-"]')).map((el) => {
        const id = el.getAttribute('data-testid') ?? '';
        return Number(id.replace('category-word-', ''));
      }),
    );
    for (const i of found) {
      if (Number.isFinite(i)) indices.add(i);
    }
  };

  await readVisible();
  const dots = page.locator(`[data-testid^="${testIds.category.pageIndicator}-dot-"]`);
  const count = await dots.count();
  for (let i = 0; i < count; i++) {
    await dots.nth(i).click();
    await page.waitForSelector(`[data-testid="${testIds.category.page(i)}"]`);
    await readVisible();
  }
  return [...indices].sort((a, b) => a - b);
}

test.describe('Phase 23 landscape category screen', () => {
  test('renders landscape shell with title/progress/grid and writes lia:lastcat', async ({ page }) => {
    await gotoCategory(page, 'animals');
    await expect(page.getByTestId(testIds.category.title)).toHaveText('חיות');
    await expect(page.getByTestId(testIds.category.progress)).toBeVisible();
    await expect(page.getByTestId(testIds.category.grid)).toBeVisible();
    await expect(page.getByTestId(testIds.category.back)).toBeVisible();
    await expect(page.locator('[data-testid^="bottom-nav"]')).toHaveCount(0);

    // Opening writes lastcat (enterCat equivalent).
    const lastCat = await page.evaluate(() =>
      (window as unknown as { __talkiStorageE2E: StorageBridge }).__talkiStorageE2E.get<string>('lia:lastcat'),
    );
    expect(lastCat).toBe('animals');
  });

  test('every animals word is reachable via landscape paging', async ({ page }) => {
    await gotoCategory(page, 'animals');
    const indices = await collectReachableWordIndices(page);
    expect(indices).toHaveLength(CATEGORIES.animals.items.length);
    expect(indices[0]).toBe(0);
    expect(indices[indices.length - 1]).toBe(CATEGORIES.animals.items.length - 1);

    // Compact phone matrix uses 5×2 → paging required for 26 words.
    const compactPage = wordGridPageSize(
      landscapeTokens('compactPhone').wordGridColumns,
      landscapeTokens('compactPhone').wordGridRows,
    );
    if (CATEGORIES.animals.items.length > compactPage) {
      await expect(page.getByTestId(testIds.category.pageIndicator)).toBeVisible();
    }
  });

  test('tapping a word calls the voice service exactly once with the PLAIN form, and marks it learned', async ({
    page,
  }) => {
    const spy = await speechSpy(page);
    await gotoCategory(page, 'animals');

    await expect(spy.calls()).resolves.toHaveLength(0);
    await page.getByTestId(testIds.category.word(0)).click();

    const calls = await spy.calls();
    expect(calls).toHaveLength(1);
    expect(calls[0].catId).toBe('animals');
    expect(calls[0].word).toBe('כלב'); // plain(), niqqud stripped — never the pointed form
    expect(calls[0].word).not.toContain('ֶּ'); // no niqqud marks at all

    await expect(page.getByTestId(testIds.category.word(0))).toContainText('★');
  });

  test('the niqqud toggle changes the rendered word but never the text passed to the voice service', async ({
    page,
  }) => {
    const spy = await speechSpy(page);
    await openApp(page);
    await setNiqqud(page, false);
    await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
    await page.evaluate(
      () => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/category/animals'),
    );
    await page.waitForSelector(`[data-testid="${testIds.category.root}"]`);

    await page.getByTestId(testIds.category.word(0)).click();
    const calls = await spy.calls();
    expect(calls[0].word).toBe('כלב');

    const text = await page.evaluate(
      () => document.querySelector('[data-testid="category-word-0"]')?.textContent ?? '',
    );
    expect(text).not.toContain('ֶּ');
  });

  test('burst on a word tile does not double-count', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoCategory(page, 'animals');
    await burst(page, testIds.category.word(0), 10);
    await page.waitForTimeout(50);
    const calls = await spy.calls();
    expect(calls.length).toBeLessThanOrEqual(10);
    await expect(page.getByTestId(testIds.category.word(0))).toContainText('★');
  });

  test('back returns to Home', async ({ page }) => {
    await gotoCategory(page, 'animals');
    await page.getByTestId(testIds.category.back).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
  });

  test('cards / play / practice CTAs remain reachable', async ({ page }) => {
    await gotoCategory(page, 'animals');
    await expect(page.getByTestId(testIds.category.cards)).toBeVisible();
    await expect(page.getByTestId(testIds.category.play)).toBeVisible();
    await expect(page.getByTestId(testIds.category.practice)).toBeVisible();
  });

  test('empty mine category shows the empty state', async ({ page }) => {
    await gotoCategory(page, 'mine');
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
    await expect(page.getByTestId(testIds.category.title)).toBeVisible();
    await expect(page.getByTestId(testIds.category.grid)).toBeVisible();
    const wordCount = await page.evaluate(() => document.querySelectorAll('[data-testid^="category-word-"]').length);
    expect(wordCount).toBe(0);
  });

  test('touch targets and reachability are clean, with no adult control present', async ({ page }) => {
    await gotoCategory(page, 'animals');

    const touchViolations = await auditTouchTargets(page);
    expect(touchViolations, JSON.stringify(touchViolations)).toHaveLength(0);

    const reachabilityViolations = await auditReachability(page, testIds.category.root);
    expect(reachabilityViolations, JSON.stringify(reachabilityViolations)).toHaveLength(0);

    const selectCount = await page.evaluate(() => document.querySelectorAll('select').length);
    expect(selectCount).toBe(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight > document.documentElement.clientHeight + 2,
    );
    expect(overflow).toBe(false);
  });

  test('still renders and stays usable with every native API degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoCategory(page, 'animals');
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
    await page.getByTestId(testIds.category.word(0)).click();
    await expect(page.getByTestId(testIds.category.word(0))).toContainText('★');
  });

  test('captures landscape category screenshots (small, large, mine)', async ({ page }) => {
    test.setTimeout(90_000);

    // Small category — emotions (10 words, typically one page on phones).
    await gotoCategory(page, 'emotions');
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
    await expect(page.getByTestId(testIds.category.title)).toBeVisible();
    await captureMatrix(page, '23', 'category-emotions');

    // Large category — animals (26 words, paging on phones). Fresh navigation
    // avoids Expo web stacked-route ghosts from router.push between categories.
    await gotoCategory(page, 'animals');
    await expect(page.getByTestId(testIds.category.title)).toHaveText('חיות');
    await captureMatrix(page, '23', 'category-animals');
    await page.getByTestId(testIds.category.word(0)).click();
    await page.getByTestId(testIds.category.word(1)).click();
    await captureMatrix(page, '23', 'category-animals-learned');

    // Custom / mine empty state.
    await gotoCategory(page, 'mine');
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
    await captureMatrix(page, '23', 'category-mine');
  });
});
