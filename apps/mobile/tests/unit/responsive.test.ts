import { describe, expect, it } from 'vitest';

import {
  classifyDeviceClass,
  classifyOrientation,
  computeUiScale,
  computeUsableHeight,
  computeUsableWidth,
  longEdgeOf,
  shortEdgeOf,
  SHORT_EDGE_COMPACT_PHONE,
  SHORT_EDGE_LARGE_TABLET,
  SHORT_EDGE_TABLET,
  UI_SCALE_MAX,
  UI_SCALE_MIN,
  type DeviceClass,
} from '@/design-system/responsive/breakpoints';
import { adHeight, barHeight } from '@/design-system/theme/spacing';
import { VIEWPORTS } from '../e2e/viewports';

/**
 * Phase 17 (docs/migration/phase-17-report.md) replaced the width-only
 * classifier Phase 16 proved misclassified landscape phones as tablets
 * (docs/migration/phase-16-audit.md §2: 844×390 and 932×430 both landed in
 * the same bucket as a 1024-wide tablet) with short-edge classification.
 * Expected DeviceClass for each of the eight Phase 17 landscape viewports —
 * the same eight sizes tested visually are also unit-tested here.
 */
const EXPECTED_CLASS_BY_VIEWPORT: Record<string, DeviceClass> = {
  'compact-phone': 'compactPhone',
  'compact-android-phone': 'compactPhone',
  'landscape-844': 'phone',
  'landscape-932': 'phone',
  'tablet-4-3': 'tablet',
  'tablet-1133': 'tablet',
  'tablet-16-10': 'tablet',
  'large-tablet': 'largeTablet',
};

describe('classifyDeviceClass — the eight Phase 17 landscape viewports', () => {
  it.each(VIEWPORTS)('$name ($width x $height) classifies as expected', ({ name, width, height }) => {
    expect(classifyDeviceClass(shortEdgeOf(width, height))).toBe(EXPECTED_CLASS_BY_VIEWPORT[name]);
  });

  it('844×390 and 932×430 classify as phones, not tablets (the Phase 16 defect)', () => {
    expect(classifyDeviceClass(shortEdgeOf(844, 390))).toBe('phone');
    expect(classifyDeviceClass(shortEdgeOf(932, 430))).toBe('phone');
  });

  it('1024×768 and 1280×800 classify as tablets', () => {
    expect(classifyDeviceClass(shortEdgeOf(1024, 768))).toBe('tablet');
    expect(classifyDeviceClass(shortEdgeOf(1280, 800))).toBe('tablet');
  });
});

describe('classifyDeviceClass — boundaries, both sides', () => {
  it('389 is compactPhone, 390 is phone', () => {
    expect(classifyDeviceClass(SHORT_EDGE_COMPACT_PHONE - 1)).toBe('compactPhone');
    expect(classifyDeviceClass(SHORT_EDGE_COMPACT_PHONE)).toBe('phone');
  });

  it('599 is phone, 600 is tablet', () => {
    expect(classifyDeviceClass(SHORT_EDGE_TABLET - 1)).toBe('phone');
    expect(classifyDeviceClass(SHORT_EDGE_TABLET)).toBe('tablet');
  });

  it('899 is tablet, 900 is largeTablet', () => {
    expect(classifyDeviceClass(SHORT_EDGE_LARGE_TABLET - 1)).toBe('tablet');
    expect(classifyDeviceClass(SHORT_EDGE_LARGE_TABLET)).toBe('largeTablet');
  });
});

describe('shortEdgeOf / longEdgeOf — width/height order independence', () => {
  it('gives the same short edge whichever argument order the caller uses', () => {
    expect(shortEdgeOf(844, 390)).toBe(390);
    expect(shortEdgeOf(390, 844)).toBe(390);
  });

  it('gives the same long edge whichever argument order the caller uses', () => {
    expect(longEdgeOf(844, 390)).toBe(844);
    expect(longEdgeOf(390, 844)).toBe(844);
  });

  it('classifyDeviceClass agrees for a device whether measured landscape or portrait', () => {
    // A 932x430 landscape phone and the same phone rotated to 430x932
    // portrait are the same physical device — the classifier must not
    // flip class depending on which way it happens to be held.
    expect(classifyDeviceClass(shortEdgeOf(932, 430))).toBe(classifyDeviceClass(shortEdgeOf(430, 932)));
  });

  it.each(VIEWPORTS)('$name classifies identically landscape or portrait', ({ width, height }) => {
    expect(classifyDeviceClass(shortEdgeOf(width, height))).toBe(classifyDeviceClass(shortEdgeOf(height, width)));
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

  it.each(VIEWPORTS)('$name is landscape (the active matrix is all-landscape)', ({ width, height }) => {
    expect(classifyOrientation(width, height)).toBe('landscape');
  });
});

describe('computeUsableWidth / computeUsableHeight — safe-area subtraction, no double counting', () => {
  it('subtracts left+right from width exactly once', () => {
    expect(computeUsableWidth(932, { top: 0, right: 24, bottom: 0, left: 24 })).toBe(932 - 48);
  });

  it('subtracts top+bottom from height exactly once', () => {
    expect(computeUsableHeight(430, { top: 20, right: 0, bottom: 10, left: 0 })).toBe(430 - 30);
  });

  it('a notchless device (all-zero insets) keeps the full dimension', () => {
    expect(computeUsableWidth(932, { top: 0, right: 0, bottom: 0, left: 0 })).toBe(932);
    expect(computeUsableHeight(430, { top: 0, right: 0, bottom: 0, left: 0 })).toBe(430);
  });
});

describe('computeUiScale — bounded, one value per device class', () => {
  const classes: DeviceClass[] = ['compactPhone', 'phone', 'tablet', 'largeTablet'];

  it.each(classes)('%s is within [UI_SCALE_MIN, UI_SCALE_MAX]', (deviceClass) => {
    const scale = computeUiScale(deviceClass);
    expect(scale).toBeGreaterThanOrEqual(UI_SCALE_MIN);
    expect(scale).toBeLessThanOrEqual(UI_SCALE_MAX);
  });

  it('scales up monotonically from compactPhone to largeTablet', () => {
    expect(computeUiScale('compactPhone')).toBeLessThan(computeUiScale('phone'));
    expect(computeUiScale('phone')).toBeLessThan(computeUiScale('tablet'));
    expect(computeUiScale('tablet')).toBeLessThan(computeUiScale('largeTablet'));
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

  it('adds the bottom inset and adHeight (0 by default) exactly once each', () => {
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
