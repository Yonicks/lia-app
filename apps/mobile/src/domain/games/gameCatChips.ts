import type { CategoryId, TalkiCategory, TalkiWord } from '../types';
import { allCats } from '../vocabulary/allCats';

export interface GameCatChips {
  /** Only categories with 4+ items — index.html 2282-2291's exact filter. */
  cats: TalkiCategory[];
  /** `activeCat` if it is one of `cats`, else `cats[0].id` — mirrors
   *  legacy's `cats.some(c=>c.id===activeCat) ? activeCat : cats[0].id`. */
  current: CategoryId;
}

/**
 * Ported verbatim from index.html 2282-2291 (`gameCatChips`). Returns
 * `null` when no category has 4+ items, matching legacy's `return ''`
 * (nothing to render) for the same case.
 */
export function gameCatChips(
  custom: TalkiWord[],
  activeCat: CategoryId | null,
): GameCatChips | null {
  const cats = allCats(custom).filter((c) => c.items.length >= 4);
  if (!cats.length) return null;
  const current = activeCat && cats.some((c) => c.id === activeCat) ? activeCat : cats[0].id;
  return { cats, current };
}
