import { Platform } from 'react-native';

import { useProgressStore } from '../state/progressStore';
import { useSettingsStore } from '../state/settingsStore';

/**
 * Test-only bridge: lets a Playwright spec force the two Zustand stores
 * (progressStore.ts, settingsStore.ts) to re-read their already-seeded
 * storage values without a full page reload. A reload works for seeding
 * before Home ('/'), but `expo serve`'s static file server has no SPA
 * fallback for any nested route (see e2eRouterBridge.ts) — a reload while
 * on `/category/animals` 404s. A live rehydrate sidesteps that for specs
 * that need to change settings/progress mid-flow on a non-root screen.
 */
declare global {
  interface Window {
    __talkiStoresE2E?: { rehydrate: () => Promise<void> };
  }
}

export function installE2EStoreBridge(): void {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  window.__talkiStoresE2E = {
    rehydrate: async () => {
      await Promise.all([useProgressStore.getState().hydrate(), useSettingsStore.getState().hydrate()]);
    },
  };
}
