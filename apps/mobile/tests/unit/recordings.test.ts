import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { K } from '@/services/storage/keys';

import { createFakeCrypto, createFakeFileSystem } from './helpers/fakeFileSystem';
import { createInMemoryStorage } from './helpers/inMemoryStorage';

let fakeFs: ReturnType<typeof createFakeFileSystem>;

/* vi.mock (statically hoisted) only invokes its factory once per resolved
 * module id per test file in some cache states, which silently keeps a
 * stale fakeFs around after resetModules() + reassignment. vi.doMock,
 * called fresh in beforeEach with the CURRENT fakeFs closed over, does not
 * have that trap — see storage.test.ts's sqliteKvStorage suite for the same
 * pattern. */
function mockNativeModules() {
  vi.doMock('expo-file-system', () => fakeFs);
  vi.doMock('expo-crypto', () => createFakeCrypto());
}

describe('recordingStore', () => {
  beforeEach(() => {
    vi.resetModules();
    fakeFs = createFakeFileSystem();
    mockNativeModules();
  });

  afterEach(() => {
    vi.doUnmock('expo-file-system');
    vi.doUnmock('expo-crypto');
  });

  it('a recording written as a file is readable back', async () => {
    const { saveRecordingFromDataUrl, loadRecordingAsDataUrl } = await import('@/services/recordings/recordingStore');
    const dataUrl = 'data:audio/webm;base64,SGVsbG8gd29ybGQ=';
    const ref = await saveRecordingFromDataUrl('animals:כֶּלֶב', dataUrl);

    expect(ref.uri).toBeTruthy();
    expect(ref.mime).toBe('audio/webm');
    expect(fakeFs.__files.has(ref.uri)).toBe(true);

    const readBack = await loadRecordingAsDataUrl(ref);
    expect(readBack).toBe(dataUrl);
  });

  it('file -> data URL -> file round-trips byte-identically', async () => {
    const { saveRecordingFromDataUrl, loadRecordingAsDataUrl } = await import('@/services/recordings/recordingStore');
    const original = 'data:audio/webm;base64,AAECAwQFBgcICQoLDA0ODw==';

    const ref1 = await saveRecordingFromDataUrl('animals:כֶּלֶב', original);
    const dataUrlOut = await loadRecordingAsDataUrl(ref1);
    expect(dataUrlOut).toBe(original);

    // Round-trip again through a second file, proving the base64 payload
    // itself never mutates across the boundary, not just that one
    // direction happens to match.
    const ref2 = await saveRecordingFromDataUrl('food:תַּפּוּחַ', dataUrlOut);
    const dataUrlOut2 = await loadRecordingAsDataUrl(ref2);
    expect(dataUrlOut2).toBe(original);
  });

  it('distinct keys never collide onto the same filename', async () => {
    const { saveRecordingFromDataUrl } = await import('@/services/recordings/recordingStore');
    const refA = await saveRecordingFromDataUrl('animals:כֶּלֶב', 'data:audio/webm;base64,AAAA');
    const refB = await saveRecordingFromDataUrl('animals:חָתוּל', 'data:audio/webm;base64,BBBB');
    expect(refA.uri).not.toBe(refB.uri);
  });

  it('the recording filename is a hash, not the (Hebrew, colon-bearing) key transliterated', async () => {
    const { saveRecordingFromDataUrl, hashRecordingKey } = await import('@/services/recordings/recordingStore');
    const key = 'animals:כֶּלֶב';
    const ref = await saveRecordingFromDataUrl(key, 'data:audio/webm;base64,AAAA');
    const expectedHash = await hashRecordingKey(key);

    expect(ref.uri).toContain(expectedHash);
    const filename = ref.uri.split('/').pop()!;
    expect(filename).not.toContain('כ');
    expect(filename).not.toContain(':');
  });

  it('re-saving under the same key overwrites rather than accumulating files', async () => {
    const { saveRecordingFromDataUrl } = await import('@/services/recordings/recordingStore');
    const ref1 = await saveRecordingFromDataUrl('animals:כֶּלֶב', 'data:audio/webm;base64,AAAA');
    const ref2 = await saveRecordingFromDataUrl('animals:כֶּלֶב', 'data:audio/webm;base64,BBBB');
    expect(ref2.uri).toBe(ref1.uri);
    expect(fakeFs.__files.size).toBe(1);
  });

  it('deleting a word\'s recording removes the file, not just the key', async () => {
    const { saveRecordingFromDataUrl, deleteRecordingFile } = await import('@/services/recordings/recordingStore');
    const storage = createInMemoryStorage();
    const key = 'animals:כֶּלֶב';
    const ref = await saveRecordingFromDataUrl(key, 'data:audio/webm;base64,AAAA');
    await storage.set(K.rec(key), ref);

    expect(fakeFs.__files.has(ref.uri)).toBe(true);

    deleteRecordingFile(ref);
    await storage.remove(K.rec(key));

    expect(fakeFs.__files.has(ref.uri)).toBe(false);
    expect(await storage.get(K.rec(key))).toBeNull();
  });

  it('isRecordingRef distinguishes a file reference from a legacy-shaped data URL string', async () => {
    const { saveRecordingFromDataUrl, isRecordingRef } = await import('@/services/recordings/recordingStore');
    const ref = await saveRecordingFromDataUrl('animals:כֶּלֶב', 'data:audio/webm;base64,AAAA');
    expect(isRecordingRef(ref)).toBe(true);
    expect(isRecordingRef('data:audio/webm;base64,AAAA')).toBe(false);
    expect(isRecordingRef(null)).toBe(false);
    expect(isRecordingRef(undefined)).toBe(false);
  });
});

describe('recordingStore + BackupService — export/import boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    fakeFs = createFakeFileSystem();
    mockNativeModules();
  });

  afterEach(() => {
    vi.doUnmock('expo-file-system');
    vi.doUnmock('expo-crypto');
  });

  it('an exported payload contains a data URL, not a file path, for a recording key', async () => {
    const { saveRecordingFromDataUrl } = await import('@/services/recordings/recordingStore');
    const { createBackupService } = await import('@/services/backup/BackupService');
    const storage = createInMemoryStorage();

    const key = 'animals:כֶּלֶב';
    const ref = await saveRecordingFromDataUrl(key, 'data:audio/webm;base64,AAAA');
    await storage.set(K.rec(key), ref);

    const service = createBackupService(storage);
    const payload = await service.exportV1();

    const exportedValue = payload.data[K.rec(key)];
    expect(typeof exportedValue).toBe('string');
    expect(exportedValue as string).toMatch(/^data:audio\/webm;base64,/);
    expect(exportedValue).not.toContain('file://');
  });

  it('importing a legacy data URL produces a playable (readable) file', async () => {
    const { loadRecordingAsDataUrl } = await import('@/services/recordings/recordingStore');
    const { createBackupService } = await import('@/services/backup/BackupService');
    const storage = createInMemoryStorage();
    const service = createBackupService(storage);

    const key = 'animals:כֶּלֶב';
    const legacyDataUrl = 'data:audio/webm;base64,SGVsbG8gd29ybGQ=';
    const payload = { app: 'lia-words' as const, version: 1 as const, exported_at: new Date().toISOString(), word_count: 0, data: { [K.rec(key)]: legacyDataUrl } };

    await service.importV1(payload, 'replace');

    const ref = await storage.get<{ uri: string; mime: string }>(K.rec(key));
    expect(ref).not.toBeNull();
    const playedBack = await loadRecordingAsDataUrl(ref!);
    expect(playedBack).toBe(legacyDataUrl);
  });
});
