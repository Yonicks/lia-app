import { CARRIERS } from '@/domain/practice/content';
import { weightedPick } from '@/domain/progress/selection';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../../games/shell/types';

export interface FocusState {
  it: TalkiWord;
  step: number;
  total: number;
  done: boolean;
}

export type FocusAction = { type: 'ADVANCE' };

export function initFocus(ctx: GameInitContext): FocusState {
  const it = weightedPick(ctx.category.items, ctx.category.id, 1, ctx.stats, ctx.rnd)[0] ?? ctx.category.items[0]!;
  return { it, step: 0, total: CARRIERS.length, done: false };
}

export function focusReducer(state: FocusState, action: FocusAction): FocusState {
  if (action.type !== 'ADVANCE' || state.done) return state;
  const step = state.step + 1;
  if (step >= state.total) return { ...state, step, done: true };
  return { ...state, step };
}

export function focusPhrase(state: FocusState, displayWord: string): string {
  return (CARRIERS[state.step] ?? '').replace('{w}', displayWord);
}

export function focusChips(state: FocusState): string[] {
  return [`${state.step + 1}/${state.total}`];
}

export function canFailFocus(_state: FocusState): false {
  return false;
}
