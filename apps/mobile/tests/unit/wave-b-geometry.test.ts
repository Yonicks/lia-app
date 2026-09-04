import { describe, expect, it } from 'vitest';

import { countFitsStage, countPicSize } from '@/features/games/count/countDensity';
import { puzzleSlotUnder } from '@/features/games/puzzle/puzzleHit';

describe('count density', () => {
  it('keeps n=5 objects inside a compact landscape stage without going below 48', () => {
    const stage = 320;
    const pic = countPicSize(5, stage, 80);
    expect(pic).toBeGreaterThanOrEqual(48);
    expect(countFitsStage(5, pic, stage)).toBe(true);
  });

  it('respects token max when the stage is wide', () => {
    expect(countPicSize(2, 800, 104)).toBe(104);
  });

  it('never overflows for every legal count on phone and tablet widths', () => {
    for (const width of [280, 360, 520, 900]) {
      for (let n = 1; n <= 5; n++) {
        const pic = countPicSize(n, width, 116);
        expect(countFitsStage(n, pic, width)).toBe(true);
      }
    }
  });
});

describe('puzzle hit geometry (play-area local)', () => {
  it('snaps when the piece center is within tolerance of an empty slot', () => {
    const slots = [
      { id: 'p0', x: 10, y: 10, width: 80, height: 80, filled: false },
      { id: 'p1', x: 120, y: 10, width: 80, height: 80, filled: false },
    ];
    const piece = { x: 20, y: 20, width: 70, height: 70 };
    expect(puzzleSlotUnder(50, 50, piece, slots, 0.9)).toBe('p0');
  });

  it('ignores filled slots and returns the nearer empty match', () => {
    const slots = [
      { id: 'p0', x: 10, y: 10, width: 80, height: 80, filled: true },
      { id: 'p1', x: 100, y: 10, width: 80, height: 80, filled: false },
    ];
    const piece = { x: 90, y: 15, width: 70, height: 70 };
    expect(puzzleSlotUnder(125, 50, piece, slots, 0.9)).toBe('p1');
  });

  it('returns null when far from every slot', () => {
    const slots = [{ id: 'p0', x: 0, y: 0, width: 60, height: 60, filled: false }];
    const piece = { x: 400, y: 400, width: 60, height: 60 };
    expect(puzzleSlotUnder(430, 430, piece, slots, 0.5)).toBeNull();
  });
});

describe('sort drop-zone local coordinates', () => {
  /** Pure helper mirroring SortScreen board-local conversion. */
  function toBoardLocal(
    boardOrigin: { x: number; y: number },
    windowBox: { x: number; y: number; width: number; height: number },
  ) {
    return {
      x: windowBox.x - boardOrigin.x,
      y: windowBox.y - boardOrigin.y,
      width: windowBox.width,
      height: windowBox.height,
    };
  }

  it('converts window boxes into board-local rects on phone and tablet origins', () => {
    const phone = toBoardLocal({ x: 12, y: 80 }, { x: 40, y: 200, width: 140, height: 96 });
    expect(phone).toEqual({ x: 28, y: 120, width: 140, height: 96 });
    const tablet = toBoardLocal({ x: 40, y: 100 }, { x: 520, y: 180, width: 200, height: 120 });
    expect(tablet).toEqual({ x: 480, y: 80, width: 200, height: 120 });
  });

  it('hit-tests a tap against board-local box rects', () => {
    const boxes = [
      { id: 'animals', x: 20, y: 100, width: 140, height: 90 },
      { id: 'food', x: 180, y: 100, width: 140, height: 90 },
    ];
    const hit = (cx: number, cy: number) =>
      boxes.find((b) => cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height)?.id ?? null;
    expect(hit(50, 140)).toBe('animals');
    expect(hit(220, 140)).toBe('food');
    expect(hit(10, 10)).toBeNull();
  });
});
