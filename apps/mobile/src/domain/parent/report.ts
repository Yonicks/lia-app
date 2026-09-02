import type { TalkiWord, WordStats } from '../types';
import { allCats } from '../vocabulary/allCats';
import { catLearned } from '../progress/totals';

export interface CategoryProgressRow {
  id: string;
  title: string;
  icon: string;
  done: number;
  tot: number;
}

export interface HardWord {
  key: string;
  word: string;
  wrong: number;
}

export function categoryProgress(
  learned: ReadonlySet<string>,
  custom: TalkiWord[] = [],
): CategoryProgressRow[] {
  return allCats(custom).map((c) => ({
    id: c.id,
    title: c.title,
    icon: c.icon,
    done: catLearned(c, learned),
    tot: c.items.length,
  }));
}

/** index.html 3360-3361 — top 10 by stats.wrong, only wrong > 0. */
export function hardestWords(stats: Record<string, WordStats>, n = 10): HardWord[] {
  return Object.entries(stats)
    .filter(([, s]) => s.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, n)
    .map(([k, s]) => ({
      key: k,
      word: k.split(':').slice(1).join(':'),
      wrong: s.wrong,
    }));
}
