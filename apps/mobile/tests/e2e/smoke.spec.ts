import { expect, test } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, openApp } from './_helpers';

test.describe('Phase 1 bootstrap smoke', () => {
  test('renders, is touch-safe and reachable, and establishes the screenshot baseline', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await openApp(page);

    await expect(page.getByTestId(testIds.bootstrap.title)).toBeVisible();
    await expect(page.getByTestId(testIds.bootstrap.title)).toHaveText('Talki Native Migration');

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
