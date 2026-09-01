import type { TalkiWord, WordStats } from '../types';
import { key } from './keys';

/**
 * Ported verbatim from index.html 1869-1877 (weightedPick, "SRS-lite: words
 * answered wrong (or never seen) get picked first") and 1878-1883
 * (markSeen).
 *
 * Legacy's `rnd()` (index.html 1852-1861) falls back to `Math.random()`
 * whenever no seed is active, which is the only path relevant outside the
 * legacy web app's own `?seed=` test hook — that hook is a Tier 2 test
 * surface concern, not domain logic, so it is not ported here. `weightedPick`
 * instead takes the random source as an injectable parameter (defaulting to
 * `Math.random`) so callers — including tests — can supply a deterministic
 * one without this module depending on `window.location` or a seed global.
 */
export function weightedPick(
  items: TalkiWord[],
  catId: string,
  n: number,
  stats: Record<string, WordStats>,
  rnd: () => number = Math.random,
): TalkiWord[] {
  const scored = items.map((it) => {
    const s = stats[key(catId, it.word)] || { seen: 0, wrong: 0 };
    const weight = 1 + s.wrong * 3 - Math.min(s.seen, 4) * 0.4 + rnd() * 1.2;
    return { it, weight };
  });
  scored.sort((a, b) => b.weight - a.weight);
  return scored.slice(0, n).map((s) => s.it);
}

export function markSeen(
  catId: string,
  word: string,
  wrong: boolean,
  stats: Record<string, WordStats>,
): Record<string, WordStats> {
  const k = key(catId, word);
  const s = stats[k] || { seen: 0, wrong: 0 };
  s.seen++;
  if (wrong) s.wrong++;
  else s.wrong = Math.max(0, s.wrong - 1);
  stats[k] = s;
  return stats;
}
