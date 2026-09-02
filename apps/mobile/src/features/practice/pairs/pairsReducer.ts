import { shuffle } from '@/domain/games/shuffle';
import { PAIRS } from '@/domain/practice/content';
import type { PairWord } from '@/domain/types';

import { e2ePlaceCorrectAt } from '../../games/shell/e2eSeed';
import { PAIRS_POOL } from '../practiceTimings';

export interface PairsState {
  pool: [PairWord, PairWord][];
  i: number;
  score: number;
  target: PairWord;
  shown: PairWord[];
  locked: boolean;
  done: boolean;
}

export type PairsAction =
  | { type: 'ANSWER'; word: string }
  | { type: 'UNLOCK' }
  | { type: 'ADVANCE'; rnd: () => number };

export function setupPairsRound(
  pool: [PairWord, PairWord][],
  i: number,
  rnd: () => number,
): Pick<PairsState, 'target' | 'shown' | 'locked' | 'done'> {
  if (i >= pool.length) {
    const last = pool[pool.length - 1]![0];
    return { target: last, shown: [], locked: true, done: true };
  }
  const pair = pool[i]!;
  const target = pair[Math.floor(rnd() * 2)]!;
  let shown = shuffle([...pair], rnd);
  const at = e2ePlaceCorrectAt();
  if (typeof at === 'number') {
    const idx = shown.findIndex((o) => o.word === target.word);
    if (idx >= 0) {
      const next = [...shown];
      const [hit] = next.splice(idx, 1);
      next.splice(Math.min(at, next.length), 0, hit!);
      shown = next;
    }
  }
  return {
    target,
    shown,
    locked: false,
    done: false,
  };
}

export function initPairs(rnd: () => number): PairsState {
  const pool = shuffle(PAIRS, rnd).slice(0, PAIRS_POOL) as [PairWord, PairWord][];
  return { pool, i: 0, score: 0, ...setupPairsRound(pool, 0, rnd) };
}

export function pairsReducer(state: PairsState, action: PairsAction): PairsState {
  switch (action.type) {
    case 'UNLOCK':
      return { ...state, locked: false };
    case 'ANSWER': {
      if (state.locked || state.done) return state;
      const ok = action.word === state.target.word;
      if (!ok) return state;
      return { ...state, locked: true, score: state.score + 1 };
    }
    case 'ADVANCE': {
      const i = state.i + 1;
      return { ...state, i, ...setupPairsRound(state.pool, i, action.rnd), locked: false };
    }
    default:
      return state;
  }
}

export function pairsChips(state: PairsState): string[] {
  return [`${state.i + 1}/${state.pool.length}`, `✅ ${state.score}`];
}

export function pairsResult(state: PairsState) {
  return { score: state.score, total: state.pool.length };
}

export function canFailPairs(_state: PairsState): false {
  return false;
}
