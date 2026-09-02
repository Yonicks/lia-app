/**
 * Flashcard index. Legacy `go()` (index.html 3461-3462) wraps with modulo;
 * `renderCards()` (2332) safety-clamps an out-of-range index. Both are
 * preserved: navigation wraps, construction clamps.
 */
export function clampCardIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

export function stepCardIndex(index: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return (index + delta + length) % length;
}
