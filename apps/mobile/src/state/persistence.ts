import { DEFAULT_SETTINGS } from '../domain/settings/defaults';
import type { TalkiSettings, TalkiWord, WordStats } from '../domain/types';
import { K } from '../services/storage/keys';
import type { TalkiStorage } from '../services/storage/TalkiStorage';

/**
 * Ported from loadAll() (index.html 1801-1810). Legacy hydrates five
 * module-level mutables (`learned`, `lastCat`, `stats`, `settings`,
 * `custom`) directly; this phase has no UI or app-state layer to hydrate
 * into yet (Phase 2's domain functions already take these as explicit
 * parameters — see phase-02-report.md, "Deviations" §1), so `loadAll`
 * returns the same five values as a plain object instead of assigning
 * globals. Whichever phase wires up screens is expected to call this once
 * on boot and after every backup import, exactly where legacy calls
 * `loadAll()` (index.html 1801, and again at the end of importBackup(),
 * index.html 1798).
 */
export interface LoadedState {
  learned: Set<string>;
  lastCat: string | null;
  stats: Record<string, WordStats>;
  settings: TalkiSettings;
  custom: TalkiWord[];
}

export async function loadAll(storage: TalkiStorage): Promise<LoadedState> {
  const [progress, stats, settingsOverrides, customIndex, lastCat] = await Promise.all([
    storage.get<string[]>(K.progress),
    storage.get<Record<string, WordStats>>(K.stats),
    storage.get<Partial<TalkiSettings>>(K.settings),
    storage.get<string[]>(K.customIndex),
    storage.get<string>(K.lastcat),
  ]);

  const settings: TalkiSettings = { ...DEFAULT_SETTINGS, ...(settingsOverrides ?? {}) };

  let custom: TalkiWord[] = [];
  if (customIndex && customIndex.length) {
    const loaded = await Promise.all(customIndex.map((id) => storage.get<TalkiWord>(K.custom(id))));
    custom = loaded.filter((item): item is TalkiWord => item !== null);
  }

  return {
    learned: new Set(progress ?? []),
    lastCat: lastCat ?? null,
    stats: stats ?? {},
    settings,
    custom,
  };
}
