import { formatStorageInfo, storageLabel, type StorageInfo } from './storageInfo';

export async function readStorageInfo(): Promise<StorageInfo> {
  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    if (est) {
      usageBytes = typeof est.usage === 'number' ? est.usage : null;
      quotaBytes = typeof est.quota === 'number' ? est.quota : null;
    }
  } catch {
    /* ignore */
  }
  return {
    engine: 'indexeddb',
    label: storageLabel('indexeddb'),
    usageBytes,
    quotaBytes,
  };
}

export { formatStorageInfo };
