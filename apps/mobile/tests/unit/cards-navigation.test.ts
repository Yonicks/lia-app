import { describe, expect, it } from 'vitest';

import { clampCardIndex, stepCardIndex } from '@/features/games/cards/cardsNav';

describe('cards navigation', () => {
  it('safety-clamps an out-of-range index (renderCards 2332)', () => {
    expect(clampCardIndex(-4, 10)).toBe(0);
    expect(clampCardIndex(99, 10)).toBe(9);
    expect(clampCardIndex(3, 10)).toBe(3);
    expect(clampCardIndex(0, 0)).toBe(0);
  });

  it('next and prev move by one and wrap, matching go() 3462', () => {
    expect(stepCardIndex(0, 1, 5)).toBe(1);
    expect(stepCardIndex(4, 1, 5)).toBe(0);
    expect(stepCardIndex(0, -1, 5)).toBe(4);
    expect(stepCardIndex(2, -1, 5)).toBe(1);
  });

  it('an empty category does not throw', () => {
    expect(() => clampCardIndex(0, 0)).not.toThrow();
    expect(() => stepCardIndex(0, 1, 0)).not.toThrow();
    expect(stepCardIndex(0, 1, 0)).toBe(0);
  });
});
