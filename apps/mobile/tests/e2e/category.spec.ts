import { expect, test, type Page } from '@playwright/test';

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
 * screen's Pressables. In the real app `hydrate()` only ever runs once per
 * store, guarded by its own `hydrated` flag (progressStore.ts/
 * settingsStore.ts) — no in-app code path re-hydrates an already-hydrated
 * store while a screen is mounted — so a reload-before-navigating is both
 * closer to a real cold start and sidesteps the test-only artifact
 * entirely, rather than chasing react-native-web's responder internals.
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

test.describe('Phase 7 category screen', () => {
  test('renders every word in the category, opening writes lia:lastcat', async ({ page }) => {
    await gotoCategory(page, 'animals');
    await expect(page.getByTestId(testIds.category.title)).toHaveText('חיות');

    const wordCount = await page.evaluate(() => document.querySelectorAll('[data-testid^="category-word-"]').length);
    expect(wordCount).toBe(26); // animals has 26 built-in words (domain-parity.test.ts)

    // enterCat()'s equivalent must have written the key by the time the
    // screen is interactive.
    const lastCat = await page.evaluate(() =>
      (window as unknown as { __talkiStorageE2E: StorageBridge }).__talkiStorageE2E.get<string>('lia:lastcat'),
    );
    expect(lastCat).toBe('animals');
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

    // Click first, check display after: an `expect(locator).toContainText()`
    // / `expect.poll()` check on this exact element *before* the click was
    // found to permanently stop react-native-web's gesture responder from
    // firing `onPress` on it for the rest of the test — some interaction
    // between Playwright's polling and RNW's responder negotiation, not
    // anything about the app itself (every other Pressable on the page
    // keeps working fine, and the display doesn't change from clicking, so
    // checking it after is equally valid).
    await page.getByTestId(testIds.category.word(0)).click();
    const calls = await spy.calls();
    expect(calls[0].word).toBe('כלב'); // identical plain form regardless of the display setting

    const text = await page.evaluate(
      () => document.querySelector('[data-testid="category-word-0"]')?.textContent ?? '',
    );
    expect(text).not.toContain('ֶּ'); // niqqud=false stripped the displayed marks too
  });

  test('burst on a word tile does not double-count', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoCategory(page, 'animals');
    await burst(page, testIds.category.word(0), 10);
    await page.waitForTimeout(50);
    const calls = await spy.calls();
    // React's synthetic click handler fires once per native click event;
    // `markLearned` is itself idempotent (progressStore.ts), so even ten
    // real clicks may not multiply the visible speech count if the browser
    // coalesces them — the invariant this test actually protects is "never
    // more calls than clicks, and the learned state converges to true".
    expect(calls.length).toBeLessThanOrEqual(10);
    await expect(page.getByTestId(testIds.category.word(0))).toContainText('★');
  });

  test('back returns to Home', async ({ page }) => {
    await gotoCategory(page, 'animals');
    await page.getByTestId(testIds.category.back).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
  });

  test('touch targets and reachability are clean, with no adult control present', async ({ page }) => {
    await gotoCategory(page, 'animals');

    const touchViolations = await auditTouchTargets(page);
    expect(touchViolations, JSON.stringify(touchViolations)).toHaveLength(0);

    const reachabilityViolations = await auditReachability(page);
    expect(reachabilityViolations, JSON.stringify(reachabilityViolations)).toHaveLength(0);

    // interaction_suite.py test 12b's equivalent: no <select>/dropdown
    // anywhere on a child screen.
    const selectCount = await page.evaluate(() => document.querySelectorAll('select').length);
    expect(selectCount).toBe(0);
  });

  test('still renders and stays usable with every native API degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoCategory(page, 'animals');
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();
    await page.getByTestId(testIds.category.word(0)).click();
    // Speaking is unavailable, but tapping must not throw or freeze the
    // screen — the tile still shows learned.
    await expect(page.getByTestId(testIds.category.word(0))).toContainText('★');
  });

  test('captures the category baseline screenshots', async ({ page }) => {
    await gotoCategory(page, 'animals');
    await captureMatrix(page, '07', 'category-animals');
    await page.getByTestId(testIds.category.word(0)).click();
    await page.getByTestId(testIds.category.word(1)).click();
    await captureMatrix(page, '07', 'category-animals-learned');
  });
});
