import { weightedPick } from '@/domain/progress/selection';
import type { CategoryId, TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../shell/types';
import { placeCorrectAt, setupQuizRound } from './setupQuizRound';

export interface QuizState {
  type: 'quiz';
  catId: CategoryId;
  pool: TalkiWord[];
  i: number;
  score: number;
  streak: number;
  best: number;
  locked: boolean;
  done: boolean;
  asked: boolean;
  target: TalkiWord;
  options: TalkiWord[];
}

export type QuizAction =
  | { type: 'RESET'; next: QuizState }
  | { type: 'MARK_ASKED' }
  | { type: 'ANSWER'; word: string }
  | { type: 'ADVANCE'; categoryItems: TalkiWord[]; rnd: () => number; placeCorrectAt?: number }
  | { type: 'UNLOCK' };

export interface QuizInitOptions {
  placeCorrectAt?: number;
}

export function initQuiz(ctx: GameInitContext, opts: QuizInitOptions = {}): QuizState {
  const n = Math.min(8, ctx.category.items.length);
  const pool = weightedPick(ctx.category.items, ctx.category.id, n, ctx.stats, ctx.rnd);
  const round = setupQuizRound(pool, 0, ctx.category, ctx.rnd);
  const options =
    opts.placeCorrectAt !== undefined && !round.done
      ? placeCorrectAt(round.options, round.target, opts.placeCorrectAt)
      : round.options;
  return {
    type: 'quiz',
    catId: ctx.category.id,
    pool,
    i: 0,
    score: 0,
    streak: 0,
    best: 0,
    ...round,
    options,
  };
}

/**
 * Pure quiz reducer. Side effects (speech, SFX, markSeen, markLearned,
 * timers) stay in the screen. Same state + action + seed = same result.
 */
export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'RESET':
      return action.next;
    case 'MARK_ASKED':
      return { ...state, asked: true };
    case 'UNLOCK':
      return { ...state, locked: false };
    case 'ANSWER': {
      if (state.locked || state.done) return state;
      const ok = action.word === state.target.word;
      if (ok) {
        const streak = state.streak + 1;
        return {
          ...state,
          locked: true,
          score: state.score + 1,
          streak,
          best: Math.max(state.best, streak),
        };
      }
      return { ...state, locked: true, streak: 0 };
    }
    case 'ADVANCE': {
      const i = state.i + 1;
      if (i >= state.pool.length) {
        return { ...state, i, done: true, locked: true, asked: true };
      }
      const round = setupQuizRound(state.pool, i, { id: state.catId, items: action.categoryItems }, action.rnd);
      const options =
        action.placeCorrectAt !== undefined && !round.done
          ? placeCorrectAt(round.options, round.target, action.placeCorrectAt)
          : round.options;
      return {
        ...state,
        i,
        ...round,
        options,
      };
    }
    default:
      return state;
  }
}
