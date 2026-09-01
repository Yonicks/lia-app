/**
 * The ten-viewport matrix, shared between playwright.config.ts (which needs
 * it to declare projects) and _helpers.ts (which needs it for captureMatrix).
 * The first eight are copied verbatim from DEVICES in
 * tests/interaction_suite.py so mobile results stay comparable with legacy.
 * The last two are new: games are landscape in the native app and the legacy
 * matrix has no landscape tablet.
 */
export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export const VIEWPORTS: Viewport[] = [
  { name: 'iphone-se1', width: 320, height: 568 },
  { name: 'android-compact', width: 360, height: 800 },
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'iphone-pro-max', width: 430, height: 932 },
  { name: 'ipad-mini', width: 768, height: 1024 },
  { name: 'ipad-air', width: 834, height: 1112 },
  { name: 'landscape-844', width: 844, height: 390 },
  { name: 'landscape-932', width: 932, height: 430 },
  { name: 'tablet-4-3', width: 1024, height: 768 },
  { name: 'tablet-16-10', width: 1280, height: 800 },
];

export const MIN_TOUCH = 48;
