import { Platform } from 'react-native';

import { storage } from '../services/storage';
import type { TalkiStorage } from '../services/storage/TalkiStorage';

/**
 * Test-only bridge: exposes the real TalkiStorage instance on
 * `window.__talkiStorageE2E` so a Tier 2 Playwright spec can exercise the
 * actual web (IndexedDB) backend through the real Expo web bundle, not just
 * through a vitest mock — see phase-03-plan.md, Tier 2 test plan: "Add one
 * spec that exercises the web storage implementation through the service
 * interface so the abstraction is proven to have at least two working
 * implementations."
 *
 * Web-only and a no-op everywhere else. This is not UI (nothing renders,
 * nothing is user-visible) and Phase 3 builds none — see the standing rule
 * "THE WEB TARGET IS A TEST SURFACE".
 */
declare global {
  interface Window {
    __talkiStorageE2E?: TalkiStorage;
  }
}

export function installE2EStorageBridge(): void {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  window.__talkiStorageE2E = storage;
}
