import { describe, expect, it, vi } from 'vitest';

import { K } from '@/services/storage/keys';

import { createFakeCrypto, createFakeFileSystem } from './helpers/fakeFileSystem';
import { createInMemoryStorage } from './helpers/inMemoryStorage';

const fakeFs = createFakeFileSystem();
vi.mock('expo-file-system', () => fakeFs);
vi.mock('expo-crypto', () => createFakeCrypto());

const { createBackupService } = await import('@/services/backup/BackupService');

/** Seeds every key type storage.ts's conformance suite exercises, so the
 *  round trip covers the full shape a real user's data can take. */
async function seedEverything(storage: ReturnType<typeof createInMemoryStorage>) {
  await storage.set(K.progress, ['animals:כֶּלֶב', 'food:תַּפּוּחַ', 'colors:אָדֹם']);
  await storage.set(K.settings, {
    rate: 0.6,
    niqqud: false,
    sounds: true,
    effects: false,
    music: true,
    musicVol: 0.3,
    voice: true,
    lastBackup: '2026-01-01T00:00:00.000Z',
    puzzleLevel: 4,
  });
  await storage.set(K.stats, {
    'animals:כֶּלֶב': { seen: 7, wrong: 2 },
    'food:תַּפּוּחַ': { seen: 3, wrong: 0 },
  });
  await storage.set(K.lastcat, 'colors');
  await storage.set(K.customIndex, ['cw1']);
  await storage.set(K.custom('cw1'), {
    id: 'cw1',
    word: 'סַבְתָּא רוּתִי',
    emoji: '👵',
    photo: 'data:image/jpeg;base64,AAECAwQFBgc=',
  });
}

describe('BackupService round trip', () => {
  it('every seeded key type survives export -> wipe -> import with deep equality', async () => {
    const storage = createInMemoryStorage();
    await seedEverything(storage);

    const service = createBackupService(storage);
    const payload = await service.exportV1();

    // Wipe everything, as a genuine "reinstalled the app" scenario would.
    for (const k of await storage.keys()) {
      await storage.remove(k);
    }
    expect(await storage.keys()).toEqual([]);

    await service.importV1(payload, 'replace');

    expect(await storage.get(K.progress)).toEqual(['animals:כֶּלֶב', 'food:תַּפּוּחַ', 'colors:אָדֹם']);
    expect(await storage.get(K.stats)).toEqual({
      'animals:כֶּלֶב': { seen: 7, wrong: 2 },
      'food:תַּפּוּחַ': { seen: 3, wrong: 0 },
    });
    expect(await storage.get(K.lastcat)).toBe('colors');
    expect(await storage.get(K.customIndex)).toEqual(['cw1']);
    expect(await storage.get(K.custom('cw1'))).toEqual({
      id: 'cw1',
      word: 'סַבְתָּא רוּתִי',
      emoji: '👵',
      photo: 'data:image/jpeg;base64,AAECAwQFBgc=',
    });
  });

  it('settings.puzzleLevel survives the round trip', async () => {
    const storage = createInMemoryStorage();
    await seedEverything(storage);
    const service = createBackupService(storage);
    const payload = await service.exportV1();

    for (const k of await storage.keys()) await storage.remove(k);
    await service.importV1(payload, 'replace');

    const settings = await storage.get<{ puzzleLevel?: number }>(K.settings);
    expect(settings?.puzzleLevel).toBe(4);
  });

  it('settings.lastBackup — the value present at export time — survives the round trip', async () => {
    // exportV1() snapshots `data` BEFORE it overwrites the live
    // settings.lastBackup (ported exactly from index.html 1754-1772, see
    // BackupService.ts). So the payload's own lia:settings.lastBackup is
    // whatever was seeded going in, not a value the export call invents.
    const storage = createInMemoryStorage();
    await seedEverything(storage);
    const service = createBackupService(storage);
    const payload = await service.exportV1();

    expect((payload.data[K.settings] as { lastBackup?: string }).lastBackup).toBe('2026-01-01T00:00:00.000Z');

    for (const k of await storage.keys()) await storage.remove(k);
    await service.importV1(payload, 'replace');

    const settings = await storage.get<{ lastBackup?: string }>(K.settings);
    expect(settings?.lastBackup).toBe('2026-01-01T00:00:00.000Z');
  });

  it('custom word photos survive the round trip byte-for-byte (same base64 string)', async () => {
    const storage = createInMemoryStorage();
    await seedEverything(storage);
    const service = createBackupService(storage);
    const payload = await service.exportV1();

    for (const k of await storage.keys()) await storage.remove(k);
    await service.importV1(payload, 'replace');

    const item = await storage.get<{ photo: string }>(K.custom('cw1'));
    expect(item?.photo).toBe('data:image/jpeg;base64,AAECAwQFBgc=');
  });

  it('stats survive with exact seen and wrong values, not just non-zero', async () => {
    const storage = createInMemoryStorage();
    await seedEverything(storage);
    const service = createBackupService(storage);
    const payload = await service.exportV1();

    for (const k of await storage.keys()) await storage.remove(k);
    await service.importV1(payload, 'replace');

    const stats = await storage.get<Record<string, { seen: number; wrong: number }>>(K.stats);
    expect(stats?.['animals:כֶּלֶב']).toEqual({ seen: 7, wrong: 2 });
    expect(stats?.['food:תַּפּוּחַ']).toEqual({ seen: 3, wrong: 0 });
  });

  it('round trips through merge mode too, on an empty starting store', async () => {
    const storage = createInMemoryStorage();
    await seedEverything(storage);
    const service = createBackupService(storage);
    const payload = await service.exportV1();

    for (const k of await storage.keys()) await storage.remove(k);
    await service.importV1(payload, 'merge');

    expect(await storage.get(K.progress)).toEqual(['animals:כֶּלֶב', 'food:תַּפּוּחַ', 'colors:אָדֹם']);
    expect((await storage.get<{ puzzleLevel?: number }>(K.settings))?.puzzleLevel).toBe(4);
  });
});
