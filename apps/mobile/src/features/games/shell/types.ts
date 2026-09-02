import type { Dispatch } from 'react';

import type { GameId, TalkiCategory, TalkiSettings, TalkiWord, WordStats } from '@/domain/types';

export interface GameScreenProps {
  catId: string | null;
  seed?: number;
}

export interface GameResult {
  score: number;
  total: number;
  best?: number;
  extra?: string;
}

export interface GameInitContext {
  category: TalkiCategory;
  stats: Record<string, WordStats>;
  settings: TalkiSettings;
  /** Injected RNG — never `Math.random` stubbed globally. */
  rnd: () => number;
}

export interface GameDefinition<S, A> {
  id: GameId;
  titleHe: string;
  minItems: number;
  reducer: (state: S, action: A) => S;
  init: (ctx: GameInitContext) => S;
  Board: React.ComponentType<{ state: S; dispatch: Dispatch<A> }>;
  chips: (state: S) => string[];
  isDone: (state: S) => boolean;
  result: (state: S) => GameResult;
}

export interface WordLike {
  word: string;
}

export type { TalkiWord };
