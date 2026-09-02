import type { CategoryId } from '../types';

import { STICKERS, stickerUnlocked } from './stickers';

export function stickerFilterKeys(): ('all' | CategoryId)[] {
  const cats = new Set<CategoryId>();
  for (const s of STICKERS) {
    if (s.cat) cats.add(s.cat);
  }
  return ['all', ...cats];
}

export function stickerCounter(learned: ReadonlySet<string>, custom: import('../types').TalkiWord[] = []): string {
  const n = STICKERS.filter((s) => stickerUnlocked(s, learned, custom)).length;
  return `${n} מתוך 24 מדבקות נאספו`;
}

export function filterStickers(filter: 'all' | CategoryId) {
  if (filter === 'all') return STICKERS;
  return STICKERS.filter((s) => s.cat === filter);
}
