import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import { buildDataUrl, parseDataUrl } from '../backup/dataUrl';

/**
 * Recordings move to files on disk natively — the one deliberate deviation
 * from parity in this phase (phase-03-plan.md, "Recordings move to files on
 * disk, and convert back at the export boundary"). Legacy stores each
 * recording as a base64 data URL string under `lia:rec:<key>` (index.html
 * 3943-3947). In SQLite that would mean megabytes of base64 in a KV table,
 * read fully into memory on every access, with a ~33% encoding penalty.
 *
 * So the KV value for `lia:rec:<key>` becomes this reference:
 *   { uri: 'file:///.../<hash>.<ext>', mime: 'audio/webm' }
 * and the conversion back to a data URL — the shape a legacy backup file
 * actually contains — happens only at the backup export/import boundary
 * (BackupService), using the functions in this module.
 *
 * Filenames: recording keys embed Hebrew and a colon (e.g.
 * "animals:כֶּלֶב" — see progress/keys.ts's `key()`). Colons are illegal in
 * filenames on some platforms, and Hebrew must not be transliterated into
 * ASCII (phase-03-plan.md, "Recording filename encoding"). So the key is
 * hashed (SHA-256, hex) to produce the filename, and the mapping back to the
 * original key lives in the KV store, not in the filename.
 */
export interface RecordingRef {
  uri: string;
  mime: string;
}

const RECORDINGS_DIR_NAME = 'talki-recordings';

function recordingsDirectory(): Directory {
  const dir = new Directory(Paths.document, RECORDINGS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export async function hashRecordingKey(key: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

/** Legacy tries these MediaRecorder mime types in order (index.html
 *  3931-3933). The extension is cosmetic — mime is what governs playback —
 *  but keeping it recognisable makes the on-disk files debuggable. */
function extensionForMime(mime: string): string {
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('mp4')) return '.mp4';
  if (mime.includes('aac')) return '.aac';
  if (mime.includes('ogg')) return '.ogg';
  return '.bin';
}

export function isRecordingRef(value: unknown): value is RecordingRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { uri?: unknown }).uri === 'string' &&
    typeof (value as { mime?: unknown }).mime === 'string'
  );
}

/** Import boundary: data URL -> write file -> return the reference to store
 *  under `lia:rec:<key>`. */
export async function saveRecordingFromDataUrl(key: string, dataUrl: string): Promise<RecordingRef> {
  const { mime, base64 } = parseDataUrl(dataUrl);
  const dir = recordingsDirectory();
  const hash = await hashRecordingKey(key);
  const file = new File(dir, `${hash}${extensionForMime(mime)}`);
  file.create({ overwrite: true, intermediates: true });
  file.write(base64, { encoding: 'base64' });
  return { uri: file.uri, mime };
}

/**
 * Phase 4 addition: a live microphone capture (`expo-audio`'s
 * `AudioRecorder`, which writes straight to a temp file) -> moved into the
 * same recordings directory `saveRecordingFromDataUrl` uses, under the same
 * hashed filename scheme. Used by `services/recording/expoRecording.ts`
 * instead of the data-URL path because a native recording is already a
 * file — round-tripping it through base64 first would be pure overhead.
 * `RecordingService.stop()` is the only caller.
 */
export async function saveRecordingFromFile(
  key: string,
  sourceUri: string,
  mime: string
): Promise<RecordingRef> {
  const dir = recordingsDirectory();
  const hash = await hashRecordingKey(key);
  const dest = new File(dir, `${hash}${extensionForMime(mime)}`);
  const source = new File(sourceUri);
  await source.copy(dest);
  try {
    source.delete();
  } catch {
    // best-effort cleanup of the recorder's own temp file; the saved copy
    // under `dest` is what matters and already exists at this point.
  }
  return { uri: dest.uri, mime };
}

/** Export boundary: file -> data URL, exactly what backup version 1
 *  contains. */
export async function loadRecordingAsDataUrl(ref: RecordingRef): Promise<string> {
  const file = new File(ref.uri);
  const base64 = await file.base64();
  return buildDataUrl(ref.mime, base64);
}

/** Deletes the file a recording reference points at. Callers are
 *  responsible for also removing the `lia:rec:<key>` entry from storage —
 *  this only ever touches the filesystem. */
export function deleteRecordingFile(ref: RecordingRef): void {
  const file = new File(ref.uri);
  if (file.exists) {
    file.delete();
  }
}
