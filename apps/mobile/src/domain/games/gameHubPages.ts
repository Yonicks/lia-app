import type { GameMenuEntry } from '../types';

/** Games hub page size — matches the 3×2 reference composition. */
export const GAMES_HUB_PAGE_SIZE = 6;

/**
 * Chunks the live games menu into pages of up to `pageSize` (default 6).
 * Order is preserved; incomplete final pages are allowed (empty grid slots
 * are padded by `LandscapeActivityGrid`).
 */
export function gameHubPages(
  games: readonly GameMenuEntry[],
  pageSize: number = GAMES_HUB_PAGE_SIZE,
): GameMenuEntry[][] {
  if (pageSize < 1) throw new Error('gameHubPages: pageSize must be >= 1');
  const pages: GameMenuEntry[][] = [];
  for (let i = 0; i < games.length; i += pageSize) {
    pages.push(games.slice(i, i + pageSize) as GameMenuEntry[]);
  }
  return pages.length > 0 ? pages : [[]];
}
