/**
 * Pure lookup tests for the centralised route-to-orientation map — no game
 * ever calls `lockAsync` itself; every route asks `policyFor()`
 * (services/orientation/policy.ts) what it should be.
 */
import { describe, expect, it } from 'vitest';

import { GAME_IDS } from '@/domain/games/ids';
import { orientationPolicy, policyFor } from '@/services/orientation/policy';

describe('orientation policy', () => {
  it('every game route maps to landscape', () => {
    expect(orientationPolicy.games).toBe('landscape');
  });

  it('every practice route maps to landscape', () => {
    expect(orientationPolicy.practice).toBe('landscape');
  });

  it('home, category and intro map to responsive', () => {
    expect(orientationPolicy.home).toBe('responsive');
    expect(orientationPolicy.category).toBe('responsive');
    expect(orientationPolicy.intro).toBe('responsive');
  });

  it('an unknown route falls back to responsive rather than throwing', () => {
    expect(() => policyFor('not-a-real-route')).not.toThrow();
    expect(policyFor('not-a-real-route')).toBe('responsive');
    expect(policyFor('')).toBe('responsive');
  });

  it('policyFor() agrees with the orientationPolicy map for every known route', () => {
    (Object.keys(orientationPolicy) as (keyof typeof orientationPolicy)[]).forEach((route) => {
      expect(policyFor(route)).toBe(orientationPolicy[route]);
    });
  });

  it('has exactly the five route kinds the plan specifies, no more, no fewer', () => {
    expect(Object.keys(orientationPolicy).sort()).toEqual(
      ['category', 'games', 'home', 'intro', 'practice'].sort()
    );
  });

  it('sanity: all 11 real game ids exist, for context on why "games" is one policy bucket', () => {
    // Not a policy assertion in itself — games are landscape as a single
    // route *kind*, not per-game-id; this just documents there are 11 of
    // them sharing that one bucket, not testing GAME_IDS's own content
    // (that belongs to domain-parity.test.ts).
    expect(GAME_IDS.length).toBe(11);
  });
});
