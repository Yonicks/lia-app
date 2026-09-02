import { describe, expect, it } from 'vitest';

import { CARRIERS } from '@/domain/practice/content';
import { mulberry32 } from '@/domain/games/shuffle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import { canFailFocus, focusPhrase, focusReducer, initFocus } from '@/features/practice/focus/focusReducer';

function category(): TalkiCategory {
  return {
    id: 'animals',
    title: 'חיות',
    icon: 'x',
    cls: 'c-animals',
    items: [{ word: 'כֶּלֶב', emoji: '🐶' } satisfies TalkiWord],
  };
}

function ctx() {
  return { category: category(), stats: {}, settings: {} as never, rnd: mulberry32(1) };
}

describe('focus reducer', () => {
  it('steps equal CARRIERS.length and substitutes {w}', () => {
    const s = initFocus(ctx());
    expect(s.total).toBe(CARRIERS.length);
    expect(s.total).toBe(8);
    expect(focusPhrase(s, 'כֶּלֶב')).toBe(CARRIERS[0]!.replace('{w}', 'כֶּלֶב'));
  });

  it('advances through every carrier then finishes on a bespoke done, not a scored doneCard', () => {
    let s = initFocus(ctx());
    for (let i = 0; i < CARRIERS.length - 1; i++) {
      s = focusReducer(s, { type: 'ADVANCE' });
      expect(s.done).toBe(false);
      expect(focusPhrase(s, 'כֶּלֶב')).toBe(CARRIERS[s.step]!.replace('{w}', 'כֶּלֶב'));
    }
    s = focusReducer(s, { type: 'ADVANCE' });
    expect(s.done).toBe(true);
    expect(s.step).toBe(CARRIERS.length);
    expect(canFailFocus(s)).toBe(false);
  });
});
