/**
 * Forgiving hit test, index.html 2902-2914.
 *
 * Tolerance is a multiple of slot size (`max(width, height) * tolerance`),
 * not absolute pixels, so the magnet scales across viewports.
 */
export interface SlotRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  filled: boolean;
}

export function puzzleSlotUnder(
  cx: number,
  cy: number,
  piece: { x: number; y: number; width: number; height: number },
  slots: SlotRect[],
  tolerance: number,
): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const slot of slots) {
    if (slot.filled) continue;
    const scx = slot.x + slot.width / 2;
    const scy = slot.y + slot.height / 2;
    const d = Math.hypot(cx - scx, cy - scy);
    const reach = Math.max(slot.width, slot.height) * tolerance;
    const overlaps =
      piece.x + piece.width > slot.x &&
      piece.x < slot.x + slot.width &&
      piece.y + piece.height > slot.y &&
      piece.y < slot.y + slot.height;
    if ((d <= reach || overlaps) && d < bestD) {
      bestD = d;
      best = slot.id;
    }
  }
  return best;
}
