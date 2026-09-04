import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeUiScale, computeUsableHeight, computeUsableWidth, type DeviceClass, type EdgeInsets, type Orientation } from './breakpoints';
import { useDevice } from './useDevice';

/**
 * phase-17-plan.md "Required runtime model" — the one canonical landscape
 * metrics API. Everything a component needs to make a responsive decision
 * lives here: raw geometry (`width`/`height`/`shortEdge`/`longEdge`/
 * `aspectRatio`), the centralized device class, OS safe-area insets, and
 * safe-area-subtracted usable geometry. `uiScale` is exposed but not yet
 * consumed by any screen — Phase 17 is infrastructure only.
 *
 * This is a sibling to `useSafeLayout()` (theme/spacing.ts's `barHeight`
 * and the ad-reserved strip), not a replacement for it: `useSafeLayout`
 * composes product chrome (topbar, ad banner) on top of the OS safe area,
 * while `usableWidth`/`usableHeight` here are safe-area-only, independent
 * of any particular screen's chrome.
 */
export interface LandscapeLayout {
  width: number;
  height: number;
  shortEdge: number;
  longEdge: number;
  aspectRatio: number;
  deviceClass: DeviceClass;
  orientation: Orientation;
  safeInsets: EdgeInsets;
  usableWidth: number;
  usableHeight: number;
  uiScale: number;
}

export function useLandscapeLayout(): LandscapeLayout {
  const device = useDevice();
  const insets = useSafeAreaInsets();
  // Physical OS safe-area insets (a notch/home-indicator sits on a physical
  // edge regardless of text direction), mirroring
  // react-native-safe-area-context's own EdgeInsets shape exactly — not an
  // RTL-sensitive layout style prop, so the logical-props lint rule below
  // is disabled deliberately for this one object literal.
  // eslint-disable-next-line no-restricted-syntax
  const safeInsets: EdgeInsets = { top: insets.top, right: insets.right, bottom: insets.bottom, left: insets.left };
  return {
    ...device,
    safeInsets,
    usableWidth: computeUsableWidth(device.width, safeInsets),
    usableHeight: computeUsableHeight(device.height, safeInsets),
    uiScale: computeUiScale(device.deviceClass),
  };
}
