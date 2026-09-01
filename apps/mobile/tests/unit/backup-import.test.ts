import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { K } from '@/services/storage/keys';

import { createFakeCrypto, createFakeFileSystem } from './helpers/fakeFileSystem';
import { createInMemoryStorage } from './helpers/inMemoryStorage';

const fakeFs = createFakeFileSystem();
vi.mock('expo-file-system', () => fakeFs);
vi.mock('expo-crypto', () => createFakeCrypto());

const { createBackupService } = await import('@/services/backup/BackupService');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.resolve(__dirname, '../../../../docs/migration/fixtures/legacy-backup-v1.json');
const REAL_FIXTURE_RAW = readFileSync(FIXTURE_PATH, 'utf8');
const REAL_FIXTURE = JSON.parse(REAL_FIXTURE_RAW);

describe('BackupService.importV1 — the real generated fixture', () => {
  it('exists, was generated from the real legacy app, and matches the V1 contract', () => {
    expect(REAL_FIXTURE.app).toBe('talki');
    expect(REAL_FIXTURE.version).toBe(1);
    expect(typeof REAL_FIXTURE.exported_at).toBe('string');
    expect(typeof REAL_FIXTURE.word_count).toBe('number');
    expect(REAL_FIXTURE.data).toBeTypeOf('object');
    // Produced by tools/capture-legacy-backup-fixture.mjs driving a real
    // browser against the real legacy app — the seeded scenario spans two
    // categories, a custom word with a photo, a recording, and non-default
    // settings including puzzleLevel, so this is not a minimal payload.
    expect(Object.keys(REAL_FIXTURE.data).some((k) => k.startsWith('lia:rec:'))).toBe(true);
    expect(Object.keys(REAL_FIXTURE.data)).toContain('lia:custom:index');
    expect(Object.keys(REAL_FIXTURE.data)).toContain(K.progress);
    expect(Object.keys(REAL_FIXTURE.data)).toContain(K.stats);
    expect(Object.keys(REAL_FIXTURE.data)).toContain(K.settings);
    expect(REAL_FIXTURE.data[K.settings].puzzleLevel).toBeDefined();
  });

  it('imports successfully in replace mode', async () => {
    const storage = createInMemoryStorage();
    const service = createBackupService(storage);
    const result = await service.importV1(REAL_FIXTURE, 'replace');
    expect(result.imported).toBe(Object.keys(REAL_FIXTURE.data).length);

    const progress = await storage.get<string[]>(K.progress);
    expect(progress).toEqual(REAL_FIXTURE.data[K.progress]);
    const settings = await storage.get<Record<string, unknown>>(K.settings);
    expect(settings?.puzzleLevel).toBe(REAL_FIXTURE.data[K.settings].puzzleLevel);
  });

  it('imports successfully in merge mode', async () => {
    const storage = createInMemoryStorage();
    const service = createBackupService(storage);
    const result = await service.importV1(REAL_FIXTURE, 'merge');
    expect(result.imported).toBeGreaterThan(0);
  });

  it('the seeded recording becomes a playable file reference after import', async () => {
    const storage = createInMemoryStorage();
    const service = createBackupService(storage);
    await service.importV1(REAL_FIXTURE, 'replace');

    const recKey = Object.keys(REAL_FIXTURE.data).find((k) => k.startsWith('lia:rec:'))!;
    const ref = await storage.get<{ uri: string; mime: string }>(recKey);
    expect(ref).not.toBeNull();
    expect(typeof ref!.uri).toBe('string');
    expect(ref!.mime).toBe('audio/webm');
  });

  it('accepts a raw JSON string of the real fixture, not just a parsed object', async () => {
    const storage = createInMemoryStorage();
    const service = createBackupService(storage);
    const result = await service.importV1(REAL_FIXTURE_RAW, 'replace');
    expect(result.imported).toBe(Object.keys(REAL_FIXTURE.data).length);
  });
});

describe('BackupService.importV1 — app name compatibility', () => {
  let storage: ReturnType<typeof createInMemoryStorage>;
  let service: ReturnType<typeof createBackupService>;

  beforeEach(() => {
    storage = createInMemoryStorage();
    service = createBackupService(storage);
  });

  it('app: "lia-words" — the former product name — is accepted', async () => {
    const payload = { app: 'lia-words', version: 1, exported_at: new Date().toISOString(), word_count: 1, data: { [K.lastcat]: 'animals' } };
    const result = await service.importV1(payload, 'replace');
    expect(result.imported).toBe(1);
    expect(await storage.get(K.lastcat)).toBe('animals');
  });

  it('app: "talki" is accepted', async () => {
    const payload = { app: 'talki', version: 1, exported_at: new Date().toISOString(), word_count: 0, data: { [K.lastcat]: 'food' } };
    const result = await service.importV1(payload, 'replace');
    expect(result.imported).toBe(1);
  });

  it('app: "something-else" is rejected with a reason', () => {
    const payload = { app: 'something-else', version: 1, exported_at: new Date().toISOString(), word_count: 0, data: {} };
    const result = service.validate(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  it('app: "something-else" is rejected by importV1 too — nothing is written', async () => {
    await storage.set(K.lastcat, 'animals');
    const payload = { app: 'something-else', version: 1, exported_at: new Date().toISOString(), word_count: 0, data: { [K.lastcat]: 'food' } };
    const result = await service.importV1(payload, 'replace');
    expect(result.imported).toBe(0);
    expect(await storage.get(K.lastcat)).toBe('animals'); // untouched
  });
});

describe('BackupService.importV1 — malformed input never throws', () => {
  let storage: ReturnType<typeof createInMemoryStorage>;
  let service: ReturnType<typeof createBackupService>;

  beforeEach(() => {
    storage = createInMemoryStorage();
    service = createBackupService(storage);
  });

  it('a payload with no data is rejected', async () => {
    const payload = { app: 'talki', version: 1, exported_at: new Date().toISOString(), word_count: 0 };
    const result = await service.importV1(payload, 'replace');
    expect(result.imported).toBe(0);
  });

  it('a payload with no data is rejected by validate() with a reason', () => {
    const result = service.validate({ app: 'talki', version: 1 });
    expect(result.ok).toBe(false);
  });

  it('unparseable JSON is rejected without throwing', async () => {
    await expect(service.importV1('{"hello": not valid json', 'replace')).resolves.toEqual({ imported: 0 });
  });

  it('null is rejected without throwing', async () => {
    await expect(service.importV1(null, 'replace')).resolves.toEqual({ imported: 0 });
  });

  it('a plain junk object is rejected without corrupting existing storage', async () => {
    await storage.set(K.progress, ['animals:כֶּלֶב']);
    await service.importV1({ hello: 'world' }, 'merge');
    expect(await storage.get(K.progress)).toEqual(['animals:כֶּלֶב']);
  });

  it('missing keys in the payload do not crash the import', async () => {
    const payload = { app: 'talki', version: 1, exported_at: new Date().toISOString(), word_count: 0, data: { [K.lastcat]: 'animals' } };
    await expect(service.importV1(payload, 'replace')).resolves.toEqual({ imported: 1 });
    expect(await storage.get(K.progress)).toBeNull();
    expect(await storage.get(K.settings)).toBeNull();
  });
});

describe('BackupService.importV1 — replace vs merge semantics', () => {
  let storage: ReturnType<typeof createInMemoryStorage>;
  let service: ReturnType<typeof createBackupService>;

  beforeEach(() => {
    storage = createInMemoryStorage();
    service = createBackupService(storage);
  });

  it('replace mode clears pre-existing keys not present in the payload', async () => {
    await storage.set(K.lastcat, 'animals');
    await storage.set('lia:custom:index', ['orphan']);

    const payload = { app: 'talki', version: 1, exported_at: new Date().toISOString(), word_count: 1, data: { [K.progress]: ['animals:כֶּלֶב'] } };
    await service.importV1(payload, 'replace');

    expect(await storage.get(K.lastcat)).toBeNull();
    expect(await storage.get('lia:custom:index')).toBeNull();
    expect(await storage.get(K.progress)).toEqual(['animals:כֶּלֶב']);
  });

  it('merge mode unions lia:progress rather than overwriting it', async () => {
    await storage.set(K.progress, ['animals:כֶּלֶב', 'food:תַּפּוּחַ']);

    const payload = {
      app: 'talki',
      version: 1,
      exported_at: new Date().toISOString(),
      word_count: 2,
      data: { [K.progress]: ['food:תַּפּוּחַ', 'colors:אָדֹם'] },
    };
    await service.importV1(payload, 'merge');

    const merged = await storage.get<string[]>(K.progress);
    expect(new Set(merged)).toEqual(new Set(['animals:כֶּלֶב', 'food:תַּפּוּחַ', 'colors:אָדֹם']));
  });

  it('merge mode OVERWRITES lia:settings rather than merging it', async () => {
    await storage.set(K.settings, { rate: 0.85, niqqud: true, sounds: true, effects: true, music: true, musicVol: 0.5, voice: true, puzzleLevel: 4 });

    const payload = {
      app: 'talki',
      version: 1,
      exported_at: new Date().toISOString(),
      word_count: 0,
      data: { [K.settings]: { rate: 0.6, niqqud: false, sounds: true, effects: true, music: true, musicVol: 0.5, voice: true } },
    };
    await service.importV1(payload, 'merge');

    const settings = await storage.get<Record<string, unknown>>(K.settings);
    // Overwritten wholesale: puzzleLevel from the pre-existing value is
    // gone, not preserved by a deep merge.
    expect(settings).toEqual({ rate: 0.6, niqqud: false, sounds: true, effects: true, music: true, musicVol: 0.5, voice: true });
    expect(settings?.puzzleLevel).toBeUndefined();
  });

  it('replace mode also deletes the underlying recording file for a cleared rec key', async () => {
    const { saveRecordingFromDataUrl } = await import('@/services/recordings/recordingStore');
    const ref = await saveRecordingFromDataUrl('animals:כֶּלֶב', 'data:audio/webm;base64,AAAA');
    await storage.set(K.rec('animals:כֶּלֶב'), ref);
    expect(fakeFs.__files.has(ref.uri)).toBe(true);

    const payload = { app: 'talki', version: 1, exported_at: new Date().toISOString(), word_count: 0, data: {} };
    await service.importV1(payload, 'replace');

    expect(fakeFs.__files.has(ref.uri)).toBe(false);
    expect(await storage.get(K.rec('animals:כֶּלֶב'))).toBeNull();
  });
});
