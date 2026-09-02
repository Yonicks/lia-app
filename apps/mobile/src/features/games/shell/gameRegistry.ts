import { minItemsFor } from '@/domain/games/minItems';
import type { GameId } from '@/domain/types';

import { QuizScreen } from '../quiz/QuizScreen';

export interface RegisteredGame {
  id: GameId;
  titleHe: string;
  minItems: number;
  Screen: typeof QuizScreen;
}

/**
 * Phase 8 registers quiz only. Other ids stay on the stub route so a
 * missing registry entry cannot accidentally invent a second game.
 */
export const gameRegistry: Partial<Record<GameId, RegisteredGame>> = {
  quiz: {
    id: 'quiz',
    titleHe: '🎧 איפה ה...?',
    minItems: minItemsFor('quiz'),
    Screen: QuizScreen,
  },
};

export function registeredGame(id: string): RegisteredGame | undefined {
  return gameRegistry[id as GameId];
}
