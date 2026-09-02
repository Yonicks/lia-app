import { shuffle } from '@/domain/games/shuffle';
import { weightedPick } from '@/domain/progress/selection';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../shell/types';

export interface MatchState {
  words: TalkiWord[];
  pictures: TalkiWord[];
  sel: string | null;
  matched: string[];
  done: boolean;
}

export type MatchAction = { type: 'SELECT_WORD'; word: string } | { type: 'SELECT_PICTURE'; word: string };

/**
 * index.html 2512-2514, 3560-3577. A wrong picture keeps `sel` (legacy
 * only flashes `.wrong` on the picture).
 */
export function initMatch(ctx: GameInitContext): MatchState {
  const n = Math.min(5, ctx.category.items.length);
  const picks = weightedPick(ctx.category.items, ctx.category.id, n, ctx.stats, ctx.rnd);
  return {
    words: shuffle(picks, ctx.rnd),
    pictures: shuffle(picks, ctx.rnd),
    sel: null,
    matched: [],
    done: false,
  };
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'SELECT_WORD':
      if (state.done || state.matched.includes(action.word)) return state;
      return { ...state, sel: action.word };
    case 'SELECT_PICTURE': {
      if (state.done || !state.sel || state.matched.includes(action.word)) return state;
      if (action.word !== state.sel) return state;
      const matched = [...state.matched, state.sel];
      return {
        ...state,
        matched,
        sel: null,
        done: matched.length === state.words.length,
      };
    }
    default:
      return state;
  }
}

export function matchChips(state: MatchState): string[] {
  return [`חוברו ${state.matched.length}/${state.words.length}`];
}

export function matchResult(state: MatchState) {
  return { score: state.words.length, total: state.words.length };
}
