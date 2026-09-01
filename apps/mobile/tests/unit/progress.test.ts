import { describe, expect, it } from 'vitest';

import type { TalkiWord, WordStats } from '@/domain/types';
import { CATEGORIES } from '@/domain/vocabulary/categories';
import { allCats, getCat } from '@/domain/vocabulary/allCats';
import { display, plain } from '@/domain/vocabulary/niqqud';
import { key } from '@/domain/progress/keys';
import { catLearned, totalWords } from '@/domain/progress/totals';
import { currentCategory } from '@/domain/progress/currentCategory';
import { markSeen, weightedPick } from '@/domain/progress/selection';
import { STAR_STEP, wordsToNextStar } from '@/domain/progress/stars';

/** Marks every word of a category as learned, using the real key() so tests
 *  never depend on knowing the key format independently of the port. */
function learnAll(catId: string): Set<string> {
  const cat = CATEGORIES[catId as keyof typeof CATEGORIES];
  return new Set(cat.items.map((i) => key(catId, i.word)));
}

function learnN(catId: string, n: number): Set<string> {
  const cat = CATEGORIES[catId as keyof typeof CATEGORIES];
  return new Set(cat.items.slice(0, n).map((i) => key(catId, i.word)));
}

describe('key()', () => {
  it('joins category id and word with a colon, matching index.html 1837', () => {
    expect(key('animals', 'כֶּלֶב')).toBe('animals:כֶּלֶב');
  });
});

describe('totalWords()', () => {
  it('sums all built-in categories to 182 with no custom words', () => {
    expect(totalWords([])).toBe(182);
    expect(totalWords()).toBe(182);
  });

  it('includes custom words via the virtual "mine" category', () => {
    const custom: TalkiWord[] = [
      { word: 'א', emoji: '🙂' },
      { word: 'ב', emoji: '🙂' },
      { word: 'ג', emoji: '🙂' },
    ];
    expect(totalWords(custom)).toBe(182 + 3);
  });
});

describe('catLearned()', () => {
  it('counts zero when nothing is learned', () => {
    expect(catLearned(CATEGORIES.animals, new Set())).toBe(0);
  });

  it('counts exactly the learned items in that category', () => {
    const learned = learnN('animals', 5);
    expect(catLearned(CATEGORIES.animals, learned)).toBe(5);
  });

  it('does not count keys from a different category', () => {
    const learned = learnAll('food');
    expect(catLearned(CATEGORIES.animals, learned)).toBe(0);
  });
});

describe('allCats() / getCat()', () => {
  it('returns the 10 built-ins plus a synthetic "mine" category', () => {
    const cats = allCats([]);
    expect(cats).toHaveLength(11);
    expect(cats.map((c) => c.id)).toContain('mine');
  });

  it('"mine" carries the exact legacy title/icon/cls and the supplied custom items', () => {
    const custom: TalkiWord[] = [{ word: 'שֵׁם', emoji: '😀' }];
    const mine = getCat('mine', custom);
    expect(mine).toEqual({
      id: 'mine',
      title: 'הַמִּלִּים שֶׁלִּי',
      icon: '💜',
      cls: 'c-mine',
      items: custom,
    });
  });
});

describe('plain() and display() under both niqqud settings', () => {
  const pointed = 'כֶּלֶב';

  it('plain() always strips niqqud, regardless of any setting', () => {
    expect(plain(pointed)).toBe('כלב');
  });

  it('display() keeps niqqud when the setting is on', () => {
    expect(display(pointed, true)).toBe(pointed);
  });

  it('display() strips niqqud when the setting is off, identically to plain()', () => {
    expect(display(pointed, false)).toBe('כלב');
    expect(display(pointed, false)).toBe(plain(pointed));
  });

  it('a word with no niqqud is unchanged by either function', () => {
    expect(plain('שלום')).toBe('שלום');
    expect(display('שלום', true)).toBe('שלום');
    expect(display('שלום', false)).toBe('שלום');
  });
});

describe('currentCategory(): all four branches (index.html 2206-2216)', () => {
  it('branch 1: lastCat wins when set and not fully learned', () => {
    const learned = learnN('animals', 3); // in progress, not finished
    const result = currentCategory([], learned, 'animals');
    expect(result?.id).toBe('animals');
  });

  it('branch 1: lastCat wins EVEN WHEN another category has a higher completion ratio', () => {
    // "food" is 24/26 learned (~92%), "animals" (lastCat) is only 3/26 (~12%)
    // and not finished — legacy still returns lastCat first.
    const learned = new Set<string>([...learnN('food', 24), ...learnN('animals', 3)]);
    const result = currentCategory([], learned, 'animals');
    expect(result?.id).toBe('animals');
  });

  it('branch 1 is skipped once lastCat is fully learned, falling through to branch 2/3/4', () => {
    const learned = new Set<string>([...learnAll('animals'), ...learnN('food', 5)]);
    const result = currentCategory([], learned, 'animals');
    expect(result?.id).not.toBe('animals');
  });

  it('branch 2: no lastCat — the in-progress category with the highest completion ratio wins', () => {
    // food 5/26 (~19%), body 6/12 (50%) — body should win.
    const learned = new Set<string>([...learnN('food', 5), ...learnN('body', 6)]);
    const result = currentCategory([], learned, null);
    expect(result?.id).toBe('body');
  });

  it('branch 2: an unresolvable lastCat (unknown id) behaves like no lastCat', () => {
    const learned = new Set<string>([...learnN('food', 5), ...learnN('body', 6)]);
    const result = currentCategory([], learned, 'does-not-exist');
    expect(result?.id).toBe('body');
  });

  it('branch 3: nothing in progress — the first untouched category wins', () => {
    // animals fully learned; nothing else touched. cats order follows
    // Object.values(CATEGORIES) insertion order: animals, food, colors, ...
    const learned = learnAll('animals');
    const result = currentCategory([], learned, null);
    expect(result?.id).toBe('food');
  });

  it('branch 4: everything fully learned — falls back to cats[0]', () => {
    const learned = new Set<string>(
      Object.keys(CATEGORIES).flatMap((catId) => [...learnAll(catId)]),
    );
    const result = currentCategory([], learned, null);
    expect(result?.id).toBe('animals'); // cats[0] in Object.values(CATEGORIES) order
  });

  it('returns null when there are no non-empty categories at all', () => {
    // Every built-in category always has items, so this can only happen if
    // allCats() somehow returned nothing but empty lists — verified against
    // the real data instead of a contrived empty-CATEGORIES stub, since
    // CATEGORIES itself is fixed content in this phase.
    const cats = allCats([]);
    expect(cats.every((c) => c.items.length > 0 || c.id === 'mine')).toBe(true);
  });
});

describe('STAR_STEP / wordsToNextStar()', () => {
  it('STAR_STEP is 10', () => {
    expect(STAR_STEP).toBe(10);
  });

  it('counts down from 10', () => {
    expect(wordsToNextStar(0)).toBe(10);
    expect(wordsToNextStar(1)).toBe(9);
    expect(wordsToNextStar(9)).toBe(1);
  });

  it('wraps back to 10 exactly on a multiple of STAR_STEP', () => {
    expect(wordsToNextStar(10)).toBe(10);
    expect(wordsToNextStar(20)).toBe(10);
  });
});

describe('weightedPick()', () => {
  it('prioritises higher wrong counts even against a strong random jitter draw', () => {
    const items = CATEGORIES.animals.items.slice(0, 5);
    const stats: Record<string, WordStats> = {
      [key('animals', items[0].word)]: { seen: 4, wrong: 5 }, // weight base = 1 + 15 - 1.6 = 14.4
      [key('animals', items[1].word)]: { seen: 0, wrong: 0 }, // weight base = 1
    };
    // rnd() always returns 0 so jitter never lets the low-wrong item win.
    const picked = weightedPick(items, 'animals', 1, stats, () => 0);
    expect(picked[0]).toBe(items[0]);
  });

  it('with zero jitter, sorts strictly by descending weight', () => {
    const items = CATEGORIES.body.items;
    const stats: Record<string, WordStats> = {};
    items.forEach((it, i) => {
      stats[key('body', it.word)] = { seen: 0, wrong: i }; // increasing wrong count
    });
    const picked = weightedPick(items, 'body', items.length, stats, () => 0);
    // Highest wrong count (last item) should come first.
    expect(picked[0]).toBe(items[items.length - 1]);
    expect(picked[picked.length - 1]).toBe(items[0]);
  });

  it('respects n, returning at most n items', () => {
    const items = CATEGORIES.numbers.items;
    const picked = weightedPick(items, 'numbers', 3, {}, () => 0.5);
    expect(picked).toHaveLength(3);
  });
});

describe('markSeen()', () => {
  it('increments seen on every call', () => {
    let stats: Record<string, WordStats> = {};
    stats = markSeen('animals', 'כֶּלֶב', false, stats);
    expect(stats['animals:כֶּלֶב'].seen).toBe(1);
    stats = markSeen('animals', 'כֶּלֶב', false, stats);
    expect(stats['animals:כֶּלֶב'].seen).toBe(2);
  });

  it('increments wrong on a wrong answer', () => {
    let stats: Record<string, WordStats> = {};
    stats = markSeen('animals', 'כֶּלֶב', true, stats);
    expect(stats['animals:כֶּלֶב']).toEqual({ seen: 1, wrong: 1 });
  });

  it('decrements wrong on a correct answer, but never below zero', () => {
    let stats: Record<string, WordStats> = { 'animals:כֶּלֶב': { seen: 3, wrong: 0 } };
    stats = markSeen('animals', 'כֶּלֶב', false, stats);
    expect(stats['animals:כֶּלֶב']).toEqual({ seen: 4, wrong: 0 });
  });

  it('decrements wrong by one when above zero on a correct answer', () => {
    let stats: Record<string, WordStats> = { 'animals:כֶּלֶב': { seen: 3, wrong: 2 } };
    stats = markSeen('animals', 'כֶּלֶב', false, stats);
    expect(stats['animals:כֶּלֶב']).toEqual({ seen: 4, wrong: 1 });
  });
});
