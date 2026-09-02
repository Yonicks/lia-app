import type { ComponentType } from 'react';

import { minItemsFor } from '@/domain/games/minItems';
import type { GameId } from '@/domain/types';

import { BubblesScreen } from '../bubbles/BubblesScreen';
import { CardsScreen } from '../cards/CardsScreen';
import { CountScreen } from '../count/CountScreen';
import { MatchScreen } from '../match/MatchScreen';
import { MemoryScreen } from '../memory/MemoryScreen';
import { MissingScreen } from '../missing/MissingScreen';
import { PuzzleScreen } from '../puzzle/PuzzleScreen';
import { QuizScreen } from '../quiz/QuizScreen';
import { SortScreen } from '../sort/SortScreen';
import { SpeechScreen } from '../speech/SpeechScreen';
import { SoundsScreen } from '../sounds/SoundsScreen';
import type { GameScreenProps } from './types';

export interface RegisteredGame {
  id: GameId;
  titleHe: string;
  minItems: number;
  Screen: ComponentType<GameScreenProps>;
}

/**
 * Phase 10 registers the full eleven-game catalogue.
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
  sounds: {
    id: 'sounds',
    titleHe: '🐮 מי אמר את זה?',
    minItems: minItemsFor('sounds'),
    Screen: SoundsScreen,
  },
  count: {
    id: 'count',
    titleHe: '🔢 כמה יש?',
    minItems: minItemsFor('count'),
    Screen: CountScreen,
  },
  sort: {
    id: 'sort',
    titleHe: '📦 לאיזו קופסה?',
    minItems: minItemsFor('sort'),
    Screen: SortScreen,
  },
  bubbles: {
    id: 'bubbles',
    titleHe: '🫧 בועות מילים',
    minItems: minItemsFor('bubbles'),
    Screen: BubblesScreen,
  },
  puzzle: {
    id: 'puzzle',
    titleHe: '🧩 שִׂימִי בַּמָּקוֹם',
    minItems: minItemsFor('puzzle'),
    Screen: PuzzleScreen,
  },
  speech: {
    id: 'speech',
    titleHe: '🎤 תגידי את זה',
    minItems: minItemsFor('speech'),
    Screen: SpeechScreen,
  },
};

export function registeredGame(id: string): RegisteredGame | undefined {
  return gameRegistry[id as GameId];
}
