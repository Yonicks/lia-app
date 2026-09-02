import type { GameId } from '../types';

/**
 * Ported verbatim from index.html 2237-2241 — the Home games row is three
 * FIXED games, not all eleven from `GAMES` (games/ids.ts). Order matters:
 * memory, then quiz, then missing, exactly as legacy's array literal.
 */
export interface HomeGameEntry {
  id: GameId;
  title: string;
}

export const HOME_GAMES: HomeGameEntry[] = [
  { id: 'memory', title: 'משחק זיכרון' },
  { id: 'quiz', title: 'איפה ה...?' },
  { id: 'missing', title: 'מה נעלם?' },
];
