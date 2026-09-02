import { describe, expect, it } from 'vitest';

import { PAIRS } from '@/domain/practice/content';
import { mulberry32 } from '@/domain/games/shuffle';
import { canFailPairs, initPairs, pairsReducer } from '@/features/practice/pairs/pairsReducer';
import { PAIRS_POOL } from '@/features/practice/practiceTimings';

describe('pairs reducer', () => {
  it('takes 6 pairs from PAIRS, target is one of the two, both shown shuffled', () => {
    const s = initPairs(mulberry32(7));
    expect(s.pool).toHaveLength(PAIRS_POOL);
    expect(s.shown).toHaveLength(2);
    expect(s.shown.some((w) => w.word === s.target.word)).toBe(true);
    const pair = s.pool[0]!;
    expect(pair.some((w) => w.word === s.target.word)).toBe(true);
    expect(new Set(s.shown.map((w) => w.word)).size).toBe(2);
    for (const p of s.pool) {
      expect(PAIRS.some((leg) => leg[0].word === p[0].word && leg[1].word === p[1].word)).toBe(true);
    }
  });

  it('target is not always the same member across seeds', () => {
    const firsts = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const s = initPairs(mulberry32(seed));
      firsts.add(s.target.word);
    }
    expect(firsts.size).toBeGreaterThan(1);
  });

  it('wrong does not lock or score; correct advances after ADVANCE', () => {
    let s = initPairs(mulberry32(3));
    const other = s.shown.find((w) => w.word !== s.target.word)!.word;
    s = pairsReducer(s, { type: 'ANSWER', word: other });
    expect(s.score).toBe(0);
    expect(s.locked).toBe(false);
    s = pairsReducer(s, { type: 'ANSWER', word: s.target.word });
    expect(s.score).toBe(1);
    expect(s.locked).toBe(true);
    s = pairsReducer(s, { type: 'ADVANCE', rnd: mulberry32(4) });
    expect(s.i).toBe(1);
    expect(canFailPairs(s)).toBe(false);
  });
});
