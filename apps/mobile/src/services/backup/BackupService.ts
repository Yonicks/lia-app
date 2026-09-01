import { deleteRecordingFile, isRecordingRef, loadRecordingAsDataUrl, saveRecordingFromDataUrl } from '../recordings/recordingStore';
import { isRecordingKey, K } from '../storage/keys';
import type { TalkiStorage } from '../storage/TalkiStorage';
import { BACKUP_VERSION, type ImportMode, type TalkiBackupV1, validateBackupPayload, type ValidationResult } from './schema';

export type { ImportMode, TalkiBackupV1, ValidationResult } from './schema';

export interface BackupService {
  exportV1(): Promise<TalkiBackupV1>;
  importV1(payload: unknown, mode: ImportMode): Promise<{ imported: number }>;
  validate(payload: unknown): ValidationResult;
}

/**
 * Ported from exportBackup()/importBackup() (index.html 1754-1799). All
 * data-URL <-> file conversion for recordings is confined to this service
 * (via services/recordings/recordingStore.ts) — nothing else in the app
 * ever has to know a recording was ever a data URL.
 */
export function createBackupService(storage: TalkiStorage): BackupService {
  return {
    async exportV1(): Promise<TalkiBackupV1> {
      const keys = await storage.keys();
      const data: Record<string, unknown> = {};
      for (const k of keys) {
        const raw = await storage.get<unknown>(k);
        data[k] = isRecordingKey(k) && isRecordingRef(raw) ? await loadRecordingAsDataUrl(raw) : raw;
      }

      const progress = Array.isArray(data[K.progress]) ? (data[K.progress] as unknown[]) : [];

      const payload: TalkiBackupV1 = {
        app: 'talki',
        version: BACKUP_VERSION,
        exported_at: new Date().toISOString(),
        word_count: new Set(progress).size,
        data,
      };

      // Ported exactly from index.html 1754-1772: the payload snapshot is
      // taken FIRST, and settings.lastBackup is set and persisted to
      // storage only AFTER — so the just-downloaded file's own
      // data['lia:settings'].lastBackup lags one export behind the value
      // now sitting in storage. This is legacy's real behaviour and is
      // preserved deliberately; see phase-03-report.md "Findings and drift".
      const existingSettings = (data[K.settings] as Record<string, unknown> | null | undefined) ?? {};
      const updatedSettings = { ...existingSettings, lastBackup: new Date().toISOString() };
      await storage.set(K.settings, updatedSettings);

      return payload;
    },

    validate(payload: unknown): ValidationResult {
      return validateBackupPayload(payload);
    },

    async importV1(payload: unknown, mode: ImportMode): Promise<{ imported: number }> {
      // Mirrors index.html 1777-1779: JSON.parse wrapped in try/catch, a
      // parse failure toasts and returns rather than throwing to the
      // caller. importV1 accepts either an already-parsed object (the
      // common native path — the caller read the file itself) or a raw
      // string, so "unparseable JSON rejected without throwing" is
      // exercisable directly against this function.
      let parsed: unknown;
      if (typeof payload === 'string') {
        try {
          parsed = JSON.parse(payload);
        } catch {
          return { imported: 0 };
        }
      } else {
        parsed = payload;
      }

      const result = validateBackupPayload(parsed);
      if (!result.ok) {
        return { imported: 0 };
      }
      const typed = parsed as TalkiBackupV1;

      if (mode === 'replace') {
        // index.html 1783-1785: delete every existing key first. Recording
        // keys also own a file on disk (the one deliberate representation
        // change from legacy — see recordingStore.ts) so its file is
        // removed too, best-effort, before the key itself is dropped.
        const existingKeys = await storage.keys();
        for (const k of existingKeys) {
          if (isRecordingKey(k)) {
            const ref = await storage.get<unknown>(k);
            if (isRecordingRef(ref)) {
              try {
                deleteRecordingFile(ref);
              } catch {
                // Best-effort: an orphaned file is a disk-space nuisance,
                // not a correctness problem — the KV key removal below is
                // what import/export correctness depends on.
              }
            }
          }
          await storage.remove(k);
        }
      }

      const entries = Object.entries(typed.data ?? {});
      let imported = 0;
      for (const [k, v] of entries) {
        // Import boundary: a legacy data-URL recording becomes a file
        // reference before it is ever stored (recordingStore.ts).
        const valueToStore: unknown = isRecordingKey(k) && typeof v === 'string' && v.startsWith('data:')
          ? await saveRecordingFromDataUrl(k, v)
          : v;

        if (mode === 'merge' && k === K.progress) {
          // index.html 1788-1791: merge UNIONS lia:progress through a Set.
          // It is not a deep merge of anything else.
          const current = (await storage.get<string[]>(k)) ?? [];
          const incoming = Array.isArray(v) ? (v as string[]) : [];
          await storage.set(k, [...new Set([...current, ...incoming])]);
        } else {
          // Every other key, in both modes, is a plain overwrite.
          await storage.set(k, valueToStore);
        }
        imported++;
      }

      return { imported };
    },
  };
}
