import { useEffect } from 'react';

import { currentCategory } from '../../domain/progress/currentCategory';
import { catLearned } from '../../domain/progress/totals';
import type { TalkiCategory } from '../../domain/types';
import { allCats } from '../../domain/vocabulary/allCats';
import { useProgressStore } from '../../state/progressStore';
import { useSettingsStore } from '../../state/settingsStore';

export interface HomeData {
  ready: boolean;
  points: number;
  hero: TalkiCategory | null;
  heroLearned: number;
  categories: TalkiCategory[];
  learnedByCategory: (cat: TalkiCategory) => number;
}

/**
 * All of Home's derived data in one hook, so `HomeScreen.tsx` stays a pure
 * layout component. Every derivation calls the already-ported-and-tested
 * Phase 2 domain functions directly — "Do not re-derive the continue-
 * learning category. Call currentCategory()" (phase-07 prompt).
 */
export function useHomeData(): HomeData {
  const { hydrated: progressHydrated, learned, lastCat, custom, hydrate: hydrateProgress } = useProgressStore();
  const { hydrated: settingsHydrated, hydrate: hydrateSettings } = useSettingsStore();

  useEffect(() => {
    if (!progressHydrated) void hydrateProgress();
    if (!settingsHydrated) void hydrateSettings();
    // Runs once per mount; the stores themselves guard against a duplicate
    // concurrent hydrate via their own `hydrated` flag check above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = progressHydrated && settingsHydrated;
  const categories = allCats(custom);
  const hero = ready ? currentCategory(custom, learned, lastCat) : null;

  return {
    ready,
    points: learned.size,
    hero,
    heroLearned: hero ? catLearned(hero, learned) : 0,
    categories,
    learnedByCategory: (cat) => catLearned(cat, learned),
  };
}
