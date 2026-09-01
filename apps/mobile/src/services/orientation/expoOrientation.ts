import * as ScreenOrientation from 'expo-screen-orientation';

import type { CurrentOrientation, OrientationService } from './OrientationService';
import { policyFor, type RouteKind } from './policy';

/**
 * The one and only caller of `expo-screen-orientation`'s `lockAsync` /
 * `unlockAsync` in the whole app. `expo-screen-orientation` ships a web
 * shim (browsers' own, much more limited, Screen Orientation API), so this
 * single implementation is safe to use on every platform Metro bundles for
 * — unlike `expo-sqlite`, there is no wasm-asset problem that forces a
 * native/web file split here (see phase-03-report.md's "Deviations" §1 for
 * why that split existed for storage).
 *
 * iPad multitasking note (phase-04-plan.md "iPad needs specific
 * attention"): when an iPad app supports Split View / Slide Over, iOS may
 * refuse a orientation lock outright — `lockAsync` still resolves (it does
 * not throw), but the device may simply not rotate. That is a Tier-3,
 * device-only fact; see phase-04-native-report.md for what this
 * environment could and could not verify.
 */
class ExpoOrientationService implements OrientationService {
  async applyFor(route: RouteKind): Promise<void> {
    const value = policyFor(route);
    if (value === 'landscape') {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      await ScreenOrientation.unlockAsync();
    }
  }

  async unlock(): Promise<void> {
    await ScreenOrientation.unlockAsync();
  }

  async current(): Promise<CurrentOrientation> {
    const o = await ScreenOrientation.getOrientationAsync();
    if (
      o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
      o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
    ) {
      return 'landscape';
    }
    return 'portrait';
  }
}

export const orientationService: OrientationService = new ExpoOrientationService();
