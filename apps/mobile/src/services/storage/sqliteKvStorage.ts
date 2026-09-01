import { Storage as SQLiteKvStore } from 'expo-sqlite/kv-store';

import type { TalkiStorage } from './TalkiStorage';

/**
 * Native TalkiStorage backend. `expo-sqlite/kv-store` is Expo's own
 * persisted key/value API, backed by SQLite (phase-03-plan.md,
 * "expo-sqlite/kv-store behind a TalkiStorage interface"). Its own values
 * are strings, so TalkiStorage's opaque `<T>` values are JSON-encoded on the
 * way in and decoded on the way out — the same approach legacy's IndexedDB
 * backend does NOT need (IndexedDB stores structured clones directly) but
 * every other legacy backend implicitly assumed (the chat-artifact backend
 * at index.html ~1720 does exactly this: `JSON.stringify`/`JSON.parse`).
 *
 * This module is the only file in the app that imports
 * 'expo-sqlite/kv-store'. It is not safe to import under Tier 1 (vitest)
 * without mocking the module first — expo-sqlite is a native module with no
 * JS-only fallback, so tests that exercise this file must
 * `vi.mock('expo-sqlite/kv-store', ...)`.
 */
export const sqliteKvStorage: TalkiStorage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await SQLiteKvStore.getItemAsync(key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // A value that fails to parse is treated as absent rather than
      // thrown to the caller — get() must never throw (TalkiStorage.ts).
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    await SQLiteKvStore.setItemAsync(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await SQLiteKvStore.removeItemAsync(key);
  },

  async keys(): Promise<string[]> {
    return SQLiteKvStore.getAllKeysAsync();
  },
};
