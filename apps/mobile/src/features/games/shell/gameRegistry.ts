import type { ComponentType } from 'react';

import { minItemsFor } from '@/domain/games/minItems';
import type { GameId } from '@/domain/types';

import { CardsScreen } from '../cards/CardsScreen';
import { MatchScreen } from '../match/MatchScreen';
import { MemoryScreen } from '../memory/MemoryScreen';
import { MissingScreen } from '../missing/MissingScreen';
import { QuizScreen } from '../quiz/QuizScreen';
import type { GameScreenProps } from './types';

export interface RegisteredGame {
  id: GameId;
  titleHe: string;
  minItems: number;
  Screen: ComponentType<GameScreenProps>;
}

/**
 * Phase 9 registers quiz + wave A. Remaining ids stay on the stub route.
 */
export const gameRegistry: Partial<Record<GameId, RegisteredGame>> = {
  quiz: {
    id: 'quiz',
    titleHe: '🎧 איפה ה...?',
    minItems: minItemsFor('quiz'),
    Screen: QuizScreen,
  },
  memory: {
    id: 'memory',
    titleHe: '🃏 משחק זיכרון',
    minItems: minItemsFor('memory'),
    Screen: MemoryScreen,
  },
  missing: {
    id: 'missing',
    titleHe: '🙈 מה נעלם?',
    minItems: minItemsFor('missing'),
    Screen: MissingScreen,
  },
  match: {
    id: 'match',
    titleHe: '🔗 חיבורים',
    minItems: minItemsFor('match'),
    Screen: MatchScreen,
  },
  cards: {
    id: 'cards',
    titleHe: '🖼️ כרטיסיות',
    minItems: 1,
    Screen: CardsScreen,
  },
};

export function registeredGame(id: string): RegisteredGame | undefined {
  return gameRegistry[id as GameId];
}
