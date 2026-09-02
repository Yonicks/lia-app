/**
 * Tier 1 for Home's derived data (phase-07-plan.md). `useHomeData.ts` is a
 * thin composition of already-tested domain functions over the two Zustand
 * stores; these tests exercise that exact composition — `currentCategory()`
 * / `catLearned()` / `allCats()` fed the same shapes the hook feeds them —
 * without mounting React, matching this repo's existing Tier 1 style
 * (domain-parity.test.ts, progress.test.ts).
 */
import { describe, expect, it } from 'vitest';

import { HOME_GAMES } from '@/domain/games/homeGames';
import { gameCatChips } from '@/domain/games/gameCatChips';
import { HOME_PRACTICE_HOME } from '@/domain/practice/list';
import { currentCategory } from '@/domain/progress/currentCategory';
import { key } from '@/domain/progress/keys';
import { catLearned } from '@/domain/progress/totals';
import type { TalkiWord } from '@/domain/types';
import { allCats } from '@/domain/vocabulary/allCats';

function learnAll(catId: string, words: TalkiWord[]): string[] {
  return words.map((w) => key(catId, w.word));
}

describe('Home data — the games row', () => {
  it('is exactly memory, quiz, missing, in that order', () => {
    expect(HOME_GAMES.map((g) => g.id)).toEqual(['memory', 'quiz', 'missing']);
  });
});

describe('Home data — the practice row', () => {
  it('is exactly HOME_PRACTICE_HOME (focus, receptive, cloze), not the full PRACTICE_LIST', () => {
    expect(HOME_PRACTICE_HOME.map((p) => p.id)).toEqual(['focus', 'receptive', 'cloze']);
  });
});

describe('Home data — the category grid', () => {
  it('matches allCats() including the synthetic mine category when custom words exist', () => {
    const custom: TalkiWord[] = [{ word: 'כדור', emoji: '⚽', id: 'c1' }];
    const cats = allCats(custom);
    expect(cats.map((c) => c.id)).toContain('mine');
    expect(cats.find((c) => c.id === 'mine')?.items).toEqual(custom);
  });

  it('omits nothing from allCats() with no custom words', () => {
    const cats = allCats([]);
    expect(cats).toHaveLength(11); // 10 built-in + mine (always present, empty)
    expect(cats.find((c) => c.id === 'mine')?.items).toEqual([]);
  });

  it('per-category learned counts equal catLearned()', () => {
    const cats = allCats([]);
    const animals = cats.find((c) => c.id === 'animals')!;
    const learnedTwo = new Set(learnAll('animals', animals.items.slice(0, 2)));
    expect(catLearned(animals, learnedTwo)).toBe(2);
    for (const cat of cats) {
      expect(catLearned(cat, learnedTwo)).toBe(cat.id === 'animals' ? 2 : 0);
    }
  });
});

describe('Home data — points', () => {
  it('equals learned.size, with no separate counter', () => {
    const cats = allCats([]);
    const animals = cats.find((c) => c.id === 'animals')!;
    const food = cats.find((c) => c.id === 'food')!;
    const learned = new Set([
      ...learnAll('animals', animals.items.slice(0, 3)),
      ...learnAll('food', food.items.slice(0, 5)),
    ]);
    expect(learned.size).toBe(8);
  });
});

describe('Home data — the continue-learning hero', () => {
  it('uses currentCategory(), including the lastCat branch (a partially-learned lastCat wins over a higher-ratio category)', () => {
    const cats = allCats([]);
    const animals = cats.find((c) => c.id === 'animals')!;
    const food = cats.find((c) => c.id === 'food')!;
    // food is 90% done (higher ratio); animals (lastCat) is only 10% done.
    // Branch 1 (lastCat, not fully learned) must still win over branch 2.
    const learned = new Set([
      ...learnAll('animals', animals.items.slice(0, 1)),
      ...learnAll('food', food.items.slice(0, Math.floor(food.items.length * 0.9))),
    ]);
    const hero = currentCategory([], learned, 'animals');
    expect(hero?.id).toBe('animals');
  });

  it('falls back to the highest-ratio in-progress category when lastCat is null', () => {
    const cats = allCats([]);
    const animals = cats.find((c) => c.id === 'animals')!;
    const food = cats.find((c) => c.id === 'food')!;
    const learned = new Set([
      ...learnAll('animals', animals.items.slice(0, 1)),
      ...learnAll('food', food.items.slice(0, Math.floor(food.items.length * 0.9))),
    ]);
    const hero = currentCategory([], learned, null);
    expect(hero?.id).toBe('food');
  });

  it('is absent (null) only when allCats() itself is empty — otherwise it always resolves to something', () => {
    // currentCategory() only returns null when there are no categories with
    // any items at all; "every category fully learned" still resolves via
    // branch 4 (cats[0]) since branches 1-3 all fail closed to it.
    const cats = allCats([]);
    const learned = new Set(cats.flatMap((c) => learnAll(c.id, c.items)));
    const hero = currentCategory([], learned, null);
    expect(hero).not.toBeNull();
    expect(hero?.id).toBe(cats[0].id);
  });

  it('fresh vs returning is selected by learned.size, not by currentCategory() returning null', () => {
    // index.html 1415-1421: a new user cannot be detected from `cur`.
    expect(currentCategory([], new Set(), null)).not.toBeNull();
    expect(new Set<string>().size).toBe(0);
  });
});

describe('Home data — gameCatChips', () => {
  it('shows only categories with 4 or more items', () => {
    const chips = gameCatChips([], null);
    expect(chips).not.toBeNull();
    expect(chips!.cats.every((c) => c.items.length >= 4)).toBe(true);
    expect(chips!.cats.find((c) => c.id === 'mine')).toBeUndefined(); // empty mine has 0 items
  });

  it('returns null when no category has 4+ items', () => {
    expect(gameCatChips([], null)?.cats.length).toBeGreaterThan(0);
    // With only a 2-item custom list and no built-ins... not possible via
    // allCats() (built-ins always exist). The 4+ filter on mine itself:
    const two: TalkiWord[] = [
      { word: 'א', emoji: '1', id: '1' },
      { word: 'ב', emoji: '2', id: '2' },
    ];
    const chips = gameCatChips(two, 'mine');
    expect(chips!.cats.find((c) => c.id === 'mine')).toBeUndefined();
  });

  it('uses lastCat as current when that category is in the 4+ list', () => {
    const chips = gameCatChips([], 'food');
    expect(chips!.current).toBe('food');
  });
});
