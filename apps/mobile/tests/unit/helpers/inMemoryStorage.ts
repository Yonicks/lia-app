import type { TalkiStorage } from '@/services/storage/TalkiStorage';

/**
 * A minimal in-memory TalkiStorage, used by backup/persistence tests that
 * care about BackupService's own logic rather than which backend it runs
 * over — the platform-specific backends (sqliteKvStorage, webStorage) have
 * their own dedicated conformance tests in storage.test.ts.
 */
export function createInMemoryStorage(): TalkiStorage {
  const map = new Map<string, unknown>();
  return {
    async get<T>(key: string): Promise<T | null> {
      return map.has(key) ? (map.get(key) as T) : null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      map.set(key, value);
    },
    async remove(key: string): Promise<void> {
      map.delete(key);
    },
    async keys(): Promise<string[]> {
      return [...map.keys()];
    },
  };
}
