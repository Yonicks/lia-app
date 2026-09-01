import { Platform } from 'react-native';

import { router } from 'expo-router';

/**
 * Test-only bridge: exposes expo-router's imperative `router.push` on
 * `window` so a Playwright spec can navigate client-side to a route that
 * has no on-screen link — most notably `app/dev/audio-lab.tsx`, which is
 * deliberately unreachable from any real navigation
 * (phase-04-plan.md, "A diagnostic screen, deliberately unreachable").
 *
 * Why this exists at all, not just `page.goto('/dev/audio-lab')`: the
 * Expo web target here builds with the default 'single' (SPA) output —
 * `expo export --platform web` produces exactly one `index.html` plus one
 * JS bundle, with all routing happening client-side. `expo serve`
 * (playwright.config.ts's `webServer`) is a plain static file server with
 * no SPA history-API fallback, confirmed directly: `curl
 * localhost:PORT/dev/audio-lab` 404s, because no such file exists on disk
 * and nothing ever hands the request to the client bundle. Switching to
 * expo-router's 'static' output (one pre-rendered HTML file per route) was
 * tried and reverted — it Node-server-renders every route at export time,
 * which crashes on `webAudioEngine.ts`'s module-level `new window.Audio()`
 * (there is no `window` in that server-rendering pass) and would require
 * every service singleton in this codebase to become SSR-safe, which is a
 * far bigger change than one dev-only diagnostic screen justifies. Loading
 * `/` for real HTTP once, then asking the already-running client bundle to
 * navigate itself, sidesteps the file-serving question entirely.
 *
 * Web-only and a no-op everywhere else, same shape as e2eStorageBridge.ts.
 */
declare global {
  interface Window {
    __talkiRouterE2E?: { push: (path: string) => void };
  }
}

export function installE2ERouterBridge(): void {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  window.__talkiRouterE2E = {
    push: (path: string) => router.push(path as Parameters<typeof router.push>[0]),
  };
}
