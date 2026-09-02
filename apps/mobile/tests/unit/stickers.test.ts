import { describe, expect, it } from 'vitest';

import { key } from '@/domain/progress/keys';
import { filterStickers, stickerCounter, stickerFilterKeys } from '@/domain/rewards/stickerFilters';
import { STICKERS, stickerUnlocked } from '@/domain/rewards/stickers';
import { getCat } from '@/domain/vocabulary/allCats';

describe('stickers', () => {
  it('all 24 are present', () => {
    expect(STICKERS).toHaveLength(24);
  });

  it('milestones unlock at exactly 1, 25 and 75', () => {
    const star = STICKERS.find((s) => s.milestone === 1)!;
    const sparkle = STICKERS.find((s) => s.milestone === 25)!;
    const gift = STICKERS.find((s) => s.milestone === 75)!;
    expect(stickerUnlocked(star, new Set())).toBe(false);
    expect(stickerUnlocked(star, new Set(['a']))).toBe(true);
    const twentyFour = new Set(Array.from({ length: 24 }, (_, i) => `k:${i}`));
    expect(stickerUnlocked(sparkle, twentyFour)).toBe(false);
    const twentyFive = new Set(Array.from({ length: 25 }, (_, i) => `k:${i}`));
    expect(stickerUnlocked(sparkle, twentyFive)).toBe(true);
    const seventyFour = new Set(Array.from({ length: 74 }, (_, i) => `k:${i}`));
    expect(stickerUnlocked(gift, seventyFour)).toBe(false);
    const seventyFive = new Set(Array.from({ length: 75 }, (_, i) => `k:${i}`));
    expect(stickerUnlocked(gift, seventyFive)).toBe(true);
  });

  it('the complete sticker unlocks only when numbers is fully learned', () => {
    const complete = STICKERS.find((s) => s.complete)!;
    const numbers = getCat('numbers')!;
    expect(stickerUnlocked(complete, new Set())).toBe(false);
    expect(stickerUnlocked(complete, new Set([key('numbers', numbers.items[0]!.word)]))).toBe(false);
    const all = new Set(numbers.items.map((i) => key('numbers', i.word)));
    expect(stickerUnlocked(complete, all)).toBe(true);
  });

  it('word stickers unlock on the exact key(cat, word)', () => {
    const dog = STICKERS[0]!;
    expect(stickerUnlocked(dog, new Set())).toBe(false);
    expect(stickerUnlocked(dog, new Set([key('animals', 'כֶּלֶב')]))).toBe(true);
    expect(stickerUnlocked(dog, new Set([key('food', 'כֶּלֶב')]))).toBe(false);
  });

  it('the counter reports unlocked out of 24', () => {
    expect(stickerCounter(new Set())).toBe('0 מתוך 24 מדבקות נאספו');
    expect(stickerCounter(new Set([key('animals', 'כֶּלֶב')]))).toBe('2 מתוך 24 מדבקות נאספו');
  });

  it('filter chips are all plus each category present in STICKERS', () => {
    expect(stickerFilterKeys()).toEqual(['all', 'animals', 'food', 'outside', 'colors', 'home', 'family', 'numbers']);
    expect(filterStickers('animals').every((s) => s.cat === 'animals')).toBe(true);
    expect(filterStickers('all')).toHaveLength(24);
  });
});
