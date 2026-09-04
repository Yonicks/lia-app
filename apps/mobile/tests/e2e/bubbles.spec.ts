import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  captureMatrix,
  degradeNativeApis,
  openApp,
  speechSpy,
} from './_helpers';

type RouterBridge = { push: (path: string) => void };

async function gotoBubbles(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
  });
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() =>
    (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/bubbles?catId=animals&seed=42'),
  );
  await page.waitForSelector(`[data-testid="${testIds.bubbles.root}"]`);
}

async function freezeBubbles(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __talkiBubblesFreeze?: boolean }).__talkiBubblesFreeze = true;
  });
}

test.describe('Phase 25 bubbles', () => {
  test('bubbles spawn and pop; one speak per pop; screenshot', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoBubbles(page);
    await page.waitForSelector('[data-testid^="bubbles-bubble-"]', { timeout: 4000 });
    // Geometry: spawn sizes stay child-safe; horizontal start keeps the
    // untransformed bubble inside the stage (rise/drift is CSS-animated).
    const geometry = await page.evaluate((stageId) => {
      const stage = document.querySelector(`[data-testid="${stageId}"]`) as HTMLElement | null;
      if (!stage) return { ok: false, reason: 'missing-stage' };
      const sw = stage.getBoundingClientRect().width;
      const bubbles = [...stage.querySelectorAll('[data-testid^="bubbles-bubble-"]')] as HTMLElement[];
      if (!bubbles.length) return { ok: false, reason: 'none' };
      for (const el of bubbles) {
        const size = el.getBoundingClientRect().width;
        if (size < 48) return { ok: false, reason: 'touch' };
        const startPct = parseFloat(getComputedStyle(el).insetInlineStart || getComputedStyle(el).left || '0');
        // insetInlineStart may be px or % — prefer style attribute percent.
        const styleStart = el.style.insetInlineStart || el.style.left || '';
        const pct = styleStart.endsWith('%') ? parseFloat(styleStart) : (startPct / sw) * 100;
        const left = (pct / 100) * sw;
        if (left < -2 || left + size > sw + 4) return { ok: false, reason: 'oob' };
      }
      return { ok: true, reason: 'ok' };
    }, testIds.bubbles.stage);
    expect(geometry.ok, geometry.reason).toBe(true);
    await freezeBubbles(page);
    await page.waitForTimeout(50);
    await captureMatrix(page, '25', 'bubbles-stage');
    await expect(page).toHaveScreenshot({ animations: 'disabled' });
    const before = (await spy.calls()).length;
    await page.locator('[data-testid^="bubbles-bubble-"]').first().click({ force: true });
    await page.waitForTimeout(200);
    const after = await spy.calls();
    expect(after.length).toBe(before + 1);
  });

  test('spawner stops on navigation away', async ({ page }) => {
    await gotoBubbles(page);
    await page.waitForSelector('[data-testid^="bubbles-bubble-"]', { timeout: 4000 });
    await page.getByTestId(testIds.game.headerBack).click();
    await expect(page.getByTestId(testIds.home.root).first()).toBeVisible();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId(testIds.bubbles.root)).toHaveCount(0);
  });

  test('audits and degradeNativeApis', async ({ page }) => {
    await gotoBubbles(page);
    await page.waitForSelector('[data-testid^="bubbles-bubble-"]', { timeout: 4000 });
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);
    await degradeNativeApis(page);
    await gotoBubbles(page);
    await page.waitForSelector('[data-testid^="bubbles-bubble-"]', { timeout: 4000 });
    await page.locator('[data-testid^="bubbles-bubble-"]').first().click({ force: true });
    await expect(page.getByTestId(testIds.bubbles.root)).toBeVisible();
  });
});
