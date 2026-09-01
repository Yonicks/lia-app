import type { RouteKind } from './policy';

export type CurrentOrientation = 'portrait' | 'landscape';

/**
 * The one interface every screen is allowed to touch for orientation.
 * No screen calls `expo-screen-orientation` directly — see policy.ts for
 * why, and phase-04-plan.md "Orientation is centralised policy".
 */
export interface OrientationService {
  /** Looks up `route` in the centralised policy and applies the resulting
   *  lock (or unlock, for 'responsive'). The only method that ever calls
   *  `expo-screen-orientation`'s `lockAsync`/`unlockAsync`. */
  applyFor(route: RouteKind): Promise<void>;
  /** Releases any lock, returning to the platform default (responsive). */
  unlock(): Promise<void>;
  /** Best-effort read of the orientation currently in effect. */
  current(): Promise<CurrentOrientation>;
}

export type { RouteKind, OrientationPolicyValue } from './policy';
export { orientationPolicy, policyFor } from './policy';
