/**
 * Play-area-local bubble spawn metrics (Phase 25).
 *
 * Size and horizontal start are derived from the measured stage rectangle,
 * not global portrait viewport dimensions, so bubbles stay inside the
 * landscape play area on phones and tablets.
 */

export interface BubbleStageBounds {
  width: number;
  height: number;
  sizeMin: number;
  sizeMax: number;
}

export interface BubbleSpawnLayout {
  size: number;
  /** Left edge as a percentage of stage width (0–100). */
  start: number;
  /** Horizontal drift in px during the rise animation. */
  drift: number;
  duration: number;
}

/**
 * Clamp spawn size/position so the bubble stays fully inside `stage`.
 * Falls back to token mins when the stage has not laid out yet.
 */
export function bubbleSpawnLayout(rnd: () => number, stage: BubbleStageBounds): BubbleSpawnLayout {
  const w = Math.max(1, stage.width);
  const h = Math.max(1, stage.height);
  const maxByHeight = Math.max(48, h * 0.55);
  const maxByWidth = Math.max(48, w * 0.3);
  const sizeMax = Math.min(stage.sizeMax, maxByHeight, maxByWidth);
  const sizeMin = Math.min(Math.max(48, stage.sizeMin), sizeMax);
  const size = sizeMin + rnd() * Math.max(0, sizeMax - sizeMin);

  // Keep the full bubble (plus a 2% gutter) inside the stage width.
  const widthPct = (size / w) * 100;
  const maxStart = Math.max(0, 100 - widthPct - 2);
  const start = 2 + rnd() * Math.max(0, maxStart - 2);

  // Drift must not push the bubble past the stage edges at mid-rise.
  const maxDrift = Math.max(0, (w - size) / 2);
  const drift = (rnd() * 2 - 1) * Math.min(30, maxDrift);
  const duration = 8 + rnd() * 4;

  return { size, start, drift, duration };
}

/** True when a bubble of `size` at `start`% stays within [0, stageWidth]. */
export function bubbleFitsStage(start: number, size: number, stageWidth: number): boolean {
  if (stageWidth <= 0) return false;
  const left = (start / 100) * stageWidth;
  return left >= -0.5 && left + size <= stageWidth + 0.5;
}
