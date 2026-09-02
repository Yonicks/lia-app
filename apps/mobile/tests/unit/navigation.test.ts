/**
 * Tier 1 for Phase 7's navigation spine (phase-07-plan.md). Expo Router's
 * own file-based routing is exercised end-to-end by Tier 2
 * (navigation.spec.ts); this suite covers the one piece of navigation that
 * IS plain data — the href builders in domain/navigation/routes.ts and the
 * `?game=` deep-link parser — the same way every other Tier 1 test in this
 * repo covers pure domain logic.
 */
import { describe, expect, it } from 'vitest';

import { GAME_IDS } from '@/domain/games/ids';
import {
  categoryHref,
  gameHref,
  gamesMenuHref,
  homeHref,
  parseGameDeepLink,
  practiceHref,
  practiceMenuHref,
} from '@/domain/navigation/routes';

describe('navigation — every route in the map resolves', () => {
  it('categoryHref builds a well-formed /category/[id] href for every category id', () => {
    for (const id of ['animals', 'food', 'mine'] as const) {
      expect(categoryHref(id)).toEqual({ pathname: '/category/[id]', params: { id } });
    }
  });

  it('gameHref builds a well-formed /game/[id] href, carrying an optional category', () => {
    expect(gameHref('quiz')).toEqual({ pathname: '/game/[id]', params: { id: 'quiz', catId: '' } });
    expect(gameHref('memory', 'animals')).toEqual({
      pathname: '/game/[id]',
      params: { id: 'memory', catId: 'animals' },
    });
  });

  it('practiceHref builds a well-formed /practice/[id] href', () => {
    expect(practiceHref('focus')).toEqual({ pathname: '/practice/[id]', params: { id: 'focus' } });
  });

  it('the menu and home hrefs are stable literal paths', () => {
    expect(gamesMenuHref).toBe('/games');
    expect(practiceMenuHref).toBe('/practice');
    expect(homeHref).toBe('/');
  });
});

describe('navigation — ?game= deep link (index.html 4246-4247)', () => {
  it('resolves a real game id', () => {
    expect(parseGameDeepLink({ game: 'quiz' })).toBe('quiz');
  });

  it('resolves every one of the 11 real game ids', () => {
    for (const id of GAME_IDS) {
      expect(parseGameDeepLink({ game: id })).toBe(id);
    }
  });

  it('resolves to null for a missing or unknown game id, never throwing', () => {
    expect(parseGameDeepLink({})).toBeNull();
    expect(parseGameDeepLink({ game: 'not-a-real-game' })).toBeNull();
  });

  it('takes the first value when the query param repeats', () => {
    expect(parseGameDeepLink({ game: ['memory', 'quiz'] })).toBe('memory');
  });
});
