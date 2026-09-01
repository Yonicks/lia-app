import type { CategoryId } from '../domain/types';
import { categoryIcons } from './assets';
import { categoryColors } from './theme/colors';

export interface CategoryThemeEntry {
  /** Gradient stops for the category chip, transcribed from
   *  `.c-<id> .hero-chip` in index.html 156-166 (theme/colors.ts). */
  gradientFrom: string;
  gradientTo: string;
  /** Real Talki art; absent for `mine` (custom words), which has no
   *  dedicated icon in legacy either. */
  icon?: (typeof categoryIcons)[keyof typeof categoryIcons];
}

/**
 * Explicit category-to-colour(+icon) map keyed by `CategoryId`, seeded from
 * what each category's legacy `cls` (e.g. `c-animals`) resolves to in the
 * stylesheet — never parsed from CSS at runtime (phase-05-plan.md "`cls`
 * from Phase 2"). `CategoryId` and `categoryColors` are both exhaustively
 * keyed by the same 11 ids, enforced by the `Record` type below rather than
 * by convention.
 */
export const categoryTheme: Record<CategoryId, CategoryThemeEntry> = {
  animals: { gradientFrom: categoryColors.animals.from, gradientTo: categoryColors.animals.to, icon: categoryIcons.animals },
  food: { gradientFrom: categoryColors.food.from, gradientTo: categoryColors.food.to, icon: categoryIcons.food },
  colors: { gradientFrom: categoryColors.colors.from, gradientTo: categoryColors.colors.to, icon: categoryIcons.colors },
  home: { gradientFrom: categoryColors.home.from, gradientTo: categoryColors.home.to, icon: categoryIcons.home },
  family: { gradientFrom: categoryColors.family.from, gradientTo: categoryColors.family.to, icon: categoryIcons.family },
  body: { gradientFrom: categoryColors.body.from, gradientTo: categoryColors.body.to, icon: categoryIcons.body },
  actions: { gradientFrom: categoryColors.actions.from, gradientTo: categoryColors.actions.to, icon: categoryIcons.actions },
  numbers: { gradientFrom: categoryColors.numbers.from, gradientTo: categoryColors.numbers.to, icon: categoryIcons.numbers },
  outside: { gradientFrom: categoryColors.outside.from, gradientTo: categoryColors.outside.to, icon: categoryIcons.outside },
  emotions: { gradientFrom: categoryColors.emotions.from, gradientTo: categoryColors.emotions.to, icon: categoryIcons.emotions },
  mine: { gradientFrom: categoryColors.mine.from, gradientTo: categoryColors.mine.to },
};
