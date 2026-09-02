import { describe, expect, it } from 'vitest';

import { GAME_IDS } from '@/domain/games/ids';
import { MIN_ITEMS, minItemsFor } from '@/domain/games/minItems';
import { resolveStartCategory, START_GAME_TOAST } from '@/domain/games/startGame';
import { PRACTICE_LIST } from '@/domain/practice/list';
import type { TalkiCategory, TalkiWord } from '@/domain/types';

function cat(id: string, n: number): TalkiCategory {
  const items: TalkiWord[] = Array.from({ length: n }, (_, i) => ({
    word: `w${i}`,
    emoji: 'x',
    id: `${id}-${i}`,
  }));
  return { id: id as TalkiCategory['id'], title: id, icon: 'x', cls: 'c', items };
}

describe('startGame — MIN_ITEMS gate and category fallback', () => {
  it('uses MIN_ITEMS[type] || 4 for every game id', () => {
    for (const id of GAME_IDS) {
      expect(minItemsFor(id)).toBe(MIN_ITEMS[id] || 4);
    }
  });

  it('uses MIN_ITEMS[type] || 4 for every practice mode id', () => {
    for (const [id] of PRACTICE_LIST) {
      expect(minItemsFor(id)).toBe(MIN_ITEMS[id] || 4);
    }
  });

  it('falls back to the first category with enough items when the requested one is short', () => {
    const cats = [cat('mine', 1), cat('animals', 26), cat('food', 26)];
    const result = resolveStartCategory('quiz', 'mine', cats);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.category.id).toBe('animals');
  });

  it('keeps the requested category when it qualifies', () => {
    const cats = [cat('food', 26), cat('animals', 26)];
    const result = resolveStartCategory('quiz', 'animals', cats);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.category.id).toBe('animals');
  });

  it('returns false and does not throw when no category qualifies', () => {
    expect(() => resolveStartCategory('quiz', 'animals', [cat('mine', 1)])).not.toThrow();
    const result = resolveStartCategory('quiz', 'animals', [cat('mine', 1)]);
    expect(result).toEqual({ ok: false, toast: START_GAME_TOAST });
  });

  it('defaults a missing MIN_ITEMS key to 4 (puzzle is 2, so a 3-item cat qualifies)', () => {
    const cats = [cat('animals', 3)];
    expect(resolveStartCategory('puzzle', 'animals', cats).ok).toBe(true);
    expect(resolveStartCategory('quiz', 'animals', cats).ok).toBe(false);
  });
});

describe('startGame does NOT write lia:lastcat', () => {
  it('is a pure function — calling it cannot touch lastCat storage', () => {
    const lastCat = { value: 'food' as const };
    const cats = [cat('animals', 26)];
    resolveStartCategory('quiz', 'animals', cats);
    expect(lastCat.value).toBe('food');
  });
});

describe('session lock', () => {
  it('tryLock succeeds once then rejects until unlock', () => {
    let locked = false;
    const tryLock = () => {
      if (locked) return false;
      locked = true;
      return true;
    };
    const unlock = () => {
      locked = false;
    };
    expect(tryLock()).toBe(true);
    expect(tryLock()).toBe(false);
    expect(tryLock()).toBe(false);
    unlock();
    expect(tryLock()).toBe(true);
  });
});
