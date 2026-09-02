import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { K } from '@/services/storage/keys';
import { formatStorageInfo } from '@/services/storage/storageInfo';
import type { TalkiStorage } from '@/services/storage/TalkiStorage';

/* ------------------------------------------------------------------ *
 * K key patterns — exact strings, verbatim from index.html 1633-1637.
 * ------------------------------------------------------------------ */
describe('formatStorageInfo', () => {
  it('matches legacy copy without a quota', () => {
    expect(
      formatStorageInfo({
        engine: 'sqlite',
        label: 'SQLite (קבוע במכשיר)',
        usageBytes: null,
        quotaBytes: null,
      }),
    ).toBe('שיטת אחסון: SQLite (קבוע במכשיר)');
  });

  it('appends usage when both usage and quota are known', () => {
    expect(
      formatStorageInfo({
        engine: 'indexeddb',
        label: 'IndexedDB (קבוע במכשיר)',
        usageBytes: 1048576,
        quotaBytes: 1073741824,
      }),
    ).toBe('שיטת אחסון: IndexedDB (קבוע במכשיר) · בשימוש: 1.0MB מתוך 1.0GB');
  });
});

describe('K key patterns', () => {
  it('produces the exact seven expected strings', () => {
    expect(K.progress).toBe('lia:progress');
    expect(K.settings).toBe('lia:settings');
    expect(K.stats).toBe('lia:stats');
    expect(K.customIndex).toBe('lia:custom:index');
    expect(K.custom('cw123')).toBe('lia:custom:cw123');
    expect(K.rec('animals:כֶּלֶב')).toBe('lia:rec:animals:כֶּלֶב');
    expect(K.lastcat).toBe('lia:lastcat');
  });

  it('keeps the lia: prefix on every key, including the function-valued ones', () => {
    const all = [K.progress, K.settings, K.stats, K.customIndex, K.custom('x'), K.rec('y'), K.lastcat];
    for (const k of all) {
      expect(k.startsWith('lia:')).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Shared conformance suite — every TalkiStorage implementation must
 * satisfy the same contract, independent of backend.
 * ------------------------------------------------------------------ */
function conformanceSuite(name: string, makeStorage: () => TalkiStorage | Promise<TalkiStorage>) {
  describe(`TalkiStorage conformance: ${name}`, () => {
    let storage: TalkiStorage;

    beforeEach(async () => {
      storage = await makeStorage();
    });

    it('get on a missing key returns null, never undefined', async () => {
      const value = await storage.get('nope:missing');
      expect(value).toBeNull();
      expect(value).not.toBeUndefined();
    });

    it('round-trips a string value', async () => {
      await storage.set(K.lastcat, 'animals');
      expect(await storage.get<string>(K.lastcat)).toBe('animals');
    });

    it('round-trips a string[] value (lia:progress shape)', async () => {
      const progress = ['animals:כֶּלֶב', 'food:תַּפּוּחַ', 'mine:סַבְתָּא'];
      await storage.set(K.progress, progress);
      expect(await storage.get<string[]>(K.progress)).toEqual(progress);
    });

    it('round-trips an object value (lia:settings shape)', async () => {
      const settings = { rate: 0.85, niqqud: true, sounds: true, effects: true, music: true, musicVol: 0.5, voice: true, puzzleLevel: 3 };
      await storage.set(K.settings, settings);
      expect(await storage.get(K.settings)).toEqual(settings);
    });

    it('round-trips a nested map value (lia:stats shape)', async () => {
      const stats = { 'animals:כֶּלֶב': { seen: 4, wrong: 1 }, 'food:תַּפּוּחַ': { seen: 0, wrong: 0 } };
      await storage.set(K.stats, stats);
      expect(await storage.get(K.stats)).toEqual(stats);
    });

    it('round-trips a custom-word object with a photo (lia:custom:<id> shape)', async () => {
      const item = { id: 'cw1', word: 'סַבְתָּא רוּתִי', emoji: '💜', photo: 'data:image/jpeg;base64,AAAA' };
      await storage.set(K.custom('cw1'), item);
      expect(await storage.get(K.custom('cw1'))).toEqual(item);
    });

    it('remove deletes a key', async () => {
      await storage.set(K.lastcat, 'animals');
      await storage.remove(K.lastcat);
      expect(await storage.get(K.lastcat)).toBeNull();
    });

    it('remove on a never-set key does not throw', async () => {
      await expect(storage.remove('lia:never:set')).resolves.not.toThrow();
    });

    it('keys lists every key that has been set, and only those', async () => {
      await storage.set(K.lastcat, 'animals');
      await storage.set(K.progress, ['animals:כֶּלֶב']);
      const keys = await storage.keys();
      expect(keys.sort()).toEqual([K.lastcat, K.progress].sort());
    });

    it('keys no longer lists a removed key', async () => {
      await storage.set(K.lastcat, 'animals');
      await storage.set(K.progress, ['animals:כֶּלֶב']);
      await storage.remove(K.lastcat);
      expect(await storage.keys()).toEqual([K.progress]);
    });

    it('set overwrites a previous value under the same key', async () => {
      await storage.set(K.lastcat, 'animals');
      await storage.set(K.lastcat, 'food');
      expect(await storage.get(K.lastcat)).toBe('food');
    });
  });
}

/* ------------------------------------------------------------------ *
 * webStorage (IndexedDB) — polyfilled with fake-indexeddb since jsdom
 * ships no IndexedDB implementation of its own.
 * ------------------------------------------------------------------ */
describe('webStorage', () => {
  beforeEach(() => {
    // Fresh database per test: fake-indexeddb persists across
    // require()s in the same process, so without this, values written
    // by one test would leak into the next.
    indexedDB = new IDBFactory();
  });

  conformanceSuite('webStorage', async () => {
    vi.resetModules();
    const mod = await import('@/services/storage/webStorage');
    return mod.webStorage;
  });

  it('keys survive a simulated restart of the storage layer', async () => {
    vi.resetModules();
    const first = await import('@/services/storage/webStorage');
    await first.webStorage.set(K.progress, ['animals:כֶּלֶב']);
    await first.webStorage.set(K.lastcat, 'animals');

    // Re-import the module fresh (a new in-memory connection cache),
    // without touching the underlying fake IndexedDB database — this is
    // the closest a jsdom test can get to "the storage layer restarted
    // but the disk it was backed by did not move". Real process-kill
    // durability is Tier 3 (apps/mobile/.maestro/persistence.yaml) — see
    // validation.md §4: "expo-sqlite durability across a genuine process
    // kill, as opposed to a page reload" is explicitly not provable here.
    vi.resetModules();
    const restarted = await import('@/services/storage/webStorage');
    expect(await restarted.webStorage.get(K.progress)).toEqual(['animals:כֶּלֶב']);
    expect(await restarted.webStorage.get(K.lastcat)).toBe('animals');
  });
});

/* ------------------------------------------------------------------ *
 * sqliteKvStorage (expo-sqlite/kv-store) — the native module has no
 * JS-only fallback, so it is mocked with a plain in-memory Map that
 * mirrors SQLiteStorage's async string-only contract. This proves the
 * TalkiStorage wrapper's own logic (JSON encode/decode, null-on-missing);
 * it is not proof of real SQLite durability, which is native-only and
 * out of Tier 1's reach by design (validation.md §2, "What Tier 1 does
 * not do").
 * ------------------------------------------------------------------ */
function makeFakeSqliteKvStore() {
  const map = new Map<string, string>();
  return {
    async getItemAsync(key: string): Promise<string | null> {
      return map.has(key) ? map.get(key)! : null;
    },
    async setItemAsync(key: string, value: string): Promise<void> {
      map.set(key, value);
    },
    async removeItemAsync(key: string): Promise<boolean> {
      return map.delete(key);
    },
    async getAllKeysAsync(): Promise<string[]> {
      return [...map.keys()];
    },
    __map: map,
  };
}

describe('sqliteKvStorage', () => {
  let fakeStore: ReturnType<typeof makeFakeSqliteKvStore>;

  beforeEach(() => {
    fakeStore = makeFakeSqliteKvStore();
    vi.doMock('expo-sqlite/kv-store', () => ({ Storage: fakeStore }));
  });

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('expo-sqlite/kv-store');
  });

  conformanceSuite('sqliteKvStorage', async () => {
    const mod = await import('@/services/storage/sqliteKvStorage');
    return mod.sqliteKvStorage;
  });

  it('keys survive a simulated restart of the storage layer', async () => {
    const first = await import('@/services/storage/sqliteKvStorage');
    await first.sqliteKvStorage.set(K.progress, ['animals:כֶּלֶב']);

    // "Restart" here means: re-import the wrapper module (discarding any
    // module-level JS state it might hold) while the underlying store
    // (the fake, standing in for the SQLite file on disk) is untouched.
    vi.resetModules();
    vi.doMock('expo-sqlite/kv-store', () => ({ Storage: fakeStore }));
    const restarted = await import('@/services/storage/sqliteKvStorage');
    expect(await restarted.sqliteKvStorage.get(K.progress)).toEqual(['animals:כֶּלֶב']);
  });

  it('a value that fails to JSON.parse is treated as missing, not thrown', async () => {
    fakeStore.__map.set(K.lastcat, 'not valid json {{{');
    const mod = await import('@/services/storage/sqliteKvStorage');
    await expect(mod.sqliteKvStorage.get(K.lastcat)).resolves.toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * Platform selection — webStorage must never be selected off web.
 *
 * The real runtime selection is done by Metro's platform-extension file
 * resolution (index.ts for native, index.web.ts for web — see both files'
 * doc comments for why a shared file with a runtime Platform.OS branch was
 * tried first and rejected: it made expo-sqlite reachable from the web
 * bundle's module graph, and `expo export --platform web` failed trying to
 * resolve expo-sqlite's web worker's wa-sqlite.wasm asset). That makes the
 * "never selected on native" property structural rather than a runtime
 * check this test could get wrong the same way the code could — but the
 * mapping itself, and each file's actual export, are still directly
 * tested below.
 * ------------------------------------------------------------------ */
describe('storage platform selection', () => {
  it('selectStorage() picks the web backend only for "web"', async () => {
    const { selectStorage } = await import('@/services/storage/platformSelect');
    const web = { get: vi.fn(), set: vi.fn(), remove: vi.fn(), keys: vi.fn() };
    const native = { get: vi.fn(), set: vi.fn(), remove: vi.fn(), keys: vi.fn() };
    expect(selectStorage('web', { web, native })).toBe(web);
  });

  it.each(['ios', 'android', 'windows', 'macos'])('selectStorage() picks the native backend, never web, for %s', async (os) => {
    const { selectStorage } = await import('@/services/storage/platformSelect');
    const web = { get: vi.fn(), set: vi.fn(), remove: vi.fn(), keys: vi.fn() };
    const native = { get: vi.fn(), set: vi.fn(), remove: vi.fn(), keys: vi.fn() };
    expect(selectStorage(os, { web, native })).toBe(native);
    expect(selectStorage(os, { web, native })).not.toBe(web);
  });

  it('index.ts (the native entry point) exports sqliteKvStorage, never webStorage', async () => {
    vi.resetModules();
    vi.doMock('expo-sqlite/kv-store', () => ({ Storage: makeFakeSqliteKvStore() }));
    const { storage } = await import('@/services/storage/index');
    const { sqliteKvStorage } = await import('@/services/storage/sqliteKvStorage');
    const { webStorage } = await import('@/services/storage/webStorage');
    expect(storage).toBe(sqliteKvStorage);
    expect(storage).not.toBe(webStorage);
    vi.doUnmock('expo-sqlite/kv-store');
    vi.resetModules();
  });

  it('index.web.ts (the web entry point) exports webStorage, and never imports expo-sqlite at all', async () => {
    // Deliberately NOT mocking expo-sqlite/kv-store here: if index.web.ts
    // imported sqliteKvStorage.ts (directly or transitively), this test
    // would fail to even load, the same way the real web bundler failed
    // to resolve wa-sqlite.wasm when a shared file did that.
    vi.resetModules();
    const { storage } = await import('@/services/storage/index.web');
    const { webStorage } = await import('@/services/storage/webStorage');
    expect(storage).toBe(webStorage);
    vi.resetModules();
  });
});
