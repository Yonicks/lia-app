import { plain } from '../vocabulary/niqqud';

import { SPEECH_LEVENSHTEIN_MAX } from '../../features/practice/practiceTimings';

/** index.html 3877-3883 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)] as number[]);
  for (let j = 0; j <= n; j++) d[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i]![j] = Math.min(
        d[i - 1]![j]! + 1,
        d[i]![j - 1]! + 1,
        d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[m]![n]!;
}

/** index.html 3854-3856 — comparison uses the plain form. */
export function speechMatch(heard: string, target: string): boolean {
  const t = plain(target);
  const a = plain(heard).replace(/[^\u05D0-\u05EA ]/g, '');
  return a.includes(t) || t.includes(a) || levenshtein(a, t) <= SPEECH_LEVENSHTEIN_MAX;
}
