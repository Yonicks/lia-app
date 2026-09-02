/**
 * `doneCard()` star tiers (index.html 3204-3208). One function, used by
 * every game — no game may copy these thresholds locally (phase-08
 * standing rule).
 *
 *   ratio >= 0.85  → 3
 *   ratio >= 0.50  → 2
 *   else           → 1
 */
export function doneCardStars(score: number, total: number): 1 | 2 | 3 {
  const ratio = total ? score / total : 0;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}
