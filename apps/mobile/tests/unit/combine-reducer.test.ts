import { describe, expect, it } from 'vitest';

import { MODIFIERS } from '@/domain/practice/content';
import { mulberry32 } from '@/domain/games/shuffle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import { canFailCombine, combineReducer, initCombine } from '@/features/practice/combine/combineReducer';
import { COMBINE_ROUNDS } from '@/features/practice/practiceTimings';

function category(): TalkiCategory {
  return {
    id: 'food',
    title: 'אוכל',
    icon: 'x',
    cls: 'c-food',
    items: ['תפוח', 'מים', 'לחם', 'גבינה'].map((w) => ({ word: w, emoji: 'x' }) satisfies TalkiWord),
  };
}

function ctx() {
  return { category: category(), stats: {}, settings: {} as never, rnd: mulberry32(2) };
}

describe('combine reducer', () => {
  it('starts with 3 pictures and no modifier', () => {
    const s = initCombine(ctx());
    expect(s.pics).toHaveLength(3);
    expect(s.mod).toBeNull();
    expect(s.round).toBe(0);
    expect(MODIFIERS.length).toBeGreaterThan(0);
  });

  it('selecting a modifier then a picture builds the phrase over 6 rounds', () => {
    let s = initCombine(ctx());
    for (let i = 0; i < COMBINE_ROUNDS; i++) {
      const mod = MODIFIERS[i % MODIFIERS.length]!;
      s = combineReducer(s, { type: 'SELECT_MOD', w: mod.w });
      expect(s.mod).toBe(mod.w);
      const pic = s.pics[0]!;
      const phrase = `${mod.w} ${pic.word}`;
      s = combineReducer(s, { type: 'PICK', word: pic.word, phrase });
      expect(s.phrase).toBe(phrase);
      expect(s.round).toBe(i + 1);
    }
    s = combineReducer(s, { type: 'FINISH' });
    expect(s.done).toBe(true);
    expect(s.round).toBe(6);
    expect(canFailCombine(s)).toBe(false);
  });
});
