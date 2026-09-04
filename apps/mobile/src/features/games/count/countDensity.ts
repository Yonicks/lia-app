/**
 * Count stage density — Phase 25.
 *
 * Large counts (up to 5) must fit the measured play-area width without
 * overflowing or shrinking below a child-safe floor.
 */

export function countPicSize(n: number, stageWidth: number, tokenMax: number, gap = 6): number {
  const count = Math.max(1, n);
  const available = Math.max(48, stageWidth - gap * (count - 1));
  const byWidth = Math.floor(available / count);
  return Math.max(48, Math.min(tokenMax, byWidth));
}

/** True when `n` objects of `pic` with `gap` fit inside `stageWidth`. */
export function countFitsStage(n: number, pic: number, stageWidth: number, gap = 6): boolean {
  return n * pic + Math.max(0, n - 1) * gap <= stageWidth + 0.5;
}
