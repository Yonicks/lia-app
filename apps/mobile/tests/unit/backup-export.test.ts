import { beforeEach, describe, expect, it, vi } from 'vitest';

import { K } from '@/services/storage/keys';

import { createFakeCrypto, createFakeFileSystem } from './helpers/fakeFileSystem';
import { createInMemoryStorage } from './helpers/inMemoryStorage';

const fakeFs = createFakeFileSystem();
vi.mock('expo-file-system', () => fakeFs);
vi.mock('expo-crypto', () => createFakeCrypto());

const { createBackupService } = await import('@/services/backup/BackupService');
const { saveRecordingFromDataUrl } = await import('@/services/recordings/recordingStore');

describe('BackupService.exportV1', () => {
  let storage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(() => {
    storage = createInMemoryStorage();
  });

  it('payload shape exactly matches the V1 contract, no extra fields', async () => {
    await storage.set(K.progress, ['animals:כֶּלֶב']);
    const service = createBackupService(storage);
    const payload = await service.exportV1();

    expect(Object.keys(payload).sort()).toEqual(['app', 'data', 'exported_at', 'version', 'word_count'].sort());
  });

  it('app === "talki" and version === 1', async () => {
    const service = createBackupService(storage);
    const payload = await service.exportV1();
    expect(payload.app).toBe('talki');
    expect(payload.version).toBe(1);
  });

  it('word_count equals the learned-set size (deduplicated lia:progress)', async () => {
    await storage.set(K.progress, ['animals:כֶּלֶב', 'food:תַּפּוּחַ', 'animals:כֶּלֶב']);
    const service = createBackupService(storage);
    const payload = await service.exportV1();
    expect(payload.word_count).toBe(2);
  });

  it('word_count is 0 when there is no progress at all', async () => {
    const service = createBackupService(storage);
    const payload = await service.exportV1();
    expect(payload.word_count).toBe(0);
  });

  it('data contains every key present in storage', async () => {
    await storage.set(K.progress, ['animals:כֶּלֶב']);
    await storage.set(K.stats, { 'animals:כֶּלֶב': { seen: 3, wrong: 1 } });
    await storage.set(K.lastcat, 'animals');
    const service = createBackupService(storage);
    const payload = await service.exportV1();

    expect(payload.data[K.progress]).toEqual(['animals:כֶּלֶב']);
    expect(payload.data[K.stats]).toEqual({ 'animals:כֶּלֶב': { seen: 3, wrong: 1 } });
    expect(payload.data[K.lastcat]).toBe('animals');
  });

  it('exported_at parses as a valid ISO date', async () => {
    const service = createBackupService(storage);
    const payload = await service.exportV1();
    const parsed = new Date(payload.exported_at);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
    expect(payload.exported_at).toBe(parsed.toISOString());
  });

  it('settings.lastBackup is written to storage after export', async () => {
    await storage.set(K.settings, { rate: 0.85, niqqud: true });
    const service = createBackupService(storage);
    await service.exportV1();

    const settingsAfter = await storage.get<{ lastBackup?: string }>(K.settings);
    expect(typeof settingsAfter?.lastBackup).toBe('string');
    expect(Number.isNaN(new Date(settingsAfter!.lastBackup!).getTime())).toBe(false);
  });

  it('a recording is exported as a data URL, not a file reference', async () => {
    const recKey = K.rec('animals:כֶּלֶב');
    const ref = await saveRecordingFromDataUrl('animals:כֶּלֶב', 'data:audio/webm;base64,AAAA');
    await storage.set(recKey, ref);

    const service = createBackupService(storage);
    const payload = await service.exportV1();

    expect(typeof payload.data[recKey]).toBe('string');
    expect(payload.data[recKey]).toBe('data:audio/webm;base64,AAAA');
  });
});
