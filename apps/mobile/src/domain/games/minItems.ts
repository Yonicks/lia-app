import type { GameId, PracticeModeId } from '../types';

/**
 * Ported verbatim from index.html 2489-2490. 16 entries. The default for any
 * key not present here is 4 (index.html: `MIN_ITEMS[type] || 4`).
 */
export const MIN_ITEMS: Partial<Record<GameId | PracticeModeId, number>> = {
  quiz: 4,
  memory: 4,
  match: 4,
  missing: 4,
  sort: 4,
  receptive: 4,
  sounds: 4,
  puzzle: 2,
  count: 1,
  focus: 1,
  temptation: 1,
  bubbles: 1,
  speech: 2,
  combine: 3,
  pairs: 2,
  cloze: 1,
};

export const MIN_ITEMS_DEFAULT = 4;

export function minItemsFor(type: GameId | PracticeModeId): number {
  // Legacy uses `MIN_ITEMS[type] || 4` (index.html 2492), not `??` — matched
  // here even though no current entry is falsy, so behaviour cannot silently
  // diverge if that ever changes upstream.
  return MIN_ITEMS[type] || MIN_ITEMS_DEFAULT;
}
