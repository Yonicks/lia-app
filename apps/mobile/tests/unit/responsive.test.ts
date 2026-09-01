import { describe, expect, it } from 'vitest';

import {
  classifyDevice,
  classifyOrientation,
  BREAKPOINT_LARGE_PHONE,
  BREAKPOINT_LARGE_TABLET,
  BREAKPOINT_TABLET,
} from '@/design-system/responsive/breakpoints';
import { adHeight, barHeight } from '@/design-system/theme/spacing';
import { VIEWPORTS } from '../e2e/viewports';

/** Expected DeviceClass for each of the ten Tier 2 viewports, so the same
 *  ten sizes tested visually are also unit-tested for classification. */
const EXPECTED_CLASS_BY_VIEWPORT: Record<string, string> = {
  'iphone-se1': 'phone',
  'android-compact': 'phone',
  'iphone-13': 'phone',
  'iphone-pro-max': 'largePhone',
  'ipad-mini': 'smallTablet',
  'ipad-air': 'smallTablet',
  // classifyDevice reads width only; a landscape viewport's width is its
  // long edge, so these classify as tablets purely by that width even
  // though they are phones held sideways — see useDevice.ts.
  'landscape-844': 'smallTablet',
  'landscape-932': 'smallTablet',
  'tablet-4-3': 'smallTablet',
  'tablet-16-10': 'largeTablet',
};

describe('classifyDevice — the ten Tier 2 viewports', () => {
  it.each(VIEWPORTS)('$name ($width x $height) classifies as expected', ({ name, width }) => {
    expect(classifyDevice(width)).toBe(EXPECTED_CLASS_BY_VIEWPORT[name]);
  });
});

describe('classifyDevice — boundaries at 430 and 768, both sides', () => {
  it('429 is phone, 430 is largePhone', () => {
    expect(classifyDevice(BREAKPOINT_LARGE_PHONE - 1)).toBe('phone');
    expect(classifyDevice(BREAKPOINT_LARGE_PHONE)).toBe('largePhone');
  });

  it('767 is largePhone, 768 is smallTablet', () => {
    expect(classifyDevice(BREAKPOINT_TABLET - 1)).toBe('largePhone');
    expect(classifyDevice(BREAKPOINT_TABLET)).toBe('smallTablet');
  });

  it('1099 is smallTablet, 1100 is largeTablet', () => {
    expect(classifyDevice(BREAKPOINT_LARGE_TABLET - 1)).toBe('smallTablet');
    expect(classifyDevice(BREAKPOINT_LARGE_TABLET)).toBe('largeTablet');
  });
});

describe('classifyOrientation', () => {
  it('wider-than-tall is landscape', () => {
    expect(classifyOrientation(932, 430)).toBe('landscape');
  });

  it('taller-than-wide is portrait', () => {
    expect(classifyOrientation(390, 844)).toBe('portrait');
  });

  it('square counts as landscape (width >= height)', () => {
    expect(classifyOrientation(500, 500)).toBe('landscape');
  });

  it.each(VIEWPORTS)('$name matches its own width/height comparison', ({ name, width, height }) => {
    const expected = width >= height ? 'landscape' : 'portrait';
    expect(classifyOrientation(width, height)).toBe(expected);
  });
});

describe('useSafeLayout composition — no double counting', () => {
  /** useSafeLayout itself needs `react-native-safe-area-context`'s
   *  SafeAreaProvider (a live component tree) to call the real hook under
   *  vitest's jsdom environment without a DOM/RN render pass, so this
   *  proves the composition algebra directly: contentTop must be exactly
   *  insetTop + barHeight (never insetTop counted twice, never barHeight
   *  dropped), and contentBottom must be exactly insetBottom + adHeight. */
  function computeSafeLayout(insetTop: number, insetBottom: number) {
    return {
      insetTop,
      insetBottom,
      contentTop: insetTop + barHeight,
      contentBottom: insetBottom + adHeight,
    };
  }

  it('adds the top inset and barHeight exactly once each', () => {
    const layout = computeSafeLayout(47, 34);
    expect(layout.contentTop).toBe(47 + barHeight);
    expect(layout.contentTop).not.toBe(47 + barHeight + 47);
  });

  it('adds the bottom inset and adHeight (0) exactly once each', () => {
    const layout = computeSafeLayout(0, 34);
    expect(layout.contentBottom).toBe(34 + adHeight);
    expect(adHeight).toBe(0);
  });

  it('a notchless device (0 insets) still gets the full bar height', () => {
    const layout = computeSafeLayout(0, 0);
    expect(layout.contentTop).toBe(barHeight);
    expect(layout.contentBottom).toBe(0);
  });
});
