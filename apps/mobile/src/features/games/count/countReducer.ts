import { shuffle } from '@/domain/games/shuffle';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../shell/types';

export const COUNT_ROUNDS = 5;

export interface CountState {
  it: TalkiWord;
  n: number;
  options: number[];
  round: number;
  score: number;
  locked: boolean;
  done: boolean;
}

export type CountAction =
  | { type: 'ANSWER'; n: number }
  | { type: 'UNLOCK' }
  | { type: 'ADVANCE'; next: CountState };

export function setupCountRound(ctx: GameInitContext, round: number, score: number): CountState {
  if (round >= COUNT_ROUNDS) {
    return { it: ctx.category.items[0]!, n: 1, options: [], round, score, locked: true, done: true };
  }
  const pool = ctx.category.items.filter((i) => !i.photo);
  const source = pool.length ? pool : ctx.category.items;
  const it = source[Math.floor(ctx.rnd() * source.length)]!;
  const n = 1 + Math.floor(ctx.rnd() * 5);
  const opts = new Set<number>([n]);
  while (opts.size < 3) opts.add(1 + Math.floor(ctx.rnd() * 5));
  return { it, n, options: shuffle([...opts], ctx.rnd), round, score, locked: false, done: false };
}

export function initCount(ctx: GameInitContext): CountState {
  return setupCountRound(ctx, 0, 0);
}

export function countReducer(state: CountState, action: CountAction): CountState {
  switch (action.type) {
    case 'ANSWER': {
      if (state.locked || state.done) return state;
      const ok = action.n === state.n;
      return { ...state, locked: true, score: ok ? state.score + 1 : state.score };
    }
    case 'UNLOCK':
      return { ...state, locked: false };
    case 'ADVANCE':
      return action.next;
    default:
      return state;
  }
}

export function countChips(state: CountState): string[] {
  return [`סיבוב ${state.round + 1}/5`, `✅ ${state.score}`];
}

export function countResult(state: CountState) {
  return { score: state.score, total: COUNT_ROUNDS };
}
