import { describe, expect, it } from 'vitest';

import type { TalkiCategory, TalkiWord } from '@/domain/types';
import { mulberry32 } from '@/domain/games/shuffle';
import {
  canFailTemptation,
  initTemptation,
  temptationOpensOnRecognition,
  temptationReducer,
  temptationTimeoutFailsRound,
} from '@/features/practice/temptation/temptationReducer';
import { TEMPTATION_LISTEN_MS, TEMPTATION_POOL } from '@/features/practice/practiceTimings';

function word(w: string): TalkiWord {
  return { word: w, emoji: 'x' };
}

function category(): TalkiCategory {
  return {
    id: 'animals',
    title: 'חיות',
    icon: 'x',
    cls: 'c-animals',
    items: Array.from({ length: 8 }, (_, i) => word(`w${i}`)),
  };
}

function ctx() {
  return {
    category: category(),
    stats: {},
    settings: {} as never,
    rnd: mulberry32(3),
  };
}

describe('temptation reducer', () => {
  it('pool is 6 and starts closed', () => {
    const s = initTemptation(ctx());
    expect(s.pool).toHaveLength(TEMPTATION_POOL);
    expect(s.opened).toBe(false);
    expect(s.done).toBe(false);
  });

  it('ANY recognition result opens the jar, including empty or unrecognised', () => {
    expect(temptationOpensOnRecognition({ recognized: false, transcript: null })).toBe(true);
    expect(temptationOpensOnRecognition({ recognized: false, transcript: 'ba' })).toBe(true);
    expect(temptationOpensOnRecognition({ recognized: true, transcript: 'zzzz' })).toBe(true);
    expect(temptationOpensOnRecognition({ recognized: false, transcript: '' })).toBe(true);
  });

  it('manual open works with no recognition at all', () => {
    let s = initTemptation(ctx());
    s = temptationReducer(s, { type: 'OPEN' });
    expect(s.opened).toBe(true);
    expect(s.done).toBe(false);
  });

  it('the 8-second timeout does not fail the round', () => {
    expect(TEMPTATION_LISTEN_MS).toBe(8000);
    expect(temptationTimeoutFailsRound()).toBe(false);
    let s = initTemptation(ctx());
    s = temptationReducer(s, { type: 'LISTEN', on: true });
    s = temptationReducer(s, { type: 'LISTEN', on: false });
    expect(s.opened).toBe(false);
    expect(s.done).toBe(false);
    expect(canFailTemptation(s)).toBe(false);
  });

  it('no state can produce a failure', () => {
    let s = initTemptation(ctx());
    s = temptationReducer(s, { type: 'OPEN' });
    s = temptationReducer(s, { type: 'NEXT' });
    expect(canFailTemptation(s)).toBe(false);
    for (let i = 0; i < TEMPTATION_POOL; i++) {
      s = temptationReducer(s, { type: 'OPEN' });
      s = temptationReducer(s, { type: 'NEXT' });
    }
    expect(s.done).toBe(true);
    expect(canFailTemptation(s)).toBe(false);
  });
});
