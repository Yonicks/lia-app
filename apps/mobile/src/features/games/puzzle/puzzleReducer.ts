import { shuffle } from '@/domain/games/shuffle';
import {
  puzzleCapacity,
  puzzleLevel,
  puzzlePick,
  puzzleSize,
  puzzleStars,
  puzzleTogetherLine,
} from '@/domain/games/puzzle';
import type { TalkiWord } from '@/domain/types';

import type { GameInitContext } from '../shell/types';

export interface PuzzlePieceState {
  id: string;
  it: TalkiWord;
  placed: boolean;
  misses: number;
}

export interface PuzzleState {
  catId: string;
  pieces: PuzzlePieceState[];
  slots: string[];
  tray: string[];
  sel: string | null;
  hint: string | null;
  placed: number;
  misses: number;
  tolerance: number;
  boards: number;
  done: boolean;
  finishing: boolean;
}

export type PuzzleAction =
  | { type: 'SELECT'; id: string }
  | { type: 'PLACE'; pieceId: string; slotId: string }
  | { type: 'FINISH' };

export interface PuzzleInitOptions {
  height: number;
  width: number;
  level?: unknown;
  boards?: number;
  capacityOverride?: number;
}

export function initPuzzle(ctx: GameInitContext, opts: PuzzleInitOptions): PuzzleState {
  const level = puzzleLevel(opts.level ?? ctx.settings.puzzleLevel);
  const capacity = opts.capacityOverride ?? puzzleCapacity(opts.height, opts.width);
  const n = puzzleSize(level, capacity);
  const picks = puzzlePick(ctx.category, n, ctx.stats, ctx.rnd);
  const pieces: PuzzlePieceState[] = picks.map((it, i) => ({
    id: `p${i}`,
    it,
    placed: false,
    misses: 0,
  }));
  const ids = pieces.map((p) => p.id);
  return {
    catId: ctx.category.id,
    pieces,
    slots: shuffle(ids, ctx.rnd),
    tray: shuffle(ids, ctx.rnd),
    sel: null,
    hint: null,
    placed: 0,
    misses: 0,
    tolerance: 0.9,
    boards: opts.boards ?? 0,
    done: false,
    finishing: false,
  };
}

function pieceOf(state: PuzzleState, id: string): PuzzlePieceState | undefined {
  return state.pieces.find((p) => p.id === id);
}

export function puzzleReducer(state: PuzzleState, action: PuzzleAction): PuzzleState {
  switch (action.type) {
    case 'SELECT': {
      if (state.done || state.finishing) return state;
      const p = pieceOf(state, action.id);
      if (!p || p.placed) return state;
      return { ...state, sel: state.sel === action.id ? null : action.id };
    }
    case 'PLACE': {
      if (state.done || state.finishing) return state;
      const piece = pieceOf(state, action.pieceId);
      if (!piece || piece.placed) return state;
      if (action.pieceId === action.slotId) {
        const pieces = state.pieces.map((p) => (p.id === piece.id ? { ...p, placed: true } : p));
        const placed = state.placed + 1;
        const complete = placed >= pieces.length;
        return {
          ...state,
          pieces,
          placed,
          sel: null,
          hint: null,
          finishing: complete,
          done: false,
        };
      }
      const misses = piece.misses + 1;
      const pieces = state.pieces.map((p) => (p.id === piece.id ? { ...p, misses } : p));
      const tolerance = misses >= 3 ? Math.min(2.2, state.tolerance + 0.4) : state.tolerance;
      return {
        ...state,
        pieces,
        misses: state.misses + 1,
        tolerance,
        hint: misses >= 2 ? piece.id : state.hint,
      };
    }
    case 'FINISH':
      if (!state.finishing || state.done) return state;
      return { ...state, finishing: false, done: true, boards: state.boards + 1 };
    default:
      return state;
  }
}

export function puzzleChips(state: PuzzleState): string[] {
  return [`🧩 ${state.placed}/${state.pieces.length}`];
}

export function puzzleResult(state: PuzzleState) {
  return { score: puzzleStars(state.misses), total: 3 };
}

export function puzzleTogether(state: PuzzleState): string | null {
  return puzzleTogetherLine(state.boards);
}

export function canLosePuzzle(_state: PuzzleState): false {
  return false;
}
