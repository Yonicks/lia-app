import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/domain/games/shuffle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import {
  initMissing,
  MISSING_ROUNDS,
  missingFinish,
  missingReducer,
  setupMissingRound,
  shouldFinishMissing,
} from '@/features/games/missing/missingReducer';

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

function ctx(seed = 3) {
  return { category: category(12), stats: {}, settings: {} as never, rnd: mulberry32(seed) };
}

describe('missing reducer', () => {
  it('has exactly 4 items; missing is a member of set; askOrder is a permutation', () => {
    const state = initMissing(ctx());
    expect(state.set).toHaveLength(4);
    expect(state.set.some((it) => it.word === state.missing.word)).toBe(true);
    expect(state.askOrder.map((it) => it.word).sort()).toEqual(state.set.map((it) => it.word).sort());
    expect(state.phase).toBe('show');
  });

  it('askOrder is a separate shuffle from the display order', () => {
    let different = false;
    for (let seed = 1; seed <= 40; seed++) {
      const s = initMissing(ctx(seed));
      if (s.askOrder.map((it) => it.word).join() !== s.set.map((it) => it.word).join()) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });

  it('show → ask happens on ASK (the timer), not on a guess tap', () => {
    let s = initMissing(ctx());
    s = missingReducer(s, { type: 'GUESS', word: s.missing.word });
    expect(s.phase).toBe('show');
    expect(s.score).toBe(0);
    s = missingReducer(s, { type: 'ASK' });
    expect(s.phase).toBe('ask');
  });

  it('correct scores, wrong does not; done after exactly 5 rounds', () => {
    let s = initMissing(ctx());
    s = missingReducer(s, { type: 'ASK' });
    s = missingReducer(s, { type: 'GUESS', word: s.missing.word });
    expect(s.score).toBe(1);
    s = missingReducer(s, { type: 'ASK' });
    const wrong = s.set.find((it) => it.word !== s.missing.word)!.word;
    s = missingReducer(s, { type: 'GUESS', word: wrong });
    expect(s.score).toBe(1);

    for (let i = 0; i < MISSING_ROUNDS; i++) {
      const step = setupMissingRound(ctx(10 + i), i, 0);
      expect(shouldFinishMissing(step)).toBe(i >= MISSING_ROUNDS - 1);
    }
    expect(missingFinish(setupMissingRound(ctx(1), 4, 3)).done).toBe(true);
  });
});
