import { weightedPick } from '@/domain/progress/selection';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../../games/shell/types';
import { TEMPTATION_POOL } from '../practiceTimings';

export interface TemptationState {
  pool: TalkiWord[];
  i: number;
  opened: boolean;
  listening: boolean;
  done: boolean;
}

export type TemptationAction =
  | { type: 'OPEN' }
  | { type: 'LISTEN'; on: boolean }
  | { type: 'NEXT' };

export function initTemptation(ctx: GameInitContext): TemptationState {
  const pool = weightedPick(ctx.category.items, ctx.category.id, TEMPTATION_POOL, ctx.stats, ctx.rnd);
  return { pool, i: 0, opened: false, listening: false, done: false };
}

export function temptationReducer(state: TemptationState, action: TemptationAction): TemptationState {
  switch (action.type) {
    case 'OPEN':
      if (state.done || state.opened) return state;
      return { ...state, opened: true, listening: false };
    case 'LISTEN':
      if (state.done || state.opened) return state;
      return { ...state, listening: action.on };
    case 'NEXT': {
      if (!state.opened || state.done) return state;
      const i = state.i + 1;
      if (i >= state.pool.length) return { ...state, i, done: true, opened: true };
      return { ...state, i, opened: false, listening: false };
    }
    default:
      return state;
  }
}

export function temptationChips(state: TemptationState): string[] {
  return [`${state.i + 1}/${state.pool.length}`];
}

export function temptationResult(state: TemptationState) {
  return { score: state.pool.length, total: state.pool.length, extra: 'הכול נפתח' };
}

export function canFailTemptation(_state: TemptationState): false {
  return false;
}

/** index.html 3909-3911 — any recognition result or speechstart opens. */
export function temptationOpensOnRecognition(_result: { recognized: boolean; transcript: string | null }): true {
  return true;
}

export function temptationTimeoutFailsRound(): false {
  return false;
}
