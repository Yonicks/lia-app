import type { CategoryId, GameId, PracticeModeId, TalkiCategory } from '../types';
import { minItemsFor } from './minItems';

export const START_GAME_TOAST = 'צריך לפחות 4 מילים בקטגוריה';

export interface StartGameOk {
  ok: true;
  category: TalkiCategory;
}

export interface StartGameFail {
  ok: false;
  toast: typeof START_GAME_TOAST;
}

export type StartGameResult = StartGameOk | StartGameFail;

/**
 * The category-resolution half of `startGame()` (index.html 2491-2495).
 * It does NOT write `lia:lastcat` — only `enterCat()` does (1823). It does
 * not play SFX or build per-game state; those stay in the session hook so
 * a test can assert the gate without mounting a screen.
 */
export function resolveStartCategory(
  type: GameId | PracticeModeId,
  catId: string | null | undefined,
  cats: TalkiCategory[],
): StartGameResult {
  const need = minItemsFor(type);
  let cat = catId ? cats.find((c) => c.id === catId) : undefined;
  if (!cat || cat.items.length < need) {
    cat = cats.find((c) => c.items.length >= need);
  }
  if (!cat) return { ok: false, toast: START_GAME_TOAST };
  return { ok: true, category: cat };
}

export function isStartGameOk(result: StartGameResult): result is StartGameOk {
  return result.ok;
}

/** Narrow helper so callers can pass a route param through without a cast. */
export function asCategoryId(id: string | undefined): CategoryId | null {
  return id ? (id as CategoryId) : null;
}
