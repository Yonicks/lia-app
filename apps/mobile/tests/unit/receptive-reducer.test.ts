import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/domain/games/shuffle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import {
  canFailReceptive,
  initReceptive,
  receptiveColumns,
  receptiveReducer,
} from '@/features/practice/receptive/receptiveReducer';
import {
  RECEPTIVE_MAX_LEVEL,
  RECEPTIVE_MIN_LEVEL,
  RECEPTIVE_ROUNDS,
  RECEPTIVE_START_LEVEL,
} from '@/features/practice/practiceTimings';

function word(w: string): TalkiWord {
  return { word: w, emoji: 'x' };
}

function category(): TalkiCategory {
  return {
    id: 'animals',
    title: 'חיות',
    icon: 'x',
    cls: 'c-animals',
    items: Array.from({ length: 12 }, (_, i) => word(`w${i}`)),
  };
}

function ctx(seed = 1) {
  return {
    category: category(),
    stats: {},
    settings: {} as never,
    rnd: mulberry32(seed),
  };
}

describe('receptive reducer', () => {
  it('starts at level 2 and option count equals level', () => {
    const s = initReceptive(ctx());
    expect(s.level).toBe(RECEPTIVE_START_LEVEL);
    expect(s.level).toBe(2);
    expect(s.options).toHaveLength(2);
    expect(s.i).toBe(0);
    expect(s.done).toBe(false);
  });

  it('level rises after a run of 3 correct while below 4', () => {
    let s = initReceptive(ctx(4));
    const items = category().items;
    for (let n = 0; n < 3; n++) {
      const rnd = mulberry32(10 + n);
      s = receptiveReducer(s, { type: 'ANSWER', word: s.target.word, items, rnd });
      s = receptiveReducer(s, { type: 'UNLOCK' });
    }
    expect(s.level).toBe(3);
    expect(s.options).toHaveLength(3);
    expect(s.run).toBe(0);
  });

  it('level falls after 2 misses while above 2, without incrementing i', () => {
    let s = initReceptive(ctx(4));
    const items = category().items;
    for (let n = 0; n < 3; n++) {
      s = receptiveReducer(s, { type: 'ANSWER', word: s.target.word, items, rnd: mulberry32(20 + n) });
      s = receptiveReducer(s, { type: 'UNLOCK' });
    }
    expect(s.level).toBe(3);
    const i = s.i;
    const wrong = s.options.find((o) => o.word !== s.target.word)!.word;
    s = receptiveReducer(s, { type: 'ANSWER', word: wrong, items, rnd: mulberry32(1) });
    s = receptiveReducer(s, { type: 'UNLOCK' });
    const wrong2 = s.options.find((o) => o.word !== s.target.word)!.word;
    s = receptiveReducer(s, { type: 'ANSWER', word: wrong2, items, rnd: mulberry32(2) });
    expect(s.level).toBe(RECEPTIVE_MIN_LEVEL);
    expect(s.i).toBe(i);
    expect(s.miss).toBe(0);
  });

  it('needs 8 correct rounds to finish and never fails', () => {
    let s = initReceptive(ctx(2));
    const items = category().items;
    for (let n = 0; n < RECEPTIVE_ROUNDS; n++) {
      s = receptiveReducer(s, { type: 'ANSWER', word: s.target.word, items, rnd: mulberry32(30 + n) });
      s = receptiveReducer(s, { type: 'UNLOCK' });
    }
    expect(s.done).toBe(true);
    expect(s.i).toBe(RECEPTIVE_ROUNDS);
    expect(s.level).toBeLessThanOrEqual(RECEPTIVE_MAX_LEVEL);
    expect(canFailReceptive(s)).toBe(false);
  });

  it('column rule: 2 -> 2, 3 -> 3, 4 or more -> 2', () => {
    expect(receptiveColumns(1)).toBe(2);
    expect(receptiveColumns(2)).toBe(2);
    expect(receptiveColumns(3)).toBe(3);
    expect(receptiveColumns(4)).toBe(2);
    expect(receptiveColumns(5)).toBe(2);
  });
});
