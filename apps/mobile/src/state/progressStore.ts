import { create } from 'zustand';

import { key } from '../domain/progress/keys';
import type { CategoryId, TalkiWord } from '../domain/types';
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
  hydrate: () => Promise<void>;
  /** Marks `catId:word` learned — index.html `markLearned()`'s effect (the
   *  `learned.add(key(...))` half; the speaking half is the caller's job,
   *  via WordVoiceService). Idempotent and persists on every call, matching
   *  legacy's `saveProgress()` after every mark. */
  markLearned: (catId: CategoryId, word: string) => Promise<void>;
  /** Writes `lia:lastcat` — the equivalent of `enterCat()` (index.html
   *  1823): `lastCat = id; saveLastCat();`. */
  setLastCat: (id: CategoryId) => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  hydrated: false,
  learned: new Set(),
  lastCat: null,
  custom: [],

  hydrate: async () => {
    const loaded = await loadAll(storage);
    set({ learned: loaded.learned, lastCat: loaded.lastCat, custom: loaded.custom, hydrated: true });
  },

  markLearned: async (catId, word) => {
    const k = key(catId, word);
    const current = get().learned;
    if (current.has(k)) return;
    const next = new Set(current);
    next.add(k);
    set({ learned: next });
    await storage.set(K.progress, [...next]);
  },

  setLastCat: async (id) => {
    set({ lastCat: id });
    await storage.set(K.lastcat, id);
  },
}));
