/**
 * The one place that answers "what size is this device" — see
 * phase-05-plan.md "Responsive is centralised, not per-component" and
 * phase-17-plan.md "Landscape Runtime and Responsive Foundation". No
 * component may read `Dimensions` directly; everything goes through
 * `useDevice()` in ./useDevice.ts.
 *
 * Phase 16's audit (docs/migration/phase-16-audit.md §2) proved the prior
 * width-only classifier misclassified real landscape phones as tablets:
 * 844×390 and 932×430 both landed in the same bucket as a 1024-wide
 * tablet, purely because a landscape phone's *width* is its long edge.
 * Classification here is on the SHORT edge instead — the axis that stays
 * stable whichever way the device is held — so a landscape phone and the
 * same phone in portrait classify identically (see `classifyDeviceClass`'s
 * width/height order independence, exercised by responsive.test.ts).
 */
export type DeviceClass = 'compactPhone' | 'phone' | 'tablet' | 'largeTablet';
export type Orientation = 'portrait' | 'landscape';

/** phase-17-plan.md "Provisional device classes" — short-edge boundaries. */
export const SHORT_EDGE_COMPACT_PHONE = 390;
export const SHORT_EDGE_TABLET = 600;
export const SHORT_EDGE_LARGE_TABLET = 900;

export function shortEdgeOf(width: number, height: number): number {
  return Math.min(width, height);
}

export function longEdgeOf(width: number, height: number): number {
  return Math.max(width, height);
}

/** Classifies on the short edge alone, so callers must resolve
 *  `shortEdgeOf(width, height)` first — this keeps the function agnostic to
 *  which of width/height happens to be larger right now. */
export function classifyDeviceClass(shortEdge: number): DeviceClass {
  if (shortEdge < SHORT_EDGE_COMPACT_PHONE) return 'compactPhone';
  if (shortEdge < SHORT_EDGE_TABLET) return 'phone';
  if (shortEdge < SHORT_EDGE_LARGE_TABLET) return 'tablet';
  return 'largeTablet';
}

export function classifyOrientation(width: number, height: number): Orientation {
  return width >= height ? 'landscape' : 'portrait';
}

/** Bounded per phase-17-plan.md "`uiScale` must be bounded; do not
 *  uniformly shrink the entire app to make content fit." Not consumed by
 *  any screen yet — Phase 17 is infrastructure only; a later phase decides
 *  where to apply it. */
export const UI_SCALE_MIN = 0.85;
export const UI_SCALE_MAX = 1.15;

const RAW_UI_SCALE: Record<DeviceClass, number> = {
  compactPhone: 0.9,
  phone: 1,
  tablet: 1.08,
  largeTablet: 1.15,
};

export function computeUiScale(deviceClass: DeviceClass): number {
  return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, RAW_UI_SCALE[deviceClass]));
}

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Safe-area-only subtraction — screen minus OS safe-area insets. Chrome
 *  that is product-specific (topbar height, ad-reserved height) is a
 *  separate composition layer; see `useSafeLayout.ts`'s `contentTop`/
 *  `contentBottom`, which this function does not duplicate. */
export function computeUsableWidth(width: number, insets: EdgeInsets): number {
  return width - insets.left - insets.right;
}

export function computeUsableHeight(height: number, insets: EdgeInsets): number {
  return height - insets.top - insets.bottom;
}
