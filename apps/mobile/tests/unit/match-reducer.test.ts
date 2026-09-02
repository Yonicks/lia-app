import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/domain/games/shuffle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import { initMatch, matchReducer } from '@/features/games/match/matchReducer';

function word(w: string): TalkiWord {
  return { word: w, emoji: 'x' };
}

function category(n: number): TalkiCategory {
  return {
    id: 'animals',
    title: 'חיות',
    icon: 'x',
    cls: 'c-animals',
    items: Array.from({ length: n }, (_, i) => word(`w${i}`)),
  };
}

function ctx(n: number, seed = 5) {
  return { category: category(n), stats: {}, settings: {} as never, rnd: mulberry32(seed) };
}

describe('match reducer', () => {
  it('pairs are min(5, items.length)', () => {
    expect(initMatch(ctx(3)).words).toHaveLength(3);
    expect(initMatch(ctx(5)).words).toHaveLength(5);
    expect(initMatch(ctx(12)).words).toHaveLength(5);
  });

  it('left and right hold the same words, not always in the same order', () => {
    const state = initMatch(ctx(12, 8));
    expect(state.words.map((it) => it.word).sort()).toEqual(state.pictures.map((it) => it.word).sort());
    let shuffled = false;
    for (let seed = 1; seed <= 30; seed++) {
      const s = initMatch(ctx(12, seed));
      if (s.words.map((it) => it.word).join() !== s.pictures.map((it) => it.word).join()) {
        shuffled = true;
        break;
      }
    }
    expect(shuffled).toBe(true);
  });

  it('word then correct picture marks matched; wrong picture marks nothing and keeps sel', () => {
    let s = initMatch(ctx(8));
    const target = s.words[0]!.word;
    const other = s.words.find((it) => it.word !== target)!.word;
    s = matchReducer(s, { type: 'SELECT_WORD', word: target });
    expect(s.sel).toBe(target);
    const afterWrong = matchReducer(s, { type: 'SELECT_PICTURE', word: other });
    expect(afterWrong.matched).toHaveLength(0);
    expect(afterWrong.sel).toBe(target);
    s = matchReducer(s, { type: 'SELECT_PICTURE', word: target });
    expect(s.matched).toEqual([target]);
    expect(s.sel).toBeNull();
  });

  it('done when every word is matched', () => {
    let s = initMatch(ctx(5));
    for (const it of s.words) {
      s = matchReducer(s, { type: 'SELECT_WORD', word: it.word });
      s = matchReducer(s, { type: 'SELECT_PICTURE', word: it.word });
    }
    expect(s.done).toBe(true);
    expect(s.matched).toHaveLength(s.words.length);
  });
});
