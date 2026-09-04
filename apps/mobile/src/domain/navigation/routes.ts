import type { CategoryId, GameId, PracticeModeId } from '../types';
import { GAME_IDS } from '../games/ids';

/**
 * The equivalent of `navTo()` (index.html 3397-3401) — legacy pushes a
 * `view` string plus `history.pushState`; native gets typed Expo Router
 * hrefs. Centralised here (rather than inlined per screen) so
 * `navigation.test.ts` can assert every route shape resolves without
 * mounting a screen, and so a path never has to be typed twice.
 */
export function categoryHref(id: CategoryId) {
  return { pathname: '/category/[id]' as const, params: { id } };
}

export function gameHref(id: GameId, catId?: CategoryId | null) {
  return { pathname: '/game/[id]' as const, params: { id, catId: catId ?? '' } };
}

/** index.html `data-cards="${cat.id}"` (2309, 3415) — the flashcards mode
 *  for one category. Not yet built (phase-07 prompt, "menus only"); routes
 *  to a stub like every other unbuilt mode. */
export function cardsHref(catId: CategoryId) {
  return { pathname: '/cards/[id]' as const, params: { id: catId } };
}

export function practiceHref(id: PracticeModeId, catId?: CategoryId | null) {
  return {
    pathname: '/practice/[id]' as const,
    params: catId ? { id, catId } : { id },
  };
}

export const gamesMenuHref = '/games' as const;
export const practiceMenuHref = '/practice' as const;
export const homeHref = '/' as const;
export const parentHref = '/parent' as const;
export const rewardsHref = '/rewards' as const;

/**
 * The native form of legacy's `?game=<type>` deep link (index.html
 * 4246-4247), which the web target keeps working in query-string form for
 * the legacy Playwright suites — see phase-07-plan.md "Deep link `?game=`
 * is a web concept". Returns `null` for anything that is not one of the 11
 * real game ids, exactly as a missing/garbage query param would resolve to
 * "no deep link" rather than throwing.
 */
export function parseGameDeepLink(query: Record<string, string | string[] | undefined>): GameId | null {
  const raw = query.game;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && (GAME_IDS as string[]).includes(value) ? (value as GameId) : null;
}
