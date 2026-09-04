import { describe, expect, it } from 'vitest';

import { gameCardAssets } from '@/design-system/assets';
import { gameCardImage } from '@/domain/games/gameCards';
import { GAMES_HUB_PAGE_SIZE, gameHubPages } from '@/domain/games/gameHubPages';
import { GAME_IDS, GAMES } from '@/domain/games/ids';

/** Registry membership without importing Screen components (RN). */
const REGISTERED_GAME_IDS = [
  'quiz',
  'memory',
  'missing',
  'match',
  'cards',
  'sounds',
  'count',
  'sort',
  'bubbles',
  'puzzle',
  'speech',
] as const;

describe('Games hub paging (Phase 21)', () => {
  it('GAMES catalog matches the eleven registered game ids 1:1', () => {
    expect([...GAME_IDS].sort()).toEqual([...REGISTERED_GAME_IDS].sort());
    expect(GAMES).toHaveLength(11);
  });

  it('chunks into pages of six with a remainder second page', () => {
    const pages = gameHubPages(GAMES, GAMES_HUB_PAGE_SIZE);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(6);
    expect(pages[1]).toHaveLength(5);
    expect(pages.flat().map((g) => g.id)).toEqual(GAME_IDS);
  });

  it('every game appears on exactly one page', () => {
    const pages = gameHubPages(GAMES);
    const seen = new Set<string>();
    for (const page of pages) {
      for (const game of page) {
        expect(seen.has(game.id)).toBe(false);
        seen.add(game.id);
      }
    }
    expect(seen.size).toBe(GAMES.length);
  });

  it('resolves card art for every registered game id', () => {
    for (const id of GAME_IDS) {
      expect(gameCardImage(id), `missing art for ${id}`).toBeTruthy();
    }
    expect(Object.keys(gameCardAssets).sort()).toEqual([...GAME_IDS].sort());
  });
});
