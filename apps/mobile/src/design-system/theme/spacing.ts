/**
 * index.html 65-68 — Home's spacing rhythm. `homePaddingInline` and
 * `homeGridGap` are responsive (see design-system/responsive/), so they are
 * exposed as a function of DeviceClass rather than a single number.
 */
import type { DeviceClass } from '../responsive/breakpoints';

export const homeSectionGap = 28;

export function homePaddingInline(deviceClass: DeviceClass): number {
  if (deviceClass === 'smallTablet' || deviceClass === 'largeTablet') return 24;
  if (deviceClass === 'largePhone') return 18;
  return 16;
}

export function homeGridGap(deviceClass: DeviceClass): number {
  return deviceClass === 'phone' ? 12 : 14;
}

/** index.html 83, 97/121 — measured-at-runtime legacy CSS variables.
 *  `barh` is the topbar's minimum height; `tbSideClear` is the widest side
 *  control plus its edge padding, used to keep the centred brand mark clear
 *  of both side controls at any width. `adH` is always 0 here — the legacy
 *  ad banner has no native equivalent and is never built in this migration. */
export const barHeight = 68;
export const adHeight = 0;
export function tbSideClear(deviceClass: DeviceClass): number {
  return deviceClass === 'phone' ? 106 : 104;
}

export const spacing = {
  homeSectionGap,
  homePaddingInline,
  homeGridGap,
  barHeight,
  adHeight,
  tbSideClear,
} as const;
