import type { TalkiCategory, TalkiWord } from '../types';
import { CATEGORIES } from './categories';

/**
 * Ported verbatim from index.html 1831-1836.
 *
 * `allCats()` shallow-copies the ten built-ins and appends a synthetic
 * eleventh category, 'mine', holding whatever custom words the caller
 * supplies. The legacy implementation reads a module-level `custom` array;
 * the port takes it as a parameter instead of module-level mutable state,
 * since Phase 2 introduces no storage layer (that is a later phase) — the
 * shape of the returned category list is unchanged.
 */
export function allCats(custom: TalkiWord[] = []): TalkiCategory[] {
  const list: TalkiCategory[] = Object.values(CATEGORIES).map((c) => ({ ...c }));
  list.push({ id: 'mine', title: 'הַמִּלִּים שֶׁלִּי', icon: '💜', cls: 'c-mine', items: custom });
  return list;
}

export function getCat(id: string, custom: TalkiWord[] = []): TalkiCategory | undefined {
  return allCats(custom).find((c) => c.id === id);
}
