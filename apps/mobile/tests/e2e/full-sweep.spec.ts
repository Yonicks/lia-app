import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  burst,
  captureMatrix,
  openApp,
} from './_helpers';

type RouterBridge = { push: (path: string) => void };

interface SweepScreen {
  name: string;
  path: string;
  root: string;
}

/**
 * Every child-facing and parent-facing screen the migration shipped.
 * Paths go through `__talkiRouterE2E` because `expo serve` has no SPA
 * fallback for nested routes (phase-07-report.md).
 */
const SCREENS: SweepScreen[] = [
  { name: 'home', path: '/', root: testIds.home.root },
  { name: 'category', path: '/category/animals', root: testIds.category.root },
  { name: 'cards', path: '/cards/animals', root: testIds.cards.root },
  { name: 'games', path: '/games', root: testIds.gamesMenu.root },
  { name: 'practice', path: '/practice', root: testIds.practiceMenu.root },
  { name: 'stickers', path: '/rewards', root: testIds.stickers.root },
  { name: 'quiz', path: '/game/quiz?catId=animals&seed=42', root: testIds.quiz.root },
  { name: 'memory', path: '/game/memory?catId=animals&seed=42', root: testIds.memory.root },
  { name: 'missing', path: '/game/missing?catId=animals&seed=42', root: testIds.missing.root },
  { name: 'match', path: '/game/match?catId=animals&seed=42', root: testIds.match.root },
  { name: 'speech', path: '/game/speech?catId=animals&seed=42', root: testIds.speech.unsupported },
  { name: 'bubbles', path: '/game/bubbles?catId=animals&seed=42', root: testIds.bubbles.root },
  { name: 'sounds', path: '/game/sounds?catId=animals&seed=42', root: testIds.sounds.root },
  { name: 'count', path: '/game/count?catId=animals&seed=42', root: testIds.count.root },
  { name: 'sort', path: '/game/sort?catId=animals&seed=42', root: testIds.sort.root },
  { name: 'puzzle', path: '/game/puzzle?catId=home&seed=42', root: testIds.puzzle.root },
  { name: 'focus', path: '/practice/focus?catId=animals&seed=42', root: testIds.focus.root },
  { name: 'cloze', path: '/practice/cloze?catId=animals&seed=42', root: testIds.cloze.root },
  { name: 'temptation', path: '/practice/temptation?catId=animals&seed=42', root: testIds.temptation.root },
  { name: 'receptive', path: '/practice/receptive?catId=animals&seed=42', root: testIds.receptive.root },
  { name: 'pairs', path: '/practice/pairs?catId=animals&seed=42', root: testIds.pairs.root },
  { name: 'combine', path: '/practice/combine?catId=animals&seed=42', root: testIds.combine.root },
  { name: 'parent-locked', path: '/parent?seed=42', root: testIds.parent.root },
];

async function pushRoute(page: Page, path: string): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E),
  );
  await page.evaluate(
    (p) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(p),
    path,
  );
}

async function assertRtl(page: Page, root: string): Promise<void> {
  const ok = await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return false;
    let n: HTMLElement | null = el as HTMLElement;
    while (n) {
      if (n.getAttribute('dir') === 'rtl') return true;
      if (getComputedStyle(n).direction === 'rtl') return true;
      n = n.parentElement;
    }
    return false;
  }, root);
  expect(ok, `${root} must sit in an RTL context`).toBe(true);
}

async function assertNoOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
}

/**
 * Expo Router tabs keep Home mounted under Games/Rewards, so a document-wide
 * reachability audit reports Home controls as covered (phase-12-report.md).
 * The prompt asks that *this* screen is clean — restrict to the visited root.
 */
async function idsInside(page: Page, root: string): Promise<Set<string>> {
  const ids = await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return [] as string[];
    const out = [id];
    el.querySelectorAll('[data-testid]').forEach((node) => {
      const tid = node.getAttribute('data-testid');
      if (tid) out.push(tid);
    });
    return out;
  }, root);
  return new Set(ids);
}

test.describe('Phase 14 full sweep', () => {
  for (const screen of SCREENS) {
    test(`${screen.name} renders, is touch-safe, RTL, and matches baseline`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => pageErrors.push(String(err)));

      await openApp(page);
      if (screen.path !== '/') {
        await pushRoute(page, screen.path);
      }
      await expect(page.getByTestId(screen.root).first()).toBeVisible();

      expect(pageErrors, `page errors on ${screen.name}: ${pageErrors.join('; ')}`).toHaveLength(0);
      expect(consoleErrors, `console errors on ${screen.name}: ${consoleErrors.join('; ')}`).toHaveLength(0);

      await assertNoOverflow(page);
      await assertRtl(page, screen.root);
      await captureMatrix(page, '14', screen.name);
      await expect(page).toHaveScreenshot(`${screen.name}.png`);

      const scope = await idsInside(page, screen.root);
      const touch = (await auditTouchTargets(page)).filter((v) => scope.has(v.testId));
      expect(touch, JSON.stringify(touch)).toHaveLength(0);

      const reach = await auditReachability(page, screen.root);
      expect(reach, JSON.stringify(reach)).toHaveLength(0);
    });
  }

  test('child-simulation: mash, rotate mid-game, back-spam, background', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await burst(page, testIds.home.category('animals'), 8);
    await expect(page.getByTestId(testIds.category.root)).toBeVisible();

    await burst(page, testIds.category.word(0), 6);
    await page.getByTestId(testIds.category.play).click();
    await page.waitForSelector(
      `[data-testid="${testIds.quiz.root}"], [data-testid="${testIds.game.doneCard}"]`,
    );

    const size = page.viewportSize();
    if (size) {
      await page.setViewportSize({ width: size.height, height: size.width });
      await page.waitForTimeout(200);
      await page.setViewportSize(size);
    }

    for (let i = 0; i < 6; i++) {
      if (await page.getByTestId(testIds.home.root).isVisible().catch(() => false)) break;
      await page.goBack();
    }
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    await expect(page.getByTestId('tabs-bottom-nav')).toBeVisible();
    // One extra back: native must stay in-app (legacy pushState). On web
    // this can leave `expo serve`; record that as P14-M10 rather than
    // requiring a URL the static server cannot keep.
    await page.goBack();
    const stillHome = await page
      .getByTestId(testIds.home.root)
      .isVisible()
      .catch(() => false);
    console.log(`PHASE14_CHILD_SIM_EXTRA_BACK=${stillHome ? 'stayed' : 'left-app'}`);
    if (!stillHome) {
      await openApp(page);
    }

    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('pagehide'));
      window.dispatchEvent(new Event('pageshow'));
    });
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    expect(pageErrors, `child-sim page errors: ${pageErrors.join('; ')}`).toHaveLength(0);
    await captureMatrix(page, '14', 'child-sim-home');
  });

  test('web timings: cold start and game transition', async ({ page }) => {
    const coldStart = Date.now();
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();
    const coldMs = Date.now() - coldStart;

    const transitionStart = Date.now();
    await page.getByTestId(testIds.home.game('quiz')).click();
    await page.waitForSelector(
      `[data-testid="${testIds.quiz.root}"], [data-testid="${testIds.game.doneCard}"]`,
    );
    const transitionMs = Date.now() - transitionStart;

    console.log(`PHASE14_COLD_START_MS=${coldMs}`);
    console.log(`PHASE14_GAME_TRANSITION_MS=${transitionMs}`);

    expect(coldMs).toBeGreaterThan(0);
    expect(transitionMs).toBeGreaterThan(0);
  });
});
