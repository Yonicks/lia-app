import { describe, expect, it } from 'vitest';

import { mulberry32 } from '@/domain/games/shuffle';
import type { TalkiCategory, TalkiWord } from '@/domain/types';

import { initQuiz, quizReducer, type QuizState } from '@/features/games/quiz/quizReducer';
import { setupQuizRound } from '@/features/games/quiz/setupQuizRound';

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

function ctx(n: number, seed = 1) {
  return {
    category: category(n),
    stats: {},
    settings: {} as never,
    rnd: mulberry32(seed),
  };
}

describe('quiz reducer — pool and options', () => {
  it('pool size is min(8, items.length)', () => {
    expect(initQuiz(ctx(3)).pool).toHaveLength(3);
    expect(initQuiz(ctx(8)).pool).toHaveLength(8);
    expect(initQuiz(ctx(26)).pool).toHaveLength(8);
  });

  it('has exactly four options, exactly one correct, distractors from the same category', () => {
    const state = initQuiz(ctx(26, 7));
    expect(state.options).toHaveLength(4);
    const correct = state.options.filter((o) => o.word === state.target.word);
    expect(correct).toHaveLength(1);
    for (const o of state.options) {
      expect(state.catId).toBe('animals');
      expect(category(26).items.some((it) => it.word === o.word)).toBe(true);
    }
    expect(state.options.filter((o) => o.word !== state.target.word)).toHaveLength(3);
  });

  it('options are shuffled — the correct answer is not always in the same slot', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const state = initQuiz(ctx(26, seed));
      positions.add(state.options.findIndex((o) => o.word === state.target.word));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('is pure: same state + action + seed = same result', () => {
    const rnd = mulberry32(11);
    const a = initQuiz({ ...ctx(12), rnd });
    const rnd2 = mulberry32(11);
    const b = initQuiz({ ...ctx(12), rnd: rnd2 });
    expect(a).toEqual(b);
    expect(quizReducer(a, { type: 'ANSWER', word: a.target.word })).toEqual(
      quizReducer(b, { type: 'ANSWER', word: b.target.word }),
    );
  });
});

describe('quiz reducer — scoring', () => {
  function play(state: QuizState, word: string): QuizState {
    return quizReducer(state, { type: 'ANSWER', word });
  }

  it('correct increments score and streak; best tracks the high-water mark', () => {
    let s = initQuiz(ctx(26, 3));
    s = play(s, s.target.word);
    expect(s.score).toBe(1);
    expect(s.streak).toBe(1);
    expect(s.best).toBe(1);
    expect(s.locked).toBe(true);
  });

  it('wrong resets streak to 0 and does not increment score', () => {
    let s = initQuiz(ctx(26, 3));
    s = play(s, s.target.word);
    s = quizReducer(s, { type: 'UNLOCK' });
    const wrong = s.options.find((o) => o.word !== s.target.word)!.word;
    s = play(s, wrong);
    expect(s.score).toBe(1);
    expect(s.streak).toBe(0);
    expect(s.best).toBe(1);
  });

  it('locked blocks a second answer until unlock / advance', () => {
    let s = initQuiz(ctx(26, 3));
    const target = s.target.word;
    s = play(s, target);
    const after = play(s, target);
    expect(after.score).toBe(1);
    expect(after).toEqual(s);
  });

  it('done at i >= pool.length after ADVANCE past the last item', () => {
    let s = initQuiz(ctx(4, 2));
    expect(s.pool.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      s = play(s, s.target.word);
      s = quizReducer(s, { type: 'ADVANCE', categoryItems: category(4).items, rnd: mulberry32(i + 20) });
    }
    expect(s.done).toBe(true);
    expect(s.i).toBe(4);
  });
});

describe('setupQuizRound', () => {
  it('marks done when i is past the pool', () => {
    const pool = category(4).items;
    const round = setupQuizRound(pool, 4, category(4), () => 0.5);
    expect(round.done).toBe(true);
  });
});
