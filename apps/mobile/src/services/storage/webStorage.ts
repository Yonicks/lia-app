import type { TalkiStorage } from './TalkiStorage';

/**
 * Web-only TalkiStorage backend, backed by IndexedDB. This exists purely so
 * Tier 2 (Playwright against the Expo web target) has something durable to
 * exercise — the web target is never shipped (standing rule: "THE WEB
 * TARGET IS A TEST SURFACE"). `services/storage/index.ts` must never select
 * this on a native platform; that is asserted by a test.
 *
 * This is a fresh IndexedDB store for the new Expo web app (a distinct
 * origin/port from the legacy app's own IndexedDB store at index.html
 * 1662-1699) — not a shim over the legacy database. There is no legacy data
 * to inherit here: the legacy web app and this Expo web target never share a
 * browser profile in normal use.
 */
const DB_NAME = 'talki-mobile-storage';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB is not available in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const req = fn(tx.objectStore(STORE_NAME));
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve(req.result);
      }),
  );
}

export const webStorage: TalkiStorage = {
  async get<T>(key: string): Promise<T | null> {
    const value = await withStore<T | undefined>('readonly', (store) => store.get(key));
    return value === undefined ? null : value;
  },

  async set<T>(key: string, value: T): Promise<void> {
    await withStore('readwrite', (store) => store.put(value, key));
  },

  async remove(key: string): Promise<void> {
    await withStore('readwrite', (store) => store.delete(key));
  },

  async keys(): Promise<string[]> {
    return withStore<string[]>('readonly', (store) => store.getAllKeys() as unknown as IDBRequest<string[]>);
  },
};
