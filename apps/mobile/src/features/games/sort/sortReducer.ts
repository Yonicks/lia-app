import { shuffle } from '@/domain/games/shuffle';
import type { CategoryId, TalkiCategory, TalkiWord } from '@/domain/types';
import { CATEGORIES } from '@/domain/vocabulary/categories';

export const SORT_ROUNDS = 6;

export interface SortState {
  it: TalkiWord;
  correctCatId: CategoryId;
  boxes: TalkiCategory[];
  round: number;
  score: number;
  locked: boolean;
  done: boolean;
}

export type SortAction =
  | { type: 'ANSWER'; boxId: string }
  | { type: 'UNLOCK' }
  | { type: 'ADVANCE'; next: SortState };

export function sortBoxPool(): TalkiCategory[] {
  return Object.values(CATEGORIES).filter((c) => c.items.length >= 4);
}

export function setupSortRound(rnd: () => number, round: number, score: number): SortState {
  if (round >= SORT_ROUNDS) {
    const empty = sortBoxPool()[0]!;
    return {
      it: empty.items[0]!,
      correctCatId: empty.id,
      boxes: [],
      round,
      score,
      locked: true,
      done: true,
    };
  }
  const pool = sortBoxPool();
  const [a, b] = shuffle(pool, rnd).slice(0, 2);
  const it = a!.items[Math.floor(rnd() * a!.items.length)]!;
  return {
    it,
    correctCatId: a!.id,
    boxes: shuffle([a!, b!], rnd),
    round,
    score,
    locked: false,
    done: false,
  };
}

export function initSort(rnd: () => number): SortState {
  return setupSortRound(rnd, 0, 0);
}

export function sortReducer(state: SortState, action: SortAction): SortState {
  switch (action.type) {
    case 'ANSWER': {
      if (state.locked || state.done) return state;
      const ok = action.boxId === state.correctCatId;
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

export function sortChips(state: SortState): string[] {
  return [`סיבוב ${state.round + 1}/6`, `✅ ${state.score}`];
}

export function sortResult(state: SortState) {
  return { score: state.score, total: SORT_ROUNDS };
}
