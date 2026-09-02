import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/domain/games/shuffle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import { initMemory, memoryReducer, type MemoryState } from '@/features/games/memory/memoryReducer';
import { createManagedTimers } from '@/features/games/shell/managedTimers';

function word(w: string): TalkiWord {
  return { word: w, emoji: 'x' };
}

function category(n: number): TalkiCategory {
  return {
    id: 'animals',
    title: 'חיות',
    icon: 'x',
    cls: 'c-animals',
    items: Array.from({ length: n }, (_, i) => word(`w${i}`)),
  };
}

function ctx(n = 8, seed = 1) {
  return { category: category(n), stats: {}, settings: {} as never, rnd: mulberry32(seed) };
}

function pairMate(state: MemoryState, idx: number): number {
  const card = state.cards[idx]!;
  return state.cards.find((c) => c.pair === card.pair && c.idx !== card.idx)!.idx;
}

describe('memory reducer', () => {
  it('builds 12 cards from 6 pairs, one pic and one word each', () => {
    const state = initMemory(ctx(8, 4));
    expect(state.cards).toHaveLength(12);
    expect(state.total).toBe(6);
    for (let p = 0; p < 6; p++) {
      const pair = state.cards.filter((c) => c.pair === p);
      expect(pair).toHaveLength(2);
      expect(pair.map((c) => c.kind).sort()).toEqual(['pic', 'word']);
      expect(pair[0]!.it.word).toBe(pair[1]!.it.word);
    }
  });

  it('matching sets both matched and increments found; done when found === total', () => {
    let s = initMemory(ctx());
    for (let p = 0; p < s.total; p++) {
      const [a, b] = s.cards.filter((c) => c.pair === p);
      s = memoryReducer(s, { type: 'FLIP', idx: a!.idx });
      s = memoryReducer(s, { type: 'FLIP', idx: b!.idx });
    }
    expect(s.found).toBe(s.total);
    expect(s.done).toBe(true);
    expect(s.cards.every((c) => c.matched)).toBe(true);
  });

  it('non-matching increments moves and a CLOSE returns both face-down', () => {
    let s = initMemory(ctx(8, 2));
    const first = s.cards[0]!;
    const other = s.cards.find((c) => c.pair !== first.pair)!;
    s = memoryReducer(s, { type: 'FLIP', idx: first.idx });
    s = memoryReducer(s, { type: 'FLIP', idx: other.idx });
    expect(s.moves).toBe(1);
    expect(s.locked).toBe(true);
    s = memoryReducer(s, { type: 'CLOSE' });
    expect(s.cards.filter((c) => c.open)).toHaveLength(0);
    expect(s.locked).toBe(false);
    expect(s.first).toBeNull();
  });

  it('a matched card cannot be re-selected; a third card cannot flip while two are open', () => {
    let s = initMemory(ctx());
    const a = s.cards[0]!;
    const mate = pairMate(s, a.idx);
    s = memoryReducer(s, { type: 'FLIP', idx: a.idx });
    s = memoryReducer(s, { type: 'FLIP', idx: mate });
    const after = memoryReducer(s, { type: 'FLIP', idx: a.idx });
    expect(after).toEqual(s);

    s = initMemory(ctx(8, 9));
    const x = s.cards[0]!;
    const y = s.cards.find((c) => c.pair !== x.pair)!;
    const z = s.cards.find((c) => c.idx !== x.idx && c.idx !== y.idx)!;
    s = memoryReducer(s, { type: 'FLIP', idx: x.idx });
    s = memoryReducer(s, { type: 'FLIP', idx: y.idx });
    const blocked = memoryReducer(s, { type: 'FLIP', idx: z.idx });
    expect(blocked.cards[z.idx]!.open).toBe(false);
    expect(blocked.cards.filter((c) => c.open && !c.matched)).toHaveLength(2);
  });
});

describe('session timers', () => {
  it('cancelAll leaves no pending timer — the unmount contract', () => {
    const timers = createManagedTimers();
    timers.schedule(60_000, () => undefined);
    timers.schedule(60_000, () => undefined);
    expect(timers.pending()).toBe(2);
    timers.cancelAll();
    expect(timers.pending()).toBe(0);
  });
});
