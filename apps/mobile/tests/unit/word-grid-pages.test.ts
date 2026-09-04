import { describe, expect, it } from 'vitest';

import { landscapeTokens } from '@/design-system/landscape/tokens';
import type { DeviceClass } from '@/design-system/responsive/breakpoints';
import { CATEGORIES } from '@/domain/vocabulary/categories';
import { wordGridPages, wordGridPageSize } from '@/domain/vocabulary/wordGridPages';

const CLASSES: DeviceClass[] = ['compactPhone', 'phone', 'tablet', 'largeTablet'];

describe('wordGridPages', () => {
  it('chunks preserving order and allows a short final page', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(wordGridPages(items, 4)).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10],
    ]);
  });

  it('returns a single empty page for empty input', () => {
    expect(wordGridPages([], 8)).toEqual([[]]);
  });

  it('rejects invalid page sizes', () => {
    expect(() => wordGridPages([1], 0)).toThrow(/pageSize/);
  });
});

describe('wordGridPageSize + landscape tokens', () => {
  it('is columns × rows for every device class', () => {
    for (const deviceClass of CLASSES) {
      const t = landscapeTokens(deviceClass);
      expect(wordGridPageSize(t.wordGridColumns, t.wordGridRows)).toBe(
        t.wordGridColumns * t.wordGridRows,
      );
      expect(t.wordGridRows).toBe(2);
      expect(t.wordGridColumns).toBeGreaterThanOrEqual(5);
    }
  });

  it('keeps all animals words reachable across pages on compactPhone', () => {
    const t = landscapeTokens('compactPhone');
    const size = wordGridPageSize(t.wordGridColumns, t.wordGridRows);
    const pages = wordGridPages(CATEGORIES.animals.items, size);
    const flat = pages.flat();
    expect(flat).toHaveLength(CATEGORIES.animals.items.length);
    expect(flat.map((w) => w.word)).toEqual(CATEGORIES.animals.items.map((w) => w.word));
    expect(pages.length).toBeGreaterThan(1);
  });

  it('fits small categories (emotions) on one compact page', () => {
    const t = landscapeTokens('compactPhone');
    const size = wordGridPageSize(t.wordGridColumns, t.wordGridRows);
    expect(CATEGORIES.emotions.items.length).toBeLessThanOrEqual(size);
    expect(wordGridPages(CATEGORIES.emotions.items, size)).toHaveLength(1);
  });
});
