import { shuffle } from '@/domain/games/shuffle';
import { CLOZE } from '@/domain/practice/content';
import type { ClozeEntry } from '@/domain/types';

import { CLOZE_POOL } from '../practiceTimings';

export type ClozePhase = 'say' | 'wait' | 'model';

export interface ClozeState {
  pool: ClozeEntry[];
  i: number;
  score: number;
  phase: ClozePhase;
  done: boolean;
}

export type ClozeAction =
  | { type: 'PHASE'; phase: ClozePhase }
  | { type: 'NEXT'; scored: boolean };

export function initCloze(rnd: () => number): ClozeState {
  return { pool: shuffle(CLOZE, rnd).slice(0, CLOZE_POOL), i: 0, score: 0, phase: 'say', done: false };
}

export function clozeReducer(state: ClozeState, action: ClozeAction): ClozeState {
  switch (action.type) {
    case 'PHASE':
      if (state.done) return state;
      return { ...state, phase: action.phase };
    case 'NEXT': {
      const score = action.scored ? state.score + 1 : state.score;
      const i = state.i + 1;
      if (i >= state.pool.length) return { ...state, score, i, done: true };
      return { ...state, score, i, phase: 'say', done: false };
    }
    default:
      return state;
  }
}

export function clozeChips(state: ClozeState): string[] {
  return [`${state.i + 1}/${state.pool.length}`, `✅ ${state.score}`];
}

export function clozeResult(state: ClozeState) {
  return { score: state.score, total: state.pool.length, extra: 'כל השלמה נחשבת' };
}

/** index.html 3113 — model speaks answer, then phrase, then answer. */
export function clozeModelSpeech(it: ClozeEntry): string {
  return `${it.answer}. ${it.phrase} ${it.answer}`;
}

export function canFailCloze(_state: ClozeState): false {
  return false;
}
