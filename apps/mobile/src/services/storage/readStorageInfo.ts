import { formatStorageInfo, storageLabel, type StorageInfo } from './storageInfo';

/** Native: SQLite, no browser quota API. */
export async function readStorageInfo(): Promise<StorageInfo> {
  return {
    engine: 'sqlite',
    label: storageLabel('sqlite'),
    usageBytes: null,
    quotaBytes: null,
  };
}

export { formatStorageInfo };
