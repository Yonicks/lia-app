import { storage } from '../storage';

import { createBackupService } from './BackupService';

export const backupService = createBackupService(storage);
export type { BackupService, ImportMode, TalkiBackupV1 } from './BackupService';
