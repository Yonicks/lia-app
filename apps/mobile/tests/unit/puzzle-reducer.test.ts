import { describe, expect, it } from 'vitest';

import { puzzleStars } from '@/domain/games/puzzle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';
import { canLosePuzzle, initPuzzle, puzzleReducer, type PuzzleState } from '@/features/games/puzzle/puzzleReducer';

function word(w: string, shape = 'a'): TalkiWord {
  return { word: w, emoji: 'x', shape };
}

function category(n = 8): TalkiCategory {
  return {
    id: 'animals',
    title: 'x',
    icon: 'x',
    cls: 'c-animals',
    items: Array.from({ length: n }, (_, i) => word(`w${i}`, `s${i}`)),
  };
}

function ctx(seed = 0.2) {
  let i = 0;
  const rnd = () => {
    i += 1;
    return (seed * i) % 1;
  };
  return { category: category(), stats: {}, settings: {} as never, rnd };
}

function board(): PuzzleState {
  return initPuzzle(ctx(), { height: 900, width: 800, level: 1, boards: 0 });
}

describe('puzzle reducer', () => {
  it('a correct drop places and increments placed', () => {
    const s0 = board();
    const id = s0.pieces[0]!.id;
    const next = puzzleReducer(s0, { type: 'PLACE', pieceId: id, slotId: id });
    expect(next.pieces.find((p) => p.id === id)!.placed).toBe(true);
    expect(next.placed).toBe(1);
  });

  it('a wrong drop increments piece and board misses and does not place', () => {
    const s0 = board();
    const a = s0.pieces[0]!.id;
    const b = s0.pieces[1]!.id;
    const next = puzzleReducer(s0, { type: 'PLACE', pieceId: a, slotId: b });
    expect(next.pieces.find((p) => p.id === a)!.placed).toBe(false);
    expect(next.pieces.find((p) => p.id === a)!.misses).toBe(1);
    expect(next.misses).toBe(1);
    expect(next.placed).toBe(0);
  });

  it('the second miss on a piece sets the hint', () => {
    const s0 = board();
    const a = s0.pieces[0]!.id;
    const b = s0.pieces[1]!.id;
    const s1 = puzzleReducer(s0, { type: 'PLACE', pieceId: a, slotId: b });
    expect(s1.hint).toBeNull();
    const s2 = puzzleReducer(s1, { type: 'PLACE', pieceId: a, slotId: b });
    expect(s2.hint).toBe(a);
  });

  it('the third miss raises tolerance by 0.4, capped at 2.2', () => {
    const s0 = board();
    const a = s0.pieces[0]!.id;
    const b = s0.pieces[1]!.id;
    let s = s0;
    expect(s.tolerance).toBe(0.9);
    s = puzzleReducer(s, { type: 'PLACE', pieceId: a, slotId: b });
    s = puzzleReducer(s, { type: 'PLACE', pieceId: a, slotId: b });
    expect(s.tolerance).toBe(0.9);
    s = puzzleReducer(s, { type: 'PLACE', pieceId: a, slotId: b });
    expect(s.tolerance).toBeCloseTo(1.3);
    for (let i = 0; i < 8; i++) s = puzzleReducer(s, { type: 'PLACE', pieceId: a, slotId: b });
    expect(s.tolerance).toBe(2.2);
  });

  it('tap-then-tap places exactly like a drag (SELECT then PLACE)', () => {
    const s0 = board();
    const id = s0.pieces[0]!.id;
    const selected = puzzleReducer(s0, { type: 'SELECT', id });
    expect(selected.sel).toBe(id);
    const placed = puzzleReducer(selected, { type: 'PLACE', pieceId: id, slotId: id });
    expect(placed.pieces.find((p) => p.id === id)!.placed).toBe(true);
    expect(placed.sel).toBeNull();
  });

  it('there is no state in which the game can be lost', () => {
    let s = board();
    const wrong = s.pieces[1]!.id;
    for (const p of s.pieces) {
      for (let i = 0; i < 6; i++) s = puzzleReducer(s, { type: 'PLACE', pieceId: p.id, slotId: wrong === p.id ? s.pieces[0]!.id : wrong });
    }
    expect(canLosePuzzle(s)).toBe(false);
    expect(s.done).toBe(false);
    for (const p of s.pieces) {
      if (!p.placed) s = puzzleReducer(s, { type: 'PLACE', pieceId: p.id, slotId: p.id });
    }
    expect(s.finishing).toBe(true);
    expect(s.done).toBe(false);
    s = puzzleReducer(s, { type: 'FINISH' });
    expect(s.done).toBe(true);
    expect(canLosePuzzle(s)).toBe(false);
  });

  it('done when every piece is placed (after FINISH)', () => {
    let s = board();
    for (const p of s.pieces) s = puzzleReducer(s, { type: 'PLACE', pieceId: p.id, slotId: p.id });
    expect(s.finishing).toBe(true);
    s = puzzleReducer(s, { type: 'FINISH' });
    expect(s.done).toBe(true);
    expect(s.placed).toBe(s.pieces.length);
  });

  it('stars: 0 and 1 misses three, 2 and 4 two, 5 one', () => {
    expect(puzzleStars(0)).toBe(3);
    expect(puzzleStars(1)).toBe(3);
    expect(puzzleStars(2)).toBe(2);
    expect(puzzleStars(4)).toBe(2);
    expect(puzzleStars(5)).toBe(1);
  });
});
