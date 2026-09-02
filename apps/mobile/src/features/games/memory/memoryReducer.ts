import { shuffle } from '@/domain/games/shuffle';
import { weightedPick } from '@/domain/progress/selection';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../shell/types';

export type MemoryKind = 'pic' | 'word';

export interface MemoryCard {
  pair: number;
  kind: MemoryKind;
  it: TalkiWord;
  idx: number;
  open: boolean;
  matched: boolean;
}

export interface MemoryState {
  cards: MemoryCard[];
  first: number | null;
  moves: number;
  found: number;
  total: number;
  locked: boolean;
  done: boolean;
}

export type MemoryAction =
  | { type: 'FLIP'; idx: number }
  | { type: 'CLOSE' };

/**
 * index.html 2503-2508, 3512-3533. Twelve cards from six pairs when the
 * category has at least six items; fewer picks if weightedPick returns less.
 */
export function initMemory(ctx: GameInitContext): MemoryState {
  const picks = weightedPick(ctx.category.items, ctx.category.id, 6, ctx.stats, ctx.rnd);
  const cards = shuffle(
    picks.flatMap((it, n) => [
      { pair: n, kind: 'pic' as const, it },
      { pair: n, kind: 'word' as const, it },
    ]),
    ctx.rnd,
  ).map((c, i) => ({ ...c, idx: i, open: false, matched: false }));
  return {
    cards,
    first: null,
    moves: 0,
    found: 0,
    total: picks.length,
    locked: false,
    done: false,
  };
}

export function memoryReducer(state: MemoryState, action: MemoryAction): MemoryState {
  switch (action.type) {
    case 'FLIP': {
      if (state.locked || state.done) return state;
      const card = state.cards[action.idx];
      if (!card || card.open || card.matched) return state;
      const openUnmatched = state.cards.filter((c) => c.open && !c.matched);
      if (openUnmatched.length >= 2) return state;

      const cards = state.cards.map((c) => (c.idx === action.idx ? { ...c, open: true } : c));
      if (state.first === null) {
        return { ...state, cards, first: action.idx };
      }
      const a = cards[state.first];
      if (!a) return { ...state, cards, first: null };
      const moves = state.moves + 1;
      if (a.pair === card.pair && a.idx !== card.idx) {
        const next = cards.map((c) => (c.pair === card.pair ? { ...c, matched: true, open: true } : c));
        const found = state.found + 1;
        return {
          ...state,
          cards: next,
          first: null,
          moves,
          found,
          locked: false,
          done: found === state.total,
        };
      }
      return { ...state, cards, first: state.first, moves, locked: true };
    }
    case 'CLOSE': {
      const cards = state.cards.map((c) => (c.open && !c.matched ? { ...c, open: false } : c));
      return { ...state, cards, first: null, locked: false };
    }
    default:
      return state;
  }
}

export function memoryChips(state: MemoryState): string[] {
  return [`זוגות ${state.found}/${state.total}`, `ניסיונות ${state.moves}`];
}

export function memoryResult(state: MemoryState) {
  return { score: state.total, total: state.total, extra: `סיימת ב-${state.moves} ניסיונות` };
}
