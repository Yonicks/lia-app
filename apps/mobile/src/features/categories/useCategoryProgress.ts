import { useEffect, useMemo } from 'react';

import { catLearned } from '../../domain/progress/totals';
import type { CategoryId } from '../../domain/types';
import { allCats } from '../../domain/vocabulary/allCats';
import { key } from '../../domain/progress/keys';
import { useProgressStore } from '../../state/progressStore';
import { useSettingsStore } from '../../state/settingsStore';

/**
 * All of a category screen's derived state, mirroring `renderCategory()`
 * (index.html 2293-2327): the category itself, its learned count, and a
 * per-word `isLearned` lookup keyed exactly like `learned` (`catId:word`,
 * niqqud included). Also writes `lia:lastcat` on open — the equivalent of
 * `enterCat()` (index.html 1823) — for ANY path into a category, not just
 * the Home hero, since legacy's `enterCat()` runs on every entry.
 */
export function useCategoryProgress(catId: CategoryId | undefined) {
  const { hydrated, learned, custom, hydrate, markLearned, setLastCat } = useProgressStore();
  const { hydrated: settingsHydrated, settings, hydrate: hydrateSettings } = useSettingsStore();

  useEffect(() => {
    if (!hydrated) void hydrate();
    if (!settingsHydrated) void hydrateSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated && catId) void setLastCat(catId);
    // Runs once catId/hydrated settle — writing lia:lastcat is a
    // side-effectful "entered this category" event, not a value to
    // re-derive on every learned-set change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, catId]);

  const ready = hydrated && settingsHydrated;
  const category = useMemo(() => (catId ? allCats(custom).find((c) => c.id === catId) : undefined), [catId, custom]);

  const isLearned = (word: string) => (category ? learned.has(key(category.id, word)) : false);
  const learnedCount = category ? catLearned(category, learned) : 0;

  return {
    ready,
    category,
    learnedCount,
    isLearned,
    niqqudEnabled: settings.niqqud,
    markLearned: (word: string) => (category ? markLearned(category.id, word) : Promise.resolve()),
  };
}
