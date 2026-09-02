import type { Page } from '@playwright/test';

import { openApp } from './_helpers';

type RouterBridge = { push: (path: string) => void };

export async function gotoPath(
  page: Page,
  path: string,
  waitTestId: string,
  init?: () => void,
): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __talkiQuizSeed?: number }).__talkiQuizSeed = 42;
  });
  if (init) await page.addInitScript(init);
  await openApp(page);
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(
    (p) => (window as unknown as { __talkiRouterE2E: RouterBridge }).__talkiRouterE2E.push(p),
    path,
  );
  await page.waitForSelector(`[data-testid="${waitTestId}"]`);
}
