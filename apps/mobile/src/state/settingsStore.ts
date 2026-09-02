import { create } from 'zustand';

import { DEFAULT_SETTINGS } from '../domain/settings/defaults';
import type { TalkiSettings } from '../domain/types';
import { storage } from '../services/storage';
import { K } from '../services/storage/keys';
import { loadAll } from './persistence';

/**
 * Global settings state — the counterpart to `progressStore`, split out
 * because progress and settings are conceptually and persistence-wise
 * independent (different storage key, different mutation frequency), not
 * because either one is used without the other in practice.
 */
export interface SettingsState {
  hydrated: boolean;
  settings: TalkiSettings;
  hydrate: () => Promise<void>;
  /** DISPLAY ONLY — never changes what is passed to WordVoiceService.say(),
   *  which always receives the plain (niqqud-stripped) form regardless of
   *  this setting (phase-07-plan.md "Niqqud toggle changes display only,
   *  never TTS input"). */
  setNiqqud: (enabled: boolean) => Promise<void>;
  toggleMusic: () => Promise<void>;
  setPuzzleLevel: (level: number) => Promise<void>;
}

async function persist(next: TalkiSettings): Promise<void> {
  await storage.set(K.settings, next);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_SETTINGS,

  hydrate: async () => {
    const loaded = await loadAll(storage);
    set({ settings: loaded.settings, hydrated: true });
  },

  setNiqqud: async (enabled) => {
    const next = { ...get().settings, niqqud: enabled };
    set({ settings: next });
    await persist(next);
  },

  toggleMusic: async () => {
    const next = { ...get().settings, music: !get().settings.music };
    set({ settings: next });
    await persist(next);
  },

  setPuzzleLevel: async (level) => {
    const next = { ...get().settings, puzzleLevel: level };
    set({ settings: next });
    await persist(next);
  },
}));
