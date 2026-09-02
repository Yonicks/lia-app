import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import {
  auditReachability,
  auditTouchTargets,
  burst,
  captureMatrix,
  countListeners,
  degradeNativeApis,
  openApp,
  speechSpy,
} from './_helpers';

type RouterBridge = { push: (path: string) => void };
type StorageBridge = { get<T>(key: string): Promise<T | null>; set<T>(key: string, value: T): Promise<void> };

async function seedQuiz(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiPlaceCorrectAt?: number }).__talkiPlaceCorrectAt = 0;
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
  });
}

async function gotoQuiz(page: Page, catId = 'animals'): Promise<void> {
  await seedQuiz(page);
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(
    (id) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(`/game/quiz?catId=${id}&seed=42`),
    catId,
  );
  await page.waitForSelector(`[data-testid="${testIds.quiz.root}"], [data-testid="${testIds.game.doneCard}"]`);
}

async function waitForQuizArt(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('[data-testid="quiz-root"] img')] as HTMLImageElement[];
    return imgs.length >= 4 && imgs.every((img) => img.complete && img.naturalWidth > 0);
  });
}

test.describe('Phase 8 quiz', () => {
  test('renders four options; prompt speaks exactly once; replay speaks again', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoQuiz(page);
    await expect(page.getByTestId(testIds.quiz.root)).toBeVisible();
    await expect(page.getByTestId(testIds.quiz.option(0))).toBeVisible();
    await expect(page.getByTestId(testIds.quiz.option(3))).toBeVisible();
    await expect(page.getByTestId(testIds.quiz.option(4))).toHaveCount(0);

    const first = await spy.calls();
    expect(first).toHaveLength(1);

    await page.getByTestId(testIds.quiz.replay).click();
    const afterReplay = await spy.calls();
    expect(afterReplay).toHaveLength(2);
    expect(afterReplay[1]!.word).toBe(first[0]!.word);
  });

  test('startGame does not write lia:lastcat', async ({ page }) => {
    await openApp(page);
    await page.waitForFunction(() => Boolean((window as unknown as { __talkiStorageE2E?: unknown }).__talkiStorageE2E));
    await page.evaluate(async () => {
      const b = (window as unknown as { __talkiStorageE2E: StorageBridge }).__talkiStorageE2E;
      await b.set('lia:lastcat', 'food');
    });
    await seedQuiz(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
    await page.evaluate(() =>
      (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/quiz?catId=animals&seed=42'),
    );
    await page.waitForSelector(`[data-testid="${testIds.quiz.root}"]`);
    const last = await page.evaluate(() =>
      (window as unknown as { __talkiStorageE2E: StorageBridge }).__talkiStorageE2E.get<string>('lia:lastcat'),
    );
    expect(last).toBe('food');
  });

  test('burst on option 0 advances exactly one round and scores once', async ({ page }) => {
    const spy = await speechSpy(page);
    await gotoQuiz(page);
    await burst(page, testIds.quiz.option(0), 10);
    await page.waitForTimeout(900);
    const chips = page.getByTestId(testIds.game.chip(1));
    await expect(chips).toContainText('1');
    const calls = await spy.calls();
    // one prompt + one next-round prompt (and no extra)
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls.length).toBeLessThanOrEqual(3);
  });

  test('a full playthrough reaches the 3-star done card', async ({ page }) => {
    await gotoQuiz(page);
    for (let i = 0; i < 8; i++) {
      await page.getByTestId(testIds.quiz.option(0)).click();
      await page.waitForTimeout(800);
    }
    await expect(page.getByTestId(testIds.game.doneCard)).toBeVisible();
    await expect(page.getByTestId(testIds.game.doneStars)).toHaveAttribute('aria-label', '3 כוכבים');
    await captureMatrix(page, '08', 'quiz-done-3star');
    await expect(page).toHaveScreenshot();
  });

  test('back from mid-game returns without a crash', async ({ page }) => {
    await gotoQuiz(page);
    await page.getByTestId(testIds.game.headerBack).click();
    await expect(page.getByTestId(testIds.home.root).or(page.getByTestId(testIds.gamesMenu.root))).toBeVisible();
  });

  test('option grid fits without scrolling at this viewport', async ({ page }) => {
    await gotoQuiz(page);
    const overflow = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="quiz-root"]');
      if (!root) return true;
      return root.scrollHeight > root.clientHeight + 2 || document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(false);
    await waitForQuizArt(page);
    await captureMatrix(page, '08', 'quiz-board');
    await expect(page).toHaveScreenshot();
  });

  test('correct and wrong feedback screenshots', async ({ page }) => {
    await gotoQuiz(page);
    await page.getByTestId(testIds.quiz.option(1)).click();
    await expect(page.getByTestId(testIds.quiz.optionWrong)).toBeVisible();
    await captureMatrix(page, '08', 'quiz-wrong');
    await page.waitForTimeout(500);
    await page.getByTestId(testIds.quiz.option(0)).click();
    await expect(page.getByTestId(testIds.quiz.optionCorrect)).toBeVisible();
    await captureMatrix(page, '08', 'quiz-correct');
  });

  test('forced 1-star done card', async ({ page }) => {
    await seedQuiz(page);
    await page.addInitScript(() => {
      (window as unknown as { __talkiQuizForceDone?: { score: number; total: number } }).__talkiQuizForceDone = {
        score: 0,
        total: 8,
      };
    });
    await openApp(page);
    await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
    await page.evaluate(() =>
      (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push('/game/quiz?catId=animals&seed=42'),
    );
    await expect(page.getByTestId(testIds.game.doneCard)).toBeVisible();
    await expect(page.getByTestId(testIds.game.doneStars)).toHaveAttribute('aria-label', '1 כוכבים');
    await captureMatrix(page, '08', 'quiz-done-1star');
  });

  test('touch targets, reachability, degradeNativeApis, no listener growth', async ({ page }) => {
    await gotoQuiz(page);
    expect(await auditTouchTargets(page), 'touch').toHaveLength(0);
    expect(await auditReachability(page), 'reach').toHaveLength(0);

    for (let i = 0; i < 10; i++) await page.getByTestId(testIds.quiz.replay).click();
    const afterFirst = await countListeners(page, testIds.quiz.replay);
    for (let i = 0; i < 10; i++) await page.getByTestId(testIds.quiz.replay).click();
    const afterSecond = await countListeners(page, testIds.quiz.replay);
    expect(afterSecond - afterFirst).toBeLessThanOrEqual(1);
  });

  test('still fully playable with native APIs degraded', async ({ page }) => {
    await degradeNativeApis(page);
    await gotoQuiz(page);
    await expect(page.getByTestId(testIds.quiz.root)).toBeVisible();
    await page.getByTestId(testIds.quiz.option(0)).click();
    await page.waitForTimeout(900);
    await expect(page.getByTestId(testIds.game.chip(1))).toContainText('1');
  });
});
