import { weightedPick } from '@/domain/progress/selection';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../../games/shell/types';
import { COMBINE_ROUNDS } from '../practiceTimings';

export interface CombineState {
  round: number;
  mod: string | null;
  phrase: string;
  pics: TalkiWord[];
  done: boolean;
}

export type CombineAction =
  | { type: 'SELECT_MOD'; w: string }
  | { type: 'PICK'; word: string; phrase: string }
  | { type: 'FINISH' };

export function initCombine(ctx: GameInitContext): CombineState {
  return {
    round: 0,
    mod: null,
    phrase: '',
    pics: weightedPick(ctx.category.items, ctx.category.id, 3, ctx.stats, ctx.rnd),
    done: false,
  };
}

export function combineReducer(state: CombineState, action: CombineAction): CombineState {
  switch (action.type) {
    case 'SELECT_MOD':
      if (state.done) return state;
      return { ...state, mod: action.w, phrase: '' };
    case 'PICK': {
      if (state.done) return state;
      const round = state.round + 1;
      return { ...state, phrase: action.phrase, round, done: false };
    }
    case 'FINISH':
      return { ...state, done: true };
    default:
      return state;
  }
}

export function combineChips(state: CombineState): string[] {
  return [`צירוף ${state.round}/6`];
}

export function combineResult(state: CombineState) {
  return { score: state.round, total: COMBINE_ROUNDS, extra: 'צירופים נבנו' };
}

export function canFailCombine(_state: CombineState): false {
  return false;
}
