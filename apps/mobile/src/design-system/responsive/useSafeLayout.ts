import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { composeContentBottom } from '@/services/ads/adLayout';
import { useReservedAdHeight } from '@/services/ads/useReservedAdHeight';

import { barHeight, tabBarHeight } from '../theme/spacing';

export interface SafeLayout {
  /** Raw OS safe-area insets (notch, home indicator, status bar). */
  insetTop: number;
  insetBottom: number;
  /** Content should start below the top bar, which itself already sits below
   *  the safe area — this is `insetTop + barHeight`, never
   *  `insetTop + barHeight + insetTop` (see "without double counting" in the
   *  Tier 1 responsive.test.ts requirement). */
  contentTop: number;
  /** Content should end above the reserved ad slot plus the bottom safe
   *  area. Tab-bar height is NOT added here — the navigator already owns
   *  that strip, so counting it again would double-count. */
  contentBottom: number;
  adReserved: number;
  tabBarHeight: number;
}

/**
 * Composes safe-area insets with the topbar and ad-banner heights exactly
 * once each. Legacy does the equivalent with runtime-measured `--barh` and
 * `--ad-h` CSS variables layered under `env(safe-area-inset-*)`
 * (index.html 80, 83, 127-129). Every screen calls this instead of reading
 * insets and `barHeight`/`adHeight` separately, so nobody can accidentally
 * add the top inset in twice.
 */
export function useSafeLayout(): SafeLayout {
  const insets = useSafeAreaInsets();
  const adReserved = useReservedAdHeight();
  return {
    insetTop: insets.top,
    insetBottom: insets.bottom,
    contentTop: insets.top + barHeight,
    contentBottom: composeContentBottom(insets.bottom, 0, adReserved),
    adReserved,
    tabBarHeight,
  };
}
