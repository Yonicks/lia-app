import type { TalkiCategory, TalkiWord } from '../types';
import { allCats } from '../vocabulary/allCats';
import { catLearned } from './totals';

/**
 * Ported verbatim from index.html 2206-2216, including the exact branch
 * order (see docs/migration/phases/phase-02-plan.md — this is the branch
 * most likely to be dropped in a careless port):
 *
 *   1. `lastCat`, if it resolves to a non-empty category that is not yet
 *      fully learned — wins even when another category has a higher
 *      completion ratio.
 *   2. Otherwise, of the categories strictly in progress
 *      (0 < learned < items.length), the one with the highest completion
 *      ratio.
 *   3. Otherwise the first category with nothing learned.
 *   4. Otherwise cats[0].
 *
 * `activeCat` plays no part in this function, matching legacy.
 */
export function currentCategory(
  custom: TalkiWord[],
  learned: ReadonlySet<string>,
  lastCat: string | null,
): TalkiCategory | null {
  const cats = allCats(custom).filter((c) => c.items.length);
  if (!cats.length) return null;

  const last = lastCat ? cats.find((c) => c.id === lastCat) : undefined;
  if (last && catLearned(last, learned) < last.items.length) return last;

  const inProgress = cats.filter((c) => {
    const d = catLearned(c, learned);
    return d > 0 && d < c.items.length;
  });
  if (inProgress.length) {
    return [...inProgress].sort(
      (a, b) =>
        catLearned(b, learned) / b.items.length - catLearned(a, learned) / a.items.length,
    )[0];
  }

  return cats.find((c) => catLearned(c, learned) === 0) ?? cats[0];
}
