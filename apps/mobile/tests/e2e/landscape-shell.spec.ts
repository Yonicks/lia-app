import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix } from './_helpers';

/**
 * Navigates to the unlinked `/dev/landscape-shell` route client-side — same
 * technique as gallery.spec.ts / audio-lab.spec.ts (`expo serve` has no SPA
 * fallback for a direct nested path).
 */
async function gotoLandscapeShell(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() => {
    (window as unknown as { __talkiRouterE2E: { push: (path: string) => void } }).__talkiRouterE2E.push(
      '/dev/landscape-shell'
    );
  });
  await page.waitForSelector(`[data-testid="${testIds.landscapeShell.root}"]`);
}

async function showFrame(page: Page, name: 'home' | 'games' | 'practice'): Promise<void> {
  await page.getByTestId(testIds.landscapeShell.switcher(name)).click();
  await page.waitForSelector(`[data-testid="${testIds.landscapeShell.frame(name)}"]`);
}

test.describe('Phase 18 landscape shell fixtures', () => {
  test('renders Home, Games, and Practice composition frames without console errors', async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await gotoLandscapeShell(page);

    for (const name of ['home', 'games', 'practice'] as const) {
      await showFrame(page, name);
      await expect(page.getByTestId(testIds.landscapeShell.frame(name))).toBeVisible();
      await expect(page.getByTestId(testIds.landscapeShell.topBar(name))).toBeVisible();
      await expect(page.getByTestId(testIds.landscapeShell.sideStart(name))).toBeVisible();
      await expect(page.getByTestId(testIds.landscapeShell.sideEnd(name))).toBeVisible();
    }

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);

    // Capture evidence for the four representative viewports named by the plan.
    const project = testInfo.project.name;
    if (['compact-phone', 'landscape-844', 'tablet-4-3', 'tablet-16-10'].includes(project)) {
      await showFrame(page, 'home');
      await captureMatrix(page, '18', `shell-home-${project}`);
      await showFrame(page, 'games');
      await captureMatrix(page, '18', `shell-games-${project}`);
      await showFrame(page, 'practice');
      await captureMatrix(page, '18', `shell-practice-${project}`);
    }
  });

  test('fixture interactive controls meet 48×48 and stay reachable', async ({ page }) => {
    await gotoLandscapeShell(page);
    await showFrame(page, 'games');

    const touchViolations = await auditTouchTargets(page);
    expect(touchViolations, JSON.stringify(touchViolations)).toHaveLength(0);

    const reachabilityViolations = await auditReachability(page);
    expect(reachabilityViolations, JSON.stringify(reachabilityViolations)).toHaveLength(0);
  });

  test('Games 3×2 grid and page indicator are present', async ({ page }) => {
    await gotoLandscapeShell(page);
    await showFrame(page, 'games');
    await expect(page.getByTestId(testIds.landscapeShell.grid('games'))).toBeVisible();
    await expect(page.getByTestId(testIds.landscapeShell.pageIndicator)).toBeVisible();
    await expect(page.getByTestId(`${testIds.landscapeShell.pageIndicator}-dot-0`)).toBeVisible();
    await expect(page.getByTestId(`${testIds.landscapeShell.pageIndicator}-dot-1`)).toBeVisible();
  });

  test('Home category strip and hero are present', async ({ page }) => {
    await gotoLandscapeShell(page);
    await showFrame(page, 'home');
    await expect(page.getByTestId(testIds.landscapeShell.hero)).toBeVisible();
    await expect(page.getByTestId(testIds.landscapeShell.strip)).toBeVisible();
  });

  test('screenshots of each frame for visual baselines', async ({ page }) => {
    await gotoLandscapeShell(page);

    await showFrame(page, 'home');
    await expect(page.getByTestId(testIds.landscapeShell.frame('home'))).toHaveScreenshot(
      'landscape-shell-home.png',
      { animations: 'disabled' }
    );

    await showFrame(page, 'games');
    await expect(page.getByTestId(testIds.landscapeShell.frame('games'))).toHaveScreenshot(
      'landscape-shell-games.png',
      { animations: 'disabled' }
    );

    await showFrame(page, 'practice');
    await expect(page.getByTestId(testIds.landscapeShell.frame('practice'))).toHaveScreenshot(
      'landscape-shell-practice.png',
      { animations: 'disabled' }
    );
  });
});
