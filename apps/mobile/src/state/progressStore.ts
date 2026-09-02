import { create } from 'zustand';

import { key } from '../domain/progress/keys';
import { markSeen } from '../domain/progress/selection';
import type { CategoryId, TalkiWord, WordStats } from '../domain/types';
import { storage } from '../services/storage';
import { K } from '../services/storage/keys';
import { loadAll } from './persistence';

/**
 * Global progress state — the ONLY global store for progress data
 * (phase-07-plan.md "Global state is for progress and settings ONLY").
 * Every mutation writes straight through to `K.progress`/`K.lastcat` via
 * the Phase 3 storage service, so a kill-and-relaunch (or a page reload on
 * web) always resumes from the last persisted value — never held only in
 * memory.
 */
export interface ProgressState {
  hydrated: boolean;
  learned: Set<string>;
  lastCat: string | null;
  custom: TalkiWord[];
  stats: Record<string, WordStats>;
  hydrate: () => Promise<void>;
  /** Marks `catId:word` learned — index.html `markLearned()`'s effect (the
   *  `learned.add(key(...))` half; the speaking half is the caller's job,
   *  via WordVoiceService). Idempotent and persists on every call, matching
   *  legacy's `saveProgress()` after every mark. */
  markLearned: (catId: CategoryId, word: string) => Promise<{ added: boolean; size: number }>;
  /** Writes `lia:lastcat` — the equivalent of `enterCat()` (index.html
   *  1823): `lastCat = id; saveLastCat();`. */
  setLastCat: (id: CategoryId) => Promise<void>;
  /** index.html `markSeen()` (1878-1883) — persists `lia:stats`. */
  recordSeen: (catId: string, word: string, wrong: boolean) => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  hydrated: false,
  learned: new Set(),
  lastCat: null,
  custom: [],
  stats: {},

  hydrate: async () => {
    const loaded = await loadAll(storage);
    set({
      learned: loaded.learned,
      lastCat: loaded.lastCat,
      custom: loaded.custom,
      stats: loaded.stats,
      hydrated: true,
    });
  },

  markLearned: async (catId, word) => {
    const k = key(catId, word);
    const current = get().learned;
    if (current.has(k)) return { added: false, size: current.size };
    const next = new Set(current);
    next.add(k);
    set({ learned: next });
    await storage.set(K.progress, [...next]);
    return { added: true, size: next.size };
  },

  recordSeen: async (catId, word, wrong) => {
    const copy: Record<string, WordStats> = {};
    for (const [k, v] of Object.entries(get().stats)) copy[k] = { ...v };
    const next = markSeen(catId, word, wrong, copy);
    set({ stats: next });
    await storage.set(K.stats, next);
  },

  setLastCat: async (id) => {
    set({ lastCat: id });
    await storage.set(K.lastcat, id);
  },
}));
