export interface StorageInfo {
  engine: 'indexeddb' | 'sqlite' | 'memory';
  label: string;
  usageBytes: number | null;
  quotaBytes: number | null;
}

const LABELS: Record<StorageInfo['engine'], string> = {
  indexeddb: 'IndexedDB (קבוע במכשיר)',
  sqlite: 'SQLite (קבוע במכשיר)',
  memory: 'זיכרון זמני — לא יישמר!',
};

export function storageLabel(engine: StorageInfo['engine']): string {
  return LABELS[engine];
}

/** index.html 3828-3831 */
export function formatStorageInfo(info: StorageInfo): string {
  const used =
    info.usageBytes != null && info.quotaBytes
      ? ` · בשימוש: ${(info.usageBytes / 1048576).toFixed(1)}MB מתוך ${(info.quotaBytes / 1048576 / 1024).toFixed(1)}GB`
      : '';
  return 'שיטת אחסון: ' + info.label + used;
}
