import { describe, expect, it } from 'vitest';

import {
  gateReducer,
  holdCancelledByMove,
  initGate,
  makeLockQuestion,
  PARENT_HOLD_MS,
  shortTapDoesNotUnlock,
} from '@/domain/parent/gate';

describe('parent gate maths', () => {
  it('a is always 3..9 and b always 2..9 across many generations', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeLockQuestion(() => (i % 100) / 100);
      expect(q.a).toBeGreaterThanOrEqual(3);
      expect(q.a).toBeLessThanOrEqual(9);
      expect(q.b).toBeGreaterThanOrEqual(2);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.sum).toBe(q.a * q.b);
    }
    const lo = makeLockQuestion(() => 0);
    expect(lo).toEqual({ a: 3, b: 2, sum: 6 });
    const hi = makeLockQuestion(() => 0.999);
    expect(hi.a).toBe(9);
    expect(hi.b).toBe(9);
    expect(hi.sum).toBe(81);
  });

  it('the correct product unlocks; a wrong answer does not', () => {
    let state = initGate(() => 0);
    state = gateReducer(state, { type: 'DIGIT', n: '6' });
    state = gateReducer(state, { type: 'OK' });
    expect(state.unlocked).toBe(true);

    state = initGate(() => 0);
    state = gateReducer(state, { type: 'DIGIT', n: '5' });
    state = gateReducer(state, { type: 'OK' });
    expect(state.unlocked).toBe(false);
    expect(state.input).toBe('');
  });

  it('clear empties the input', () => {
    let state = initGate(() => 0);
    state = gateReducer(state, { type: 'DIGIT', n: '1' });
    state = gateReducer(state, { type: 'DIGIT', n: '2' });
    expect(state.input).toBe('12');
    state = gateReducer(state, { type: 'CLEAR' });
    expect(state.input).toBe('');
  });

  it('leaving re-locks', () => {
    let state = initGate(() => 0);
    state = gateReducer(state, { type: 'DIGIT', n: '6' });
    state = gateReducer(state, { type: 'OK' });
    expect(state.unlocked).toBe(true);
    state = gateReducer(state, { type: 'LOCK' });
    expect(state.unlocked).toBe(false);
    expect(state.input).toBe('');
  });

  it('a short tap does not unlock', () => {
    expect(shortTapDoesNotUnlock()).toBe(true);
    expect(initGate(() => 0).unlocked).toBe(false);
    expect(PARENT_HOLD_MS).toBe(900);
  });

  it('movement beyond the threshold cancels the hold', () => {
    expect(holdCancelledByMove(0, 0)).toBe(false);
    expect(holdCancelledByMove(12, 0)).toBe(false);
    expect(holdCancelledByMove(13, 0)).toBe(true);
    expect(holdCancelledByMove(0, 20)).toBe(true);
  });
});
