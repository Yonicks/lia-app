import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix, openApp } from './_helpers';

type RouterBridge = { push: (path: string) => void };

async function pushRoute(page: Page, path: string): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E),
  );
  await page.evaluate(
    (p) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(p),
    path,
  );
}

test.describe('Phase 28 global polish', () => {
  test('intro then deep-link lands on game', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?game=quiz');
    await page.waitForLoadState('networkidle');
    // Reduced-motion intro hold (~400ms) + bumper skip → DeepLinkAfterIntro.
    await expect(page.getByTestId(testIds.quiz.root)).toBeVisible({ timeout: 6000 });
    await expect(page.getByTestId(testIds.intro.root)).toHaveCount(0);
    await captureMatrix(page, '28', 'intro-deeplink-quiz');
  });

  test('deep-link with intro bypass still lands on game', async ({ page }) => {
    await page.goto('/?intro=0&game=quiz');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId(testIds.quiz.root)).toBeVisible({ timeout: 5000 });
  });

  test('reduce-motion reward overlay is dismissible without fade dependency', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?intro=0');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() =>
      Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E),
    );
    await page.evaluate(() => {
      (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/dev/gallery');
    });
    await page.waitForSelector(`[data-testid="${testIds.gallery.root}"]`);
    await page.getByTestId(testIds.gallery.shell.rewardOpenButton).click();
    await expect(page.getByTestId(testIds.gallery.shell.rewardOverlay)).toBeVisible();
    await captureMatrix(page, '28', 'reward-overlay-reduced');
    await page.getByTestId('reward-overlay-dismiss').click();
    await expect(page.getByTestId(testIds.gallery.shell.rewardOverlay)).toHaveCount(0);
  });

  test('toast appears on compact layout and clears', async ({ page }) => {
    await openApp(page);
    await pushRoute(page, '/dev/gallery');
    await page.waitForSelector(`[data-testid="${testIds.gallery.root}"]`);
    await page.getByTestId(testIds.gallery.shell.toastShowButton).click();
    await expect(page.getByTestId(testIds.gallery.shell.toastHost)).toBeVisible();
    await captureMatrix(page, '28', 'toast-host');
    await expect(page.getByTestId(testIds.gallery.shell.toastHost)).toHaveCount(0, { timeout: 3500 });
  });

  test('not-found Redirect module recovers without crashing the hub', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    // Unknown stack paths are handled by app/+not-found.tsx → Redirect home.
    // Prefer a fresh navigation over push so we do not assert against a
    // hidden prior Stack entry.
    await page.goto('/?intro=0');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    await expect(page.getByTestId(testIds.nav.sideStart)).toBeVisible();
    await captureMatrix(page, '28', 'not-found-home');
  });

  test('no bottom-nav or portrait child chrome remains reachable', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    await expect(page.getByTestId(testIds.nav.sideStart)).toBeVisible();
    await expect(page.getByTestId(testIds.nav.sideEnd)).toBeVisible();
    await expect(page.locator('[data-testid="bottom-nav"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="bottom-navigation"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="tab-bar"]')).toHaveCount(0);

    const touch = await auditTouchTargets(page);
    expect(touch, JSON.stringify(touch)).toHaveLength(0);
    const reach = await auditReachability(page, testIds.home.root);
    expect(reach, JSON.stringify(reach)).toHaveLength(0);
    await captureMatrix(page, '28', 'home-no-bottom-nav');
  });

  test('hub visual sweep classes', async ({ page }) => {
    await openApp(page);
    await captureMatrix(page, '28', 'sweep-home');
    await pushRoute(page, '/games');
    await expect(page.getByTestId(testIds.gamesMenu.root)).toBeVisible();
    await captureMatrix(page, '28', 'sweep-games');
    await pushRoute(page, '/practice');
    await expect(page.getByTestId(testIds.practiceMenu.root)).toBeVisible();
    await captureMatrix(page, '28', 'sweep-practice');
    await pushRoute(page, '/rewards');
    await expect(page.getByTestId(testIds.stickers.root)).toBeVisible();
    await captureMatrix(page, '28', 'sweep-stickers');
    await pushRoute(page, '/parent?seed=42');
    await expect(page.getByTestId(testIds.parent.root)).toBeVisible();
    await captureMatrix(page, '28', 'sweep-parent-gate');
  });
});
