import { describe, expect, it } from 'vitest';

import { practiceCardAssets } from '@/design-system/assets';
import { PRACTICE_LIST } from '@/domain/practice/list';
import { practiceCardImage } from '@/domain/practice/practiceCards';
import type { PracticeModeId } from '@/domain/types';

/** Registry membership without importing Screen components (RN). */
const REGISTERED_PRACTICE_IDS: PracticeModeId[] = [
  'focus',
  'cloze',
  'temptation',
  'receptive',
  'pairs',
  'combine',
];

describe('Practice hub catalog (Phase 22)', () => {
  it('PRACTICE_LIST has exactly six modes matching the registered set 1:1', () => {
    const listIds = PRACTICE_LIST.map(([id]) => id);
    expect(listIds).toHaveLength(6);
    expect([...listIds].sort()).toEqual([...REGISTERED_PRACTICE_IDS].sort());
  });

  it('preserves canonical PRACTICE_LIST order for the 3×2 grid', () => {
    expect(PRACTICE_LIST.map(([id]) => id)).toEqual([
      'focus',
      'receptive',
      'cloze',
      'temptation',
      'pairs',
      'combine',
    ]);
  });

  it('every mode appears exactly once', () => {
    const seen = new Set<string>();
    for (const [id] of PRACTICE_LIST) {
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(seen.size).toBe(6);
  });

  it('resolves card art for every practice mode id', () => {
    for (const [id] of PRACTICE_LIST) {
      expect(practiceCardImage(id), `missing art for ${id}`).toBeTruthy();
    }
    expect(Object.keys(practiceCardAssets).sort()).toEqual([...REGISTERED_PRACTICE_IDS].sort());
  });
});
