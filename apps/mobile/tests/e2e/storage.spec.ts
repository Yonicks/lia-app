import { expect, test } from '@playwright/test';

import { openApp } from './_helpers';

/**
 * Proves the TalkiStorage abstraction has at least two working
 * implementations, per phase-03-plan.md's Tier 2 test plan: this exercises
 * the real `webStorage` (IndexedDB) backend through the actual Expo web
 * bundle — not a vitest mock — via the test-only bridge installed by
 * src/testing/e2eStorageBridge.ts. Tier 1's storage.test.ts already proves
 * both `webStorage` and `sqliteKvStorage` satisfy the same interface
 * contract in isolation; this proves the web one actually works end to end
 * inside a real browser, which jsdom + fake-indexeddb cannot fully stand in
 * for (real IndexedDB, real async transaction timing).
 */
test.describe('Phase 3 storage: web backend via the real bundle', () => {
  test('round-trips a value through TalkiStorage.get/set/remove/keys', async ({ page }) => {
    await openApp(page);
    await page.waitForFunction(() => Boolean(window.__talkiStorageE2E));

    const result = await page.evaluate(async () => {
      const storage = window.__talkiStorageE2E!;
      const probeKey = 'lia:e2e-storage-probe';

      await storage.set(probeKey, { hello: 'world', n: 3 });
      const value = await storage.get(probeKey);
      const keysAfterSet = await storage.keys();

      await storage.remove(probeKey);
      const afterRemove = await storage.get(probeKey);
      const keysAfterRemove = await storage.keys();

      return {
        value,
        afterRemove,
        includedBeforeRemove: keysAfterSet.includes(probeKey),
        includedAfterRemove: keysAfterRemove.includes(probeKey),
      };
    });

    expect(result.value).toEqual({ hello: 'world', n: 3 });
    expect(result.afterRemove).toBeNull();
    expect(result.includedBeforeRemove).toBe(true);
    expect(result.includedAfterRemove).toBe(false);
  });

  test('a missing key resolves to null, never undefined', async ({ page }) => {
    await openApp(page);
    await page.waitForFunction(() => Boolean(window.__talkiStorageE2E));

    const result = await page.evaluate(async () => {
      const storage = window.__talkiStorageE2E!;
      const value = await storage.get('lia:never-set-in-this-test');
      return { value, isNull: value === null, isUndefined: value === undefined };
    });

    expect(result.isNull).toBe(true);
    expect(result.isUndefined).toBe(false);
  });
});
