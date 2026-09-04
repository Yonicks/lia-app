/**
 * Central reduce-motion policy helpers (Phase 28).
 *
 * Preference source of truth for UI is `useTalkiReducedMotion()` (OS
 * accessibility setting via Reanimated). These pure helpers keep timing
 * decisions testable without mounting React.
 */

/** Near-zero duration so Reanimated/web still flush a settled frame. */
export const REDUCED_MOTION_FLUSH_MS = 1;

/** Intro low-motion hold before hand-off (matches IntroSequence). */
export const REDUCED_MOTION_INTRO_HOLD_MS = 400;

/**
 * Map an intended animation duration to an effective one under the
 * reduce-motion policy. Core UI still appears; motion is skipped.
 */
export function motionDurationMs(intendedMs: number, reduceMotion: boolean): number {
  if (!reduceMotion) return intendedMs;
  return intendedMs <= 0 ? 0 : REDUCED_MOTION_FLUSH_MS;
}

/** Modal / RN `animationType` under reduce-motion. */
export function modalAnimationType(
  reduceMotion: boolean,
  whenAnimated: 'none' | 'slide' | 'fade' = 'fade',
): 'none' | 'slide' | 'fade' {
  return reduceMotion ? 'none' : whenAnimated;
}
