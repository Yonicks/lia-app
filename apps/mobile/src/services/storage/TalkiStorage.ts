/**
 * The one interface every screen, game and domain module is allowed to touch
 * when it needs persistence. Nothing outside apps/mobile/src/services/storage
 * imports expo-sqlite (or IndexedDB) directly — see phase-03-plan.md,
 * "expo-sqlite/kv-store behind a TalkiStorage interface".
 *
 * This mirrors the legacy Store's four-call shape (index.html 1662-1745:
 * get/set/del/keys), which already proved itself as a backend-swappable
 * abstraction — IndexedDB, the chat-artifact API, and an in-memory
 * fallback all lived behind it. TalkiStorage carries the same property
 * forward for two backends: expo-sqlite/kv-store natively, IndexedDB on web.
 */
export interface TalkiStorage {
  /** Returns the stored value, or `null` if the key has never been set.
   *  Never returns `undefined` and never throws for a missing key. */
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}
