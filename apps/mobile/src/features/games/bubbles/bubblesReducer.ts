import type { TalkiWord } from '@/domain/types';

export const BUBBLE_TOTAL = 12;
export const BUBBLE_INTERVAL_MS = 1400;

export interface Bubble {
  id: number;
  word: TalkiWord;
  size: number;
  start: number;
  drift: number;
  duration: number;
}

export interface BubblesState {
  popped: number;
  total: number;
  nextId: number;
  live: Bubble[];
  done: boolean;
}

export type BubblesAction =
  | { type: 'SPAWN'; word: TalkiWord; rnd: () => number }
  | { type: 'POP'; id: number }
  | { type: 'EXPIRE'; id: number };

export function initBubbles(): BubblesState {
  return { popped: 0, total: BUBBLE_TOTAL, nextId: 0, live: [], done: false };
}

export function bubblesReducer(state: BubblesState, action: BubblesAction): BubblesState {
  switch (action.type) {
    case 'SPAWN': {
      if (state.done) return state;
      const bubble: Bubble = {
        id: state.nextId,
        word: action.word,
        size: 84 + action.rnd() * 46,
        start: 4 + action.rnd() * 74,
        drift: action.rnd() * 60 - 30,
        duration: 8 + action.rnd() * 4,
      };
      return { ...state, nextId: state.nextId + 1, live: [...state.live, bubble] };
    }
    case 'POP': {
      if (state.done) return state;
      const live = state.live.filter((b) => b.id !== action.id);
      const popped = state.popped + 1;
      return { ...state, live, popped, done: popped >= state.total };
    }
    case 'EXPIRE':
      return { ...state, live: state.live.filter((b) => b.id !== action.id) };
    default:
      return state;
  }
}

export function bubblesChips(state: BubblesState): string[] {
  return [`🫧 ${state.popped}/${state.total}`];
}

export function bubblesResult(state: BubblesState) {
  return { score: state.popped, total: state.total, extra: 'כל הבועות התפוצצו' };
}
