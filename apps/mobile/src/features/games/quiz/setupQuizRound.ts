import { shuffle } from '@/domain/games/shuffle';
import type { TalkiWord } from '@/domain/types';

export interface QuizRound {
  target: TalkiWord;
  options: TalkiWord[];
  locked: boolean;
  asked: boolean;
  done: boolean;
}

export interface QuizCategorySlice {
  id: string;
  items: TalkiWord[];
}

/**
 * index.html `setupQuizRound()` (2557-2567). Pure: same pool/i/items/rnd
 * always produce the same target and option order.
 */
export function setupQuizRound(
  pool: TalkiWord[],
  i: number,
  category: QuizCategorySlice,
  rnd: () => number,
): QuizRound {
  if (i >= pool.length) {
    return {
      target: pool[pool.length - 1] ?? category.items[0]!,
      options: [],
      locked: true,
      asked: true,
      done: true,
    };
  }
  const target = pool[i]!;
  const others = shuffle(
    category.items.filter((item) => item.word !== target.word),
    rnd,
  ).slice(0, 3);
  return {
    target,
    options: shuffle([target, ...others], rnd),
    locked: false,
    asked: false,
    done: false,
  };
}

/** Test-only: put the target at a fixed index so `burst(quiz-option-0)`
 *  can be deterministic. Production never sets `placeCorrectAt`. */
export function placeCorrectAt(options: TalkiWord[], target: TalkiWord, index: number): TalkiWord[] {
  const rest = options.filter((o) => o.word !== target.word);
  const next = [...rest];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, target);
  return next;
}
