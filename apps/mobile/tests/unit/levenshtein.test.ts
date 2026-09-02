import { describe, expect, it } from 'vitest';

import { levenshtein, speechMatch } from '@/domain/speech/levenshtein';
import { plain } from '@/domain/vocabulary/niqqud';

describe('levenshtein / speechMatch', () => {
  it('distance 0 accepted, 1 accepted, 2 rejected', () => {
    expect(levenshtein('כלב', 'כלב')).toBe(0);
    expect(speechMatch('כלב', 'כלב')).toBe(true);
    expect(levenshtein('כלב', 'כלש')).toBe(1);
    expect(speechMatch('כלש', 'כלב')).toBe(true);
    expect(levenshtein('כלב', 'חתול')).toBeGreaterThan(1);
    expect(speechMatch('חתול', 'כלב')).toBe(false);
  });

  it('Hebrew with and without niqqud compares on the plain form', () => {
    const pointed = 'כֶּלֶב';
    expect(plain(pointed)).toBe('כלב');
    expect(speechMatch(pointed, pointed)).toBe(true);
    expect(speechMatch('כלב', pointed)).toBe(true);
    expect(speechMatch(pointed, 'כלב')).toBe(true);
  });

  it('includes / contained forms also match', () => {
    expect(speechMatch('הכלב', 'כלב')).toBe(true);
    expect(speechMatch('כל', 'כלב')).toBe(true);
  });
});
