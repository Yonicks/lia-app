import { describe, expect, it, vi } from 'vitest';

import type { TalkiWord } from '@/domain/types';
import { BUBBLE_TOTAL, bubblesReducer, initBubbles } from '@/features/games/bubbles/bubblesReducer';
import { createBubbleSpawner } from '@/features/games/bubbles/bubbleSpawner';

const word: TalkiWord = { word: 'כֶּלֶב', emoji: '🐶' };

describe('bubbles reducer', () => {
  it('12 total; popping increments; no state can end the game early', () => {
    let s = initBubbles();
    expect(s.total).toBe(12);
    expect(s.done).toBe(false);
    for (let i = 0; i < BUBBLE_TOTAL - 1; i++) {
      s = bubblesReducer(s, { type: 'SPAWN', word, rnd: () => 0.4 });
      s = bubblesReducer(s, { type: 'POP', id: s.live[0]!.id });
      expect(s.done).toBe(false);
    }
    s = bubblesReducer(s, { type: 'SPAWN', word, rnd: () => 0.4 });
    s = bubblesReducer(s, { type: 'POP', id: s.live[0]!.id });
    expect(s.popped).toBe(12);
    expect(s.done).toBe(true);
  });

  it('the spawner is cleared on stop (unmount)', () => {
    vi.useFakeTimers();
    const spawn = vi.fn();
    const s = createBubbleSpawner(spawn);
    s.start();
    expect(s.pending()).toBeGreaterThan(0);
    s.stop();
    expect(s.pending()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(spawn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
