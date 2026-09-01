/**
 * Ported verbatim from index.html 1845-1846. Every STAR_STEP-th word
 * learned anywhere fires celebrate() in legacy (not ported here — that is
 * UI/audio behaviour for a later phase); this module only carries the pure
 * arithmetic so the header pill and the "next star" line can never drift
 * from the same ladder.
 */
export const STAR_STEP = 10;

export function wordsToNextStar(learnedCount: number): number {
  return STAR_STEP - (learnedCount % STAR_STEP);
}
