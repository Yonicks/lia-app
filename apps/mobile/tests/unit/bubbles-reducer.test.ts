import { describe, expect, it, vi } from 'vitest';

import type { TalkiWord } from '@/domain/types';
import { bubbleFitsStage, bubbleSpawnLayout } from '@/features/games/bubbles/bubbleSpawn';
import { BUBBLE_TOTAL, bubblesReducer, initBubbles } from '@/features/games/bubbles/bubblesReducer';
import { createBubbleSpawner } from '@/features/games/bubbles/bubbleSpawner';

const word: TalkiWord = { word: 'כֶּלֶב', emoji: '🐶' };

const STAGE = { width: 400, height: 180, sizeMin: 64, sizeMax: 112 };

describe('bubbles reducer', () => {
  it('12 total; popping increments; no state can end the game early', () => {
    let s = initBubbles();
    expect(s.total).toBe(12);
    expect(s.done).toBe(false);
    for (let i = 0; i < BUBBLE_TOTAL - 1; i++) {
      s = bubblesReducer(s, { type: 'SPAWN', word, rnd: () => 0.4, stage: STAGE });
      s = bubblesReducer(s, { type: 'POP', id: s.live[0]!.id });
      expect(s.done).toBe(false);
    }
    s = bubblesReducer(s, { type: 'SPAWN', word, rnd: () => 0.4, stage: STAGE });
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

  it('spawn sizes and starts stay inside the measured stage', () => {
    const stages = [
      { width: 320, height: 140, sizeMin: 64, sizeMax: 96 },
      { width: 700, height: 360, sizeMin: 88, sizeMax: 132 },
      { width: 200, height: 100, sizeMin: 64, sizeMax: 120 },
    ];
    for (const stage of stages) {
      for (let i = 0; i < 40; i++) {
        const rnd = () => (i * 17 + 3) % 100 / 100;
        const layout = bubbleSpawnLayout(rnd, stage);
        expect(layout.size).toBeGreaterThanOrEqual(48);
        expect(layout.size).toBeLessThanOrEqual(Math.min(stage.sizeMax, stage.height * 0.55) + 0.01);
        expect(bubbleFitsStage(layout.start, layout.size, stage.width)).toBe(true);
      }
    }
  });
});
