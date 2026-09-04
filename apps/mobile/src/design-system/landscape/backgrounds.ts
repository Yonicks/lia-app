/**
 * Landscape world backgrounds — Phase 18.
 *
 * Production art is registered here (never the reference screenshots).
 * Cover/crop with an explicit focal point so important world elements survive
 * aspect-ratio changes. Source art is 1672×941 (~16:9); the largest tablet
 * target (1366×1024 ≈ 4:3) is taller, so cover crops the sides — focal X is
 * biased toward the scenic center/castle so we do not lose the story focus.
 */
import type { ImageSourcePropType } from 'react-native';

import type { DeviceClass } from '../responsive/breakpoints';

export type LandscapeWorldId = 'home' | 'games' | 'practice';

/** Normalized focal point: 0..1 in image space (0.5 = center). */
export interface FocalPoint {
  x: number;
  y: number;
}

/**
 * Source pixel size of every talki-landscape-bg-*.png (verified Phase 18).
 * Used by unit tests and crop notes — not for runtime stretching.
 */
export const LANDSCAPE_BG_SOURCE = { width: 1672, height: 941 } as const;

/**
 * Per-world focal points chosen so the painterly story (path/meadow/castle)
 * survives phone 16:9 and tablet 4:3 cover crops. Y is slightly above center
 * so sky/castle remain; X is near center with a mild end-side bias on games
 * (castle sits toward the long-edge end of the art).
 */
export const LANDSCAPE_BG_FOCAL: Record<LandscapeWorldId, FocalPoint> = {
  home: { x: 0.48, y: 0.42 },
  games: { x: 0.55, y: 0.4 },
  practice: { x: 0.5, y: 0.42 },
};

/**
 * expo-image `contentPosition` object from a focal point (0..1 → percentage).
 * Uses top/left so cover crops keep the chosen story focus.
 *
 * `left`/`top` here are expo-image's physical ImageContentPosition API (image
 * crop anchor in the bitmap), not an RTL layout style prop — backgrounds do
 * not mirror with text direction.
 */
export function focalToContentPosition(focal: FocalPoint): {
  top: `${number}%`;
  left: `${number}%`;
} {
  const x = Math.round(Math.max(0, Math.min(1, focal.x)) * 100);
  const y = Math.round(Math.max(0, Math.min(1, focal.y)) * 100);
  // eslint-disable-next-line no-restricted-syntax -- expo-image contentPosition uses physical left/top
  return { left: `${x}%`, top: `${y}%` };
}

/**
 * Whether a device class is treated as "tablet crop" for documentation /
 * optional alternate crops. Today one source serves all classes via cover +
 * focal; phone vs tablet only changes which focal is preferred if we later
 * split crops — for now the same focal applies.
 */
export function landscapeBgFocalFor(
  world: LandscapeWorldId,
  _deviceClass: DeviceClass
): FocalPoint {
  return LANDSCAPE_BG_FOCAL[world];
}

/**
 * Pure geometry: given viewport and source aspect, does cover crop lose
 * horizontal or vertical content? Used by unit tests / reports.
 */
export function coverCropAxis(
  viewportWidth: number,
  viewportHeight: number,
  sourceWidth: number,
  sourceHeight: number
): 'horizontal' | 'vertical' | 'exact' {
  const viewAspect = viewportWidth / viewportHeight;
  const sourceAspect = sourceWidth / sourceHeight;
  const delta = viewAspect - sourceAspect;
  if (Math.abs(delta) < 0.01) return 'exact';
  // Viewport wider than source → cover scales to height, crops left/right.
  // Viewport taller (e.g. 4:3 tablet vs 16:9 art) → cover scales to width, crops top/bottom.
  return viewAspect > sourceAspect ? 'horizontal' : 'vertical';
}

/** Injected by assets.ts registration — typed here to avoid circular imports
 *  at the call site. Callers import `landscapeBackgrounds` from assets. */
export type LandscapeBackgroundSource = ImageSourcePropType;
