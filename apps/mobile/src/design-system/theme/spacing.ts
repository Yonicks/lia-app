/**
 * index.html 65-68 — Home's spacing rhythm. `homePaddingInline` and
 * `homeGridGap` are responsive (see design-system/responsive/), so they are
 * exposed as a function of DeviceClass rather than a single number.
 *
 * DeviceClass values changed in Phase 17 (docs/migration/phase-17-report.md)
 * from width-only buckets to short-edge-based ones: 'phone'/'largePhone'/
 * 'smallTablet'/'largeTablet' became 'compactPhone'/'phone'/'tablet'/
 * 'largeTablet'. The branches below keep the same spirit (compact devices
 * get tighter spacing) under the new, correctly-classified buckets — a
 * landscape phone (e.g. 844×390) now reaches the `'phone'` branch instead
 * of the tablet one it fell into under the old width-only classifier.
 */
import type { DeviceClass } from '../responsive/breakpoints';

export const homeSectionGap = 28;

export function homePaddingInline(deviceClass: DeviceClass): number {
  if (deviceClass === 'tablet' || deviceClass === 'largeTablet') return 24;
  if (deviceClass === 'phone') return 18;
  return 16;
}

export function homeGridGap(deviceClass: DeviceClass): number {
  return deviceClass === 'compactPhone' ? 12 : 14;
}

/** index.html 83, 97/121 — measured-at-runtime legacy CSS variables.
 *  `barh` is the topbar's minimum height; `tbSideClear` is the widest side
 *  control plus its edge padding, used to keep the centred brand mark clear
 *  of both side controls at any width. `adH` is always 0 here — the legacy
 *  ad banner has no native equivalent and is never built in this migration. */
export const barHeight = 68;
/** Static default when no banner is reserved. Live height lives in adLayout. */
export const adHeight = 0;
/** BottomNavigation item minHeight 48 + paddingBlock 8+8. */
export const tabBarHeight = 64;
export function tbSideClear(deviceClass: DeviceClass): number {
  return deviceClass === 'compactPhone' ? 106 : 104;
}

export const spacing = {
  homeSectionGap,
  homePaddingInline,
  homeGridGap,
  barHeight,
  adHeight,
  tbSideClear,
} as const;
