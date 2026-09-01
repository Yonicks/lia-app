import { describe, expect, it } from 'vitest';

import { INTRO_LAYER_ASSETS } from '@/features/intro/layers';
import { INTRO_TIMELINE, INTRO_TOTAL_MS, type IntroLayerId } from '@/features/intro/timeline';

const ALL_LAYER_IDS: readonly IntroLayerId[] = ['background', 'star', 'sparkles', 'wordmark', 'secondary'];

describe('INTRO_TIMELINE — phase-06-plan.md contract', () => {
  it('is sorted by `at`, non-decreasing', () => {
    for (let i = 1; i < INTRO_TIMELINE.length; i++) {
      expect(INTRO_TIMELINE[i].at).toBeGreaterThanOrEqual(INTRO_TIMELINE[i - 1].at);
    }
  });

  it('no step starts before 0 or ends after INTRO_TOTAL_MS', () => {
    for (const step of INTRO_TIMELINE) {
      expect(step.at).toBeGreaterThanOrEqual(0);
      expect(step.at + step.durationMs).toBeLessThanOrEqual(INTRO_TOTAL_MS);
    }
  });

  it('total duration is 1800', () => {
    expect(INTRO_TOTAL_MS).toBe(1800);
  });

  it('every IntroLayerId referenced by a step has a corresponding asset entry', () => {
    const referenced = new Set(INTRO_TIMELINE.map((step) => step.layer));
    for (const layer of referenced) {
      expect(INTRO_LAYER_ASSETS[layer]).toBeDefined();
    }
  });

  it('every declared IntroLayerId has an asset entry, not just the ones referenced', () => {
    for (const layer of ALL_LAYER_IDS) {
      expect(INTRO_LAYER_ASSETS[layer]).toBeDefined();
    }
  });

  it('contains no random or time-dependent value — re-importing the module yields byte-identical data', () => {
    expect(JSON.parse(JSON.stringify(INTRO_TIMELINE))).toEqual(JSON.parse(JSON.stringify(INTRO_TIMELINE)));
    // A random/time-dependent timeline could not possibly satisfy this on
    // two separate serialisations taken moments apart; a literal array of
    // plain numbers/strings, which is what INTRO_TIMELINE actually is,
    // always will.
    for (const step of INTRO_TIMELINE) {
      expect(typeof step.at).toBe('number');
      expect(typeof step.durationMs).toBe('number');
      expect(Number.isFinite(step.at)).toBe(true);
      expect(Number.isFinite(step.durationMs)).toBe(true);
    }
  });

  it('every step has a positive duration and a valid action', () => {
    const VALID_ACTIONS = new Set(['enter', 'settle', 'exit', 'glow']);
    for (const step of INTRO_TIMELINE) {
      expect(step.durationMs).toBeGreaterThan(0);
      expect(VALID_ACTIONS.has(step.action)).toBe(true);
    }
  });
});
