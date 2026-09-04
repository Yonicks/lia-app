import { defineConfig, devices } from '@playwright/test';

import { SHORT_EDGE_TABLET, shortEdgeOf } from './src/design-system/responsive/breakpoints';
import { VIEWPORTS } from './tests/e2e/viewports';

/* The Expo web port (8081) appears exactly once, here. The legacy dev server
 * owns 8000; the two must never be confused. */
const PORT = 8081;

/* Phase 16 (docs/migration/phase-16-audit.md §2) found the app's own
 * classifier misclassified landscape phones as tablets by using raw width;
 * this file had the identical bug — `isMobile`/`hasTouch` were keyed off
 * `width < 900`, so a 932-wide landscape phone (a real phone, held
 * sideways) got Playwright's desktop/no-touch emulation. Phase 17 fixes
 * both with the same short-edge logic, imported from the one canonical
 * source rather than re-implemented here. */
function isPhoneViewport(width: number, height: number): boolean {
  return shortEdgeOf(width, height) < SHORT_EDGE_TABLET;
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  projects: VIEWPORTS.map(({ name, width, height }) => ({
    name,
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width, height },
      isMobile: isPhoneViewport(width, height),
      hasTouch: isPhoneViewport(width, height),
    },
  })),
  webServer: {
    command: 'npx expo serve --port 8081',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
