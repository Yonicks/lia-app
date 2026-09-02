import { shuffle } from '@/domain/games/shuffle';
import type { TalkiWord } from '@/domain/types';
import { CATEGORIES } from '@/domain/vocabulary/categories';

import type { GameInitContext } from '../shell/types';

export interface SoundsState {
  pool: TalkiWord[];
  animals: TalkiWord[];
  i: number;
  score: number;
  target: TalkiWord;
  options: TalkiWord[];
  locked: boolean;
  done: boolean;
}

export type SoundsAction =
  | { type: 'ANSWER'; word: string }
  | { type: 'UNLOCK' }
  | { type: 'ADVANCE'; rnd: () => number; placeCorrectAt?: number };

export function animalSounds(items: TalkiWord[]): TalkiWord[] {
  return items.filter((it) => Boolean(it.sound));
}

/** index.html 2706 — distractors come from every animal, not only those with a sound. */
export function allAnimals(): TalkiWord[] {
  return CATEGORIES.animals.items;
}

export function setupSoundsRound(
  pool: TalkiWord[],
  i: number,
  animals: TalkiWord[],
  rnd: () => number,
  placeCorrectAt?: number,
): Pick<SoundsState, 'target' | 'options' | 'locked' | 'done'> {
  if (i >= pool.length) {
    return { target: pool[pool.length - 1] ?? animals[0]!, options: [], locked: true, done: true };
  }
  const target = pool[i]!;
  const others = shuffle(
    animals.filter((it) => it.word !== target.word),
    rnd,
  ).slice(0, 2);
  let options = shuffle([target, ...others], rnd);
  if (placeCorrectAt !== undefined) {
    options = options.filter((o) => o.word !== target.word);
    options.splice(Math.max(0, Math.min(placeCorrectAt, options.length)), 0, target);
  }
  return { target, options, locked: false, done: false };
}

export function initSounds(ctx: GameInitContext, placeCorrectAt?: number): SoundsState {
  const withSound = animalSounds(ctx.category.items);
  const animals = allAnimals();
  const pool = shuffle(withSound, ctx.rnd).slice(0, 6);
  return { pool, animals, i: 0, score: 0, ...setupSoundsRound(pool, 0, animals, ctx.rnd, placeCorrectAt) };
}

export function soundsReducer(state: SoundsState, action: SoundsAction): SoundsState {
  switch (action.type) {
    case 'ANSWER': {
      if (state.locked || state.done) return state;
      const ok = action.word === state.target.word;
      return { ...state, locked: true, score: ok ? state.score + 1 : state.score };
    }
    case 'UNLOCK':
      return { ...state, locked: false };
    case 'ADVANCE': {
      const i = state.i + 1;
      return { ...state, i, ...setupSoundsRound(state.pool, i, state.animals, action.rnd, action.placeCorrectAt) };
    }
    default:
      return state;
  }
}

export function soundsChips(state: SoundsState): string[] {
  return [`שאלה ${state.i + 1}/${state.pool.length}`, `✅ ${state.score}`];
}

export function soundsResult(state: SoundsState) {
  return { score: state.score, total: state.pool.length };
}
