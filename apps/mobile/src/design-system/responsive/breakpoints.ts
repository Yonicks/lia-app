/**
 * The one place that answers "what size is this device and which way is it
 * facing" — see phase-05-plan.md "Responsive is centralised, not
 * per-component". No component may read `Dimensions` directly; everything
 * goes through `useDevice()` in ./useDevice.ts.
 *
 * The legacy stylesheet only ever branches at two widths, 430 and 768
 * (index.html 67-68, and every `@media(min-width:...)` / `@media(max-width:...)`
 * in the file uses one of those two numbers). A third break at 1100 exists
 * for `main`'s max-width (index.html 130) and is reused here as the
 * smallTablet/largeTablet boundary so DeviceClass has four distinct, ordered
 * buckets instead of inventing an unsourced number.
 */
export type DeviceClass = 'phone' | 'largePhone' | 'smallTablet' | 'largeTablet';
export type Orientation = 'portrait' | 'landscape';

/** index.html 67-68. */
export const BREAKPOINT_LARGE_PHONE = 430;
export const BREAKPOINT_TABLET = 768;
/** index.html 130 (`@media(min-width:1100px)`), reused as the
 *  smallTablet/largeTablet boundary. */
export const BREAKPOINT_LARGE_TABLET = 1100;

export function classifyDevice(width: number): DeviceClass {
  if (width >= BREAKPOINT_LARGE_TABLET) return 'largeTablet';
  if (width >= BREAKPOINT_TABLET) return 'smallTablet';
  if (width >= BREAKPOINT_LARGE_PHONE) return 'largePhone';
  return 'phone';
}

export function classifyOrientation(width: number, height: number): Orientation {
  return width >= height ? 'landscape' : 'portrait';
}
