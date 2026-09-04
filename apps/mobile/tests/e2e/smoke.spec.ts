import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, openApp } from './_helpers';

/**
 * Phase 1's placeholder ("Talki Native Migration") was replaced by real
 * Home in Phase 7 (app/index.tsx) — this suite now proves the same
 * harness properties (renders, no console errors, touch-safe, reachable)
 * against the real landing screen instead. `home.spec.ts` owns Home's own
 * behaviour in depth.
 */
test.describe('App root smoke', () => {
  test('renders Home, is touch-safe and reachable, and establishes the screenshot baseline', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await openApp(page);

    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);

    const touchViolations = await auditTouchTargets(page);
    expect(touchViolations, JSON.stringify(touchViolations)).toHaveLength(0);

    const reachabilityViolations = await auditReachability(page);
    expect(reachabilityViolations, JSON.stringify(reachabilityViolations)).toHaveLength(0);

    await expect(page).toHaveScreenshot();

    await captureMatrix(page, '01', 'bootstrap');
  });
});
