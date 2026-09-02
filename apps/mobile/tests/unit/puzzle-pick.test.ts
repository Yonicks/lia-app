import { describe, expect, it } from 'vitest';

import { puzzlePick } from '@/domain/games/puzzle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import { plain } from '@/domain/vocabulary/niqqud';

function word(w: string, shape: string): TalkiWord {
  return { word: w, emoji: 'x', shape };
}

function cat(items: TalkiWord[]): TalkiCategory {
  return { id: 'animals', title: 'x', icon: 'x', cls: 'c-animals', items };
}

const distinct = cat([
  word('אַלֶף', 'round'),
  word('בֵּית', 'tall'),
  word('גִּימֶל', 'wide'),
  word('דָּלֶת', 'small'),
  word('הֵא', 'long'),
  word('וָו', 'box'),
]);

describe('puzzlePick', () => {
  it('returns exactly n pieces', () => {
    const rnd = () => 0.1;
    expect(puzzlePick(distinct, 4, {}, rnd)).toHaveLength(4);
  });

  it('prefers distinct first letters when the pool allows', () => {
    const picks = puzzlePick(distinct, 4, {}, () => 0.2);
    const initials = picks.map((p) => plain(p.word)[0]);
    expect(new Set(initials).size).toBe(4);
  });

  it('prefers distinct shape tags when the pool allows', () => {
    const picks = puzzlePick(distinct, 4, {}, () => 0.2);
    const shapes = picks.map((p) => p.shape);
    expect(new Set(shapes).size).toBe(4);
  });

  it('backfills when the constraints cannot all be met', () => {
    const same = cat([
      word('אַלֶף', 'round'),
      word('אַבָּא', 'round'),
      word('אֵם', 'round'),
      word('אֹרֶז', 'round'),
    ]);
    const picks = puzzlePick(same, 3, {}, () => 0.1);
    expect(picks).toHaveLength(3);
  });

  it('never returns fewer than n when the category has enough items', () => {
    const picks = puzzlePick(distinct, 6, {}, () => 0.3);
    expect(picks).toHaveLength(6);
  });
});
