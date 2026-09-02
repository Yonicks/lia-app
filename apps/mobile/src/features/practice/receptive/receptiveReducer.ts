import { shuffle } from '@/domain/games/shuffle';
import { weightedPick } from '@/domain/progress/selection';
import type { TalkiWord } from '@/domain/types';

import { e2ePlaceCorrectAt } from '../../games/shell/e2eSeed';
import type { GameInitContext } from '../../games/shell/types';
import {
  RECEPTIVE_MAX_LEVEL,
  RECEPTIVE_MIN_LEVEL,
  RECEPTIVE_MISS_DOWN,
  RECEPTIVE_ROUNDS,
  RECEPTIVE_RUN_UP,
  RECEPTIVE_START_LEVEL,
} from '../practiceTimings';

export interface ReceptiveState {
  catId: string;
  level: number;
  i: number;
  score: number;
  run: number;
  miss: number;
  locked: boolean;
  done: boolean;
  target: TalkiWord;
  options: TalkiWord[];
}

export type ReceptiveAction =
  | { type: 'ANSWER'; word: string; items: TalkiWord[]; rnd: () => number }
  | { type: 'UNLOCK' };

export function setupReceptiveRound(
  items: TalkiWord[],
  catId: string,
  level: number,
  rnd: () => number,
  stats: GameInitContext['stats'],
): Pick<ReceptiveState, 'target' | 'options' | 'locked'> {
  const target = weightedPick(items, catId, 1, stats, rnd)[0] ?? items[0]!;
  const others = shuffle(
    items.filter((i) => i.word !== target.word),
    rnd,
  ).slice(0, Math.max(0, level - 1));
  let options = shuffle([target, ...others], rnd);
  const at = e2ePlaceCorrectAt();
  if (typeof at === 'number') {
    const idx = options.findIndex((o) => o.word === target.word);
    if (idx >= 0) {
      const next = [...options];
      const [hit] = next.splice(idx, 1);
      next.splice(Math.min(at, next.length), 0, hit!);
      options = next;
    }
  }
  return { target, options, locked: false };
}

export function initReceptive(ctx: GameInitContext): ReceptiveState {
  const level = RECEPTIVE_START_LEVEL;
  return {
    catId: ctx.category.id,
    level,
    i: 0,
    score: 0,
    run: 0,
    miss: 0,
    done: false,
    ...setupReceptiveRound(ctx.category.items, ctx.category.id, level, ctx.rnd, ctx.stats),
  };
}

export function receptiveColumns(optionCount: number): 2 | 3 {
  if (optionCount <= 2) return 2;
  if (optionCount === 3) return 3;
  return 2;
}

export function receptiveReducer(state: ReceptiveState, action: ReceptiveAction): ReceptiveState {
  switch (action.type) {
    case 'UNLOCK':
      return { ...state, locked: false };
    case 'ANSWER': {
      if (state.locked || state.done) return state;
      const ok = action.word === state.target.word;
      if (ok) {
        let level = state.level;
        let run = state.run + 1;
        if (run >= RECEPTIVE_RUN_UP && level < RECEPTIVE_MAX_LEVEL) {
          level += 1;
          run = 0;
        }
        const i = state.i + 1;
        if (i >= RECEPTIVE_ROUNDS) {
          return { ...state, locked: true, score: state.score + 1, run, miss: 0, level, i, done: true };
        }
        return {
          ...state,
          score: state.score + 1,
          run,
          miss: 0,
          level,
          i,
          ...setupReceptiveRound(action.items, state.catId, level, action.rnd, {}),
          locked: true,
        };
      }
      const miss = state.miss + 1;
      if (miss >= RECEPTIVE_MISS_DOWN && state.level > RECEPTIVE_MIN_LEVEL) {
        const level = state.level - 1;
        return {
          ...state,
          run: 0,
          miss: 0,
          level,
          ...setupReceptiveRound(action.items, state.catId, level, action.rnd, {}),
          locked: true,
        };
      }
      return { ...state, locked: true, run: 0, miss };
    }
    default:
      return state;
  }
}

export function receptiveChips(state: ReceptiveState): string[] {
  return [`${state.i + 1}/8`, `✅ ${state.score}`, `${state.level} אפשרויות`];
}

export function receptiveResult(state: ReceptiveState) {
  return { score: state.score, total: RECEPTIVE_ROUNDS, extra: `רמה ${state.level} אפשרויות` };
}

export function canFailReceptive(_state: ReceptiveState): false {
  return false;
}
