import type { TalkiCategory, TalkiWord } from '../types';
import { allCats } from '../vocabulary/allCats';
import { key } from './keys';

/**
 * Ported verbatim from index.html 1838-1839.
 *
 * Legacy reads the module-level `custom` array and `learned` Set directly;
 * the port takes them as parameters since Phase 2 introduces no storage
 * layer (see allCats.ts). Given the same category list and the same
 * `learned` keys, the counts are identical to legacy.
 */
export function totalWords(custom: TalkiWord[] = []): number {
  return allCats(custom).reduce((s, c) => s + c.items.length, 0);
}

export function catLearned(cat: TalkiCategory, learned: ReadonlySet<string>): number {
  return cat.items.filter((i) => learned.has(key(cat.id, i.word))).length;
}
