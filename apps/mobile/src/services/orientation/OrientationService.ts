export type CurrentOrientation = 'portrait' | 'landscape';

/**
 * The one interface every screen is allowed to touch for orientation. No
 * screen calls `expo-screen-orientation` directly.
 *
 * Phase 17 (docs/migration/phase-17-report.md) replaced the Phase 4
 * per-route policy (`intro`/`home`/`category` responsive, `games`/
 * `practice` landscape) with a single app-wide contract: the whole child
 * and parent product is landscape-only now (AGENTS.md "LANDSCAPE REDESIGN
 * NON-NEGOTIABLES" #1), so there is no longer a route-dependent decision
 * to centralize — only one to apply, once, at boot.
 */
export interface OrientationService {
  /** Locks the app to landscape. The only method that ever calls
   *  `lockAsync`. Called once at boot (`app/_layout.tsx`); no per-screen
   *  or per-session call site exists or is needed. */
  lockLandscape(): Promise<void>;
  /** Releases any lock, returning to the platform default. No production
   *  call site — kept for the dev-only orientation lab
   *  (`app/dev/audio-lab.tsx`) and tests. */
  unlock(): Promise<void>;
  /** Best-effort read of the orientation currently in effect. */
  current(): Promise<CurrentOrientation>;
}

/**
 * phase-17-plan.md "Preserve a safe fallback if native orientation APIs
 * are unavailable during tests/web export." `expo-screen-orientation`
 * ships a web shim backed by the browser's own, much more limited, Screen
 * Orientation API — some browsers reject `lock()` outright (no touch
 * hardware, insufficient permissions, desktop Chrome), and Expo web
 * export/tests never has that native capability at all. This wrapper
 * keeps every orientation call a settled promise, so a fire-and-forget
 * `void orientationService.lockLandscape()` at boot can never surface an
 * unhandled rejection.
 */
export async function withOrientationFallback<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}
