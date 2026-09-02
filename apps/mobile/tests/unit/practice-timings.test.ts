import { describe, expect, it } from 'vitest';

import {
  CLOZE_POOL,
  CLOZE_WAIT_MS,
  COMBINE_ROUNDS,
  PAIRS_POOL,
  RECEPTIVE_ROUNDS,
  TEMPTATION_LISTEN_MS,
  TEMPTATION_POOL,
} from '@/features/practice/practiceTimings';

describe('practice timings — clinical constants', () => {
  it('cloze wait is exactly 5000 ms', () => {
    expect(CLOZE_WAIT_MS).toBe(5000);
  });

  it('temptation listening timeout is exactly 8000 ms', () => {
    expect(TEMPTATION_LISTEN_MS).toBe(8000);
  });

  it('receptive is exactly 8 rounds', () => {
    expect(RECEPTIVE_ROUNDS).toBe(8);
  });

  it('cloze, temptation and pairs pools are exactly 6', () => {
    expect(CLOZE_POOL).toBe(6);
    expect(TEMPTATION_POOL).toBe(6);
    expect(PAIRS_POOL).toBe(6);
  });

  it('combine is exactly 6 rounds', () => {
    expect(COMBINE_ROUNDS).toBe(6);
  });
});
