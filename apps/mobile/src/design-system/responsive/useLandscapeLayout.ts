import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReservedAdHeight } from '@/services/ads/useReservedAdHeight';

import { computeUiScale, computeUsableHeight, computeUsableWidth, type DeviceClass, type EdgeInsets, type Orientation } from './breakpoints';
import { useDevice } from './useDevice';

/**
 * phase-17-plan.md "Required runtime model" — the one canonical landscape
 * metrics API. Everything a component needs to make a responsive decision
 * lives here: raw geometry (`width`/`height`/`shortEdge`/`longEdge`/
 * `aspectRatio`), the centralized device class, OS safe-area insets, and
 * usable geometry. `uiScale` is exposed but not yet consumed by any screen
 * — Phase 17 is infrastructure only.
 *
 * `usableHeight` also subtracts the live ad-reserved height (0 on
 * ad-ineligible routes — see `ad-placement-policy.md`). Screens render as a
 * flex sibling of `<AdBanner/>` (`app/_layout.tsx`), so on an eligible route
 * the OS genuinely gives every screen less height than the raw window once
 * a real banner has loaded — `useWindowDimensions()` (via `useDevice()`)
 * never reflects that shrink. Before this, every ad-eligible hub sized
 * itself off the full window and only overflowed once a real device banner
 * claimed its share (never visible on web, where `AdBanner.web.tsx` never
 * mounts a banner outside test injection) — see Home hero mascot/panel
 * overlap found testing on a real Android emulator.
 *
 * This still composes with `useSafeLayout()` (theme/spacing.ts's
 * `barHeight` and `contentBottom`), which is unaffected: that hook composes
 * product chrome (topbar + ad) on top of the OS safe area for callers that
 * need an explicit content boundary, while `usableHeight` here is the one
 * general-purpose "how much vertical room do I actually have" answer.
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
  const adReserved = useReservedAdHeight();
  return {
    ...device,
    safeInsets,
    usableWidth: computeUsableWidth(device.width, safeInsets),
    usableHeight: Math.max(0, computeUsableHeight(device.height, safeInsets) - adReserved),
    uiScale: computeUiScale(device.deviceClass),
  };
}
