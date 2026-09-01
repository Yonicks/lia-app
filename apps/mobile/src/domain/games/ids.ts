import type { GameId, GameMenuEntry } from '../types';

/**
 * Ported from index.html 2355-2377 (renderGamesMenu). Not a top-level
 * const in legacy — the 11 ids and titles live split across three literals
 * (a 7-entry grid, one wide "match" button, a 3-entry extras list) inside
 * the render function. Order here follows the order they appear on screen:
 * grid first, then the wide button, then extras.
 */
export const GAMES: GameMenuEntry[] = [
  { id: 'quiz', title: 'איפה ה...?' },
  { id: 'memory', title: 'משחק זיכרון' },
  { id: 'missing', title: 'מה נעלם?' },
  { id: 'cards', title: 'כרטיסיות' },
  { id: 'sounds', title: 'מי אמר את זה?' },
  { id: 'count', title: 'כמה יש?' },
  { id: 'puzzle', title: 'שימי במקום' },
  { id: 'match', title: 'חיבורים' },
  { id: 'bubbles', title: 'בועות מילים' },
  { id: 'sort', title: 'לאיזו קופסה?' },
  { id: 'speech', title: 'תגידי את זה' },
];

export const GAME_IDS: GameId[] = GAMES.map((g) => g.id);
