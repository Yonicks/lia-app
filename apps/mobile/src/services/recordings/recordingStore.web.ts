import * as Crypto from 'expo-crypto';

import { buildDataUrl, parseDataUrl } from '../backup/dataUrl';

/**
 * Web has no usable expo-file-system File.write (validatePath is missing).
 * Keep the data URL as the ref URI — the same shape legacy stores under
 * `lia:rec:*`, and what BackupService already expects at the export boundary.
 */

export interface RecordingRef {
  uri: string;
  mime: string;
}

export async function hashRecordingKey(key: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

export function isRecordingRef(value: unknown): value is RecordingRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { uri?: unknown }).uri === 'string' &&
    typeof (value as { mime?: unknown }).mime === 'string'
  );
}

export async function saveRecordingFromDataUrl(key: string, dataUrl: string): Promise<RecordingRef> {
  void key;
  const { mime } = parseDataUrl(dataUrl);
  return { uri: dataUrl, mime };
}

export async function saveRecordingFromFile(
  key: string,
  sourceUri: string,
  mime: string,
): Promise<RecordingRef> {
  void key;
  return { uri: sourceUri, mime };
}

export async function loadRecordingAsDataUrl(ref: RecordingRef): Promise<string> {
  if (ref.uri.startsWith('data:')) return ref.uri;
  const res = await fetch(ref.uri);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const base64 = btoa(binary);
  return buildDataUrl(ref.mime, base64);
}

export function deleteRecordingFile(ref: RecordingRef): void {
  void ref;
}
