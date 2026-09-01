import { defineConfig, devices } from '@playwright/test';

import { VIEWPORTS } from './tests/e2e/viewports';

/* The Expo web port (8081) appears exactly once, here. The legacy dev server
 * owns 8000; the two must never be confused. */
const PORT = 8081;

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
      isMobile: width < 900,
      hasTouch: width < 900,
    },
  })),
  webServer: {
    command: 'npx expo serve --port 8081',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
