import { shuffle } from '@/domain/games/shuffle';
import { weightedPick } from '@/domain/progress/selection';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../shell/types';

export type MissingPhase = 'show' | 'ask';

export interface MissingState {
  set: TalkiWord[];
  missing: TalkiWord;
  askOrder: TalkiWord[];
  phase: MissingPhase;
  round: number;
  score: number;
  locked: boolean;
  asked: boolean;
  done: boolean;
}

export type MissingAction =
  | { type: 'ASK' }
  | { type: 'GUESS'; word: string }
  | { type: 'ADVANCE'; next: MissingState };

const ROUNDS = 5;

export function setupMissingRound(
  ctx: GameInitContext,
  round: number,
  score: number,
): MissingState {
  const set = shuffle(weightedPick(ctx.category.items, ctx.category.id, 4, ctx.stats, ctx.rnd), ctx.rnd);
  const missing = set[Math.floor(ctx.rnd() * set.length)] ?? set[0]!;
  return {
    set,
    missing,
    askOrder: shuffle([...set], ctx.rnd),
    phase: 'show',
    round,
    score,
    locked: false,
    asked: false,
    done: false,
  };
}

export function initMissing(ctx: GameInitContext): MissingState {
  return setupMissingRound(ctx, 0, 0);
}

export function missingReducer(state: MissingState, action: MissingAction): MissingState {
  switch (action.type) {
    case 'ASK':
      if (state.phase !== 'show' || state.done) return state;
      return { ...state, phase: 'ask' };
    case 'GUESS': {
      if (state.locked || state.done || state.phase !== 'ask') return state;
      const ok = action.word === state.missing.word;
      return { ...state, locked: true, score: ok ? state.score + 1 : state.score };
    }
    case 'ADVANCE':
      return action.next;
    default:
      return state;
  }
}

export function missingFinish(state: MissingState): MissingState {
  return { ...state, done: true, locked: true };
}

export function shouldFinishMissing(state: MissingState): boolean {
  return state.round + 1 >= ROUNDS;
}

export function missingChips(state: MissingState): string[] {
  return [`סיבוב ${state.round + 1}/5`, `✅ ${state.score}`];
}

export function missingResult(state: MissingState) {
  return { score: state.score, total: ROUNDS };
}

export { ROUNDS as MISSING_ROUNDS };
