import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { auditReachability, auditTouchTargets, captureMatrix } from './_helpers';

const GROUPS = ['typography', 'buttons', 'cards', 'progress', 'shell', 'colors'] as const;

/**
 * Navigates to the unlinked `/dev/gallery` route client-side, via
 * `e2eRouterBridge.ts` — same technique as `audio-lab.spec.ts`'s
 * `gotoAudioLab`, for the identical reason (`expo serve`'s static file
 * server has no SPA fallback for a direct `page.goto()` to a nested path).
 */
async function gotoGallery(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() => {
    (window as unknown as { __talkiRouterE2E: { push: (path: string) => void } }).__talkiRouterE2E.push(
      '/dev/gallery'
    );
  });
  await page.waitForSelector(`[data-testid="${testIds.gallery.root}"]`);
}

test.describe('Phase 5 component gallery', () => {
  test('renders every primitive and shell component in every documented state, clean of console/audit errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await gotoGallery(page);

    for (const group of GROUPS) {
      await expect(page.getByTestId(testIds.gallery.group(group))).toBeVisible();
    }

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);

    const touchViolations = await auditTouchTargets(page);
    expect(touchViolations, JSON.stringify(touchViolations)).toHaveLength(0);

    const reachabilityViolations = await auditReachability(page);
    expect(reachabilityViolations, JSON.stringify(reachabilityViolations)).toHaveLength(0);
  });

  test('Hebrew sample text lays out right to left', async ({ page }) => {
    await gotoGallery(page);

    const firstCharBox = await page.getByTestId(testIds.gallery.typography.rtlFirstChar).boundingBox();
    const restBox = await page.getByTestId(testIds.gallery.typography.rtlRest).boundingBox();
    expect(firstCharBox).not.toBeNull();
    expect(restBox).not.toBeNull();

    // The logical-first character ('ש') is the first DOM child inside a
    // `flexDirection: 'row'` container; under the app-wide `dir="rtl"` set
    // by TalkiScreen, CSS resolves `row` against the RTL inline axis, so the
    // first child renders visually furthest toward the *right* — i.e. at
    // the reading start for Hebrew. A first-DOM-child that is NOT furthest
    // right would mean the RTL context failed to apply.
    expect(firstCharBox!.x).toBeGreaterThan(restBox!.x);
  });

  test('the resolved font family is Assistant or Rubik, not a system fallback', async ({ page }) => {
    await gotoGallery(page);

    const bodyFont = await page
      .getByTestId(testIds.gallery.typography.fontProbeBody)
      .evaluate((el) => getComputedStyle(el).fontFamily);
    const headingFont = await page
      .getByTestId(testIds.gallery.typography.fontProbeHeading)
      .evaluate((el) => getComputedStyle(el).fontFamily);

    expect(bodyFont).toContain('Assistant_400Regular');
    expect(headingFont).toContain('Rubik_700Bold');
    // A silent fallback never resolves to one of our loaded family names —
    // asserting the negative catches a fallback that happens to also
    // contain a substring match some other way.
    expect(bodyFont.toLowerCase()).not.toContain('system-ui');
    expect(bodyFont.toLowerCase()).not.toContain('arial');
    expect(headingFont.toLowerCase()).not.toContain('system-ui');
    expect(headingFont.toLowerCase()).not.toContain('arial');
  });

  for (const group of GROUPS) {
    test(`captures the ${group} group baseline`, async ({ page }) => {
      await gotoGallery(page);
      const locator = page.getByTestId(testIds.gallery.group(group));
      await expect(locator).toHaveScreenshot(`gallery-${group}.png`);
      await captureMatrix(page, '05', `gallery-${group}`);
    });
  }
});
