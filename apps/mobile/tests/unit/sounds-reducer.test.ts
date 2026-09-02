import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/domain/games/shuffle';
import { CATEGORIES } from '@/domain/vocabulary/categories';
import { animalSounds, initSounds, soundsReducer } from '@/features/games/sounds/soundsReducer';

function ctx(cat = CATEGORIES.animals) {
  return { category: cat, stats: {}, settings: {} as never, rnd: mulberry32(7) };
}

describe('sounds reducer', () => {
  it('pools six animals that each have a sound field', () => {
    const state = initSounds(ctx(CATEGORIES.animals));
    expect(state.pool).toHaveLength(6);
    expect(state.pool.every((it) => Boolean(it.sound))).toBe(true);
    const animals = new Set(CATEGORIES.animals.items.map((i) => i.word));
    expect(state.pool.every((it) => animals.has(it.word))).toBe(true);
  });

  it('every pooled item has a sound; animals-with-sound is the source', () => {
    const withSound = animalSounds(CATEGORIES.animals.items);
    expect(withSound.length).toBeGreaterThanOrEqual(6);
    const state = initSounds(ctx(CATEGORIES.animals));
    expect(state.pool.every((it) => withSound.some((a) => a.word === it.word))).toBe(true);
  });

  it('6 rounds, 3 options, exactly one correct', () => {
    let s = initSounds(ctx(), 0);
    expect(s.options).toHaveLength(3);
    expect(s.options.filter((o) => o.word === s.target.word)).toHaveLength(1);
    let rounds = 0;
    while (!s.done) {
      rounds += 1;
      s = soundsReducer(s, { type: 'ANSWER', word: s.target.word });
      s = soundsReducer(s, { type: 'ADVANCE', rnd: mulberry32(rounds + 3) });
    }
    expect(rounds).toBe(6);
    expect(s.score).toBe(6);
  });
});
