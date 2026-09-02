import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/domain/games/shuffle';
import { initSort, setupSortRound, sortBoxPool, sortReducer } from '@/features/games/sort/sortReducer';

describe('sort reducer', () => {
  it('6 rounds, exactly 2 boxes from CATEGORIES with 4+ items, never mine', () => {
    const pool = sortBoxPool();
    expect(pool.every((c) => c.items.length >= 4)).toBe(true);
    expect(pool.every((c) => c.id !== 'mine')).toBe(true);

    let s = initSort(mulberry32(5));
    let rounds = 0;
    while (!s.done) {
      expect(s.boxes).toHaveLength(2);
      expect(s.boxes.every((b) => b.items.length >= 4)).toBe(true);
      expect(s.boxes.every((b) => b.id !== 'mine')).toBe(true);
      expect(s.boxes.some((b) => b.id === s.correctCatId)).toBe(true);
      expect(s.boxes.find((b) => b.id === s.correctCatId)!.items.some((it) => it.word === s.it.word)).toBe(true);
      s = sortReducer(s, { type: 'ANSWER', boxId: s.correctCatId });
      s = sortReducer(s, { type: 'ADVANCE', next: setupSortRound(mulberry32(10 + rounds), s.round + 1, s.score) });
      rounds += 1;
    }
    expect(rounds).toBe(6);
  });
});
