import { weightedPick } from '@/domain/progress/selection';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../../games/shell/types';
import { speechMatch } from '@/domain/speech/levenshtein';

export interface SpeechState {
  pool: TalkiWord[];
  i: number;
  score: number;
  listening: boolean;
  feedback: string;
  done: boolean;
  unsupported: boolean;
}

export type SpeechAction =
  | { type: 'UNSUPPORTED' }
  | { type: 'LISTEN'; on: boolean }
  | { type: 'RESULT'; heard: string }
  | { type: 'SKIP' }
  | { type: 'CLEAR_FEEDBACK' };

export function initSpeech(ctx: GameInitContext): SpeechState {
  const n = Math.min(6, ctx.category.items.length);
  return {
    pool: weightedPick(ctx.category.items, ctx.category.id, n, ctx.stats, ctx.rnd),
    i: 0,
    score: 0,
    listening: false,
    feedback: '',
    done: false,
    unsupported: false,
  };
}

export function speechReducer(state: SpeechState, action: SpeechAction): SpeechState {
  switch (action.type) {
    case 'UNSUPPORTED':
      return { ...state, unsupported: true };
    case 'LISTEN':
      return { ...state, listening: action.on, feedback: action.on ? 'מקשיבים...' : state.feedback };
    case 'RESULT': {
      const target = state.pool[state.i];
      if (!target || state.done) return state;
      const ok = speechMatch(action.heard, target.word);
      if (ok) {
        return { ...state, listening: false, score: state.score + 1, feedback: 'מעולה! שמענו אותך 🎉' };
      }
      return { ...state, listening: false, feedback: `שמענו "${action.heard}" — ננסה שוב?` };
    }
    case 'SKIP': {
      const i = state.i + 1;
      if (i >= state.pool.length) return { ...state, i, done: true, listening: false, feedback: '' };
      return { ...state, i, listening: false, feedback: '' };
    }
    case 'CLEAR_FEEDBACK': {
      if (!state.feedback.includes('מעולה')) return state;
      const i = state.i + 1;
      if (i >= state.pool.length) return { ...state, i, done: true, feedback: '' };
      return { ...state, i, feedback: '' };
    }
    default:
      return state;
  }
}

export function speechChips(state: SpeechState): string[] {
  return [`מילה ${state.i + 1}/${state.pool.length}`, `✅ ${state.score}`];
}

export function speechResult(state: SpeechState) {
  return { score: state.score, total: state.pool.length };
}

export function canFailSpeech(_state: SpeechState): false {
  return false;
}
