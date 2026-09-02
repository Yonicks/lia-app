import { describe, expect, it } from 'vitest';

import { doneCardStars } from '@/domain/games/doneStars';

describe('doneCard star tiers (index.html 3204-3208)', () => {
  it('100% and 85% are three stars; 84% is two', () => {
    expect(doneCardStars(10, 10)).toBe(3);
    expect(doneCardStars(85, 100)).toBe(3);
    expect(doneCardStars(84, 100)).toBe(2);
  });

  it('50% is two stars; 49% is one', () => {
    expect(doneCardStars(1, 2)).toBe(2);
    expect(doneCardStars(49, 100)).toBe(1);
  });

  it('0% and an empty total are one star', () => {
    expect(doneCardStars(0, 10)).toBe(1);
    expect(doneCardStars(0, 0)).toBe(1);
  });
});
