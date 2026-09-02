import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/domain/games/shuffle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import { countReducer, initCount, setupCountRound } from '@/features/games/count/countReducer';

function word(w: string, photo?: string): TalkiWord {
  return { word: w, emoji: 'x', photo };
}

function category(items: TalkiWord[]): TalkiCategory {
  return { id: 'animals', title: 'x', icon: 'x', cls: 'c-animals', items };
}

describe('count reducer', () => {
  it('5 rounds, n in 1..5, 3 distinct options including n', () => {
    const ctx = {
      category: category([word('a'), word('b'), word('c')]),
      stats: {},
      settings: {} as never,
      rnd: mulberry32(11),
    };
    let s = initCount(ctx);
    let rounds = 0;
    while (!s.done) {
      expect(s.n).toBeGreaterThanOrEqual(1);
      expect(s.n).toBeLessThanOrEqual(5);
      expect(new Set(s.options).size).toBe(3);
      expect(s.options).toContain(s.n);
      s = countReducer(s, { type: 'ANSWER', n: s.n });
      s = countReducer(s, { type: 'ADVANCE', next: setupCountRound({ ...ctx, rnd: mulberry32(20 + rounds) }, s.round + 1, s.score) });
      rounds += 1;
    }
    expect(rounds).toBe(5);
  });

  it('photo items are excluded when a non-photo pool exists', () => {
    const photo = word('photo-word', 'data:image/png;base64,xx');
    const plainA = word('plain-a');
    const ctx = {
      category: category([photo, plainA]),
      stats: {},
      settings: {} as never,
      rnd: () => 0,
    };
    for (let i = 0; i < 8; i++) {
      const s = setupCountRound({ ...ctx, rnd: mulberry32(i + 1) }, 0, 0);
      expect(s.it.word).toBe('plain-a');
    }
  });
});
