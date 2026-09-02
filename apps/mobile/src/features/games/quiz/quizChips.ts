import { doneCardStars } from '@/domain/games/doneStars';

import type { GameResult } from '../shell/types';
import type { QuizState } from './quizReducer';

/** index.html 2577 — `שאלה i+1/n`, `✅ score`, `🔥 רצף streak`. */
export function quizChips(state: QuizState): string[] {
  return [`שאלה ${state.i + 1}/${state.pool.length}`, `✅ ${state.score}`, `🔥 רצף ${state.streak}`];
}

export function quizResult(state: QuizState): GameResult {
  return { score: state.score, total: state.pool.length, best: state.best };
}

export function quizStars(state: QuizState): 1 | 2 | 3 {
  return doneCardStars(state.score, state.pool.length);
}
