import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import {
  PUZZLE_STEPS,
  puzzleAdvance,
  puzzleCapacity,
  puzzleLevel,
  puzzleSize,
} from '@/domain/games/puzzle';
import { DEFAULT_SETTINGS } from '@/domain/settings/defaults';
import type { TalkiSettings } from '@/domain/types';
import { K } from '@/services/storage/keys';

import { createInMemoryStorage } from './helpers/inMemoryStorage';

describe('puzzle difficulty', () => {
  it('PUZZLE_STEPS is [2,3,4,5,6]', () => {
    expect(PUZZLE_STEPS).toEqual([2, 3, 4, 5, 6]);
  });

  it('puzzleCapacity boundaries on both sides of 620, 360 and 780', () => {
    expect(puzzleCapacity(619, 400)).toBe(3);
    expect(puzzleCapacity(620, 400)).toBe(4);
    expect(puzzleCapacity(800, 359)).toBe(3);
    expect(puzzleCapacity(800, 360)).toBe(6);
    expect(puzzleCapacity(779, 400)).toBe(4);
    expect(puzzleCapacity(780, 400)).toBe(6);
  });

  it('puzzleLevel clamps 1..5 and handles missing or non-numeric settings', () => {
    expect(puzzleLevel(undefined)).toBe(1);
    expect(puzzleLevel(null)).toBe(1);
    expect(puzzleLevel('x')).toBe(1);
    expect(puzzleLevel(0)).toBe(1);
    expect(puzzleLevel(6)).toBe(5);
    expect(puzzleLevel(3)).toBe(3);
    expect(puzzleLevel('4')).toBe(4);
  });

  it('puzzleSize is min(STEPS[level-1], capacity) and never below 2', () => {
    expect(puzzleSize(1, 6)).toBe(2);
    expect(puzzleSize(5, 6)).toBe(6);
    expect(puzzleSize(5, 3)).toBe(3);
    expect(puzzleSize(1, 1)).toBe(2);
    expect(puzzleSize(3, 4)).toBe(4);
  });

  it('puzzleAdvance: up at 0 and 1, unchanged at 2-4, down at 5+, never outside 1..5', () => {
    expect(puzzleAdvance(3, 0)).toBe(4);
    expect(puzzleAdvance(3, 1)).toBe(4);
    expect(puzzleAdvance(3, 2)).toBe(3);
    expect(puzzleAdvance(3, 3)).toBe(3);
    expect(puzzleAdvance(3, 4)).toBe(3);
    expect(puzzleAdvance(3, 5)).toBe(2);
    expect(puzzleAdvance(3, 9)).toBe(2);
    expect(puzzleAdvance(5, 0)).toBe(5);
    expect(puzzleAdvance(1, 5)).toBe(1);
  });

  it('the new level is persisted on the settings record', async () => {
    const mem = createInMemoryStorage();
    const next: TalkiSettings = { ...DEFAULT_SETTINGS, puzzleLevel: 4 };
    await mem.set(K.settings, next);
    expect((await mem.get<TalkiSettings>(K.settings))?.puzzleLevel).toBe(4);
  });
});
