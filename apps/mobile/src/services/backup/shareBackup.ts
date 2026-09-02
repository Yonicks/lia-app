import type { TalkiBackupV1 } from './schema';

/**
 * Web download / native share of an already-built backup payload.
 * Screens must not import expo-* — this file stays a service.
 */
export function downloadBackupJson(payload: TalkiBackupV1, filename = 'talki-backup.json'): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function pickBackupJsonFile(): Promise<string | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? await file.text() : null);
    };
    input.click();
  });
}
