/**
 * The backup version 1 payload contract, ported verbatim from
 * exportBackup()/importBackup() (index.html 1754-1799). Exactly five fields,
 * no extras — see phase-03-plan.md, "No new backup version": the schema has
 * not changed, so BACKUP_VERSION must not either. Bumping it would make a
 * file produced by the native app unreadable by the legacy app during the
 * overlap when both are installed.
 */
export const BACKUP_VERSION = 1 as const;

/** 'lia-words' is Talki's former product name and appears in real backups
 *  made before the rename. Rejecting it breaks exactly the long-standing
 *  users this compatibility work exists for (index.html 1781). */
export type BackupAppName = 'talki' | 'lia-words';

export interface TalkiBackupV1 {
  app: BackupAppName;
  version: 1;
  exported_at: string;
  word_count: number;
  data: Record<string, unknown>;
}

export type ImportMode = 'merge' | 'replace';

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Structural validation only — this does not decide whether individual keys
 * inside `data` make sense, only whether the envelope is a backup Talki (or
 * lia-words) could have produced. Mirrors the legacy guard exactly
 * (index.html 1781):
 *   payload && (payload.app === 'talki' || payload.app === 'lia-words') && payload.data
 */
export function validateBackupPayload(payload: unknown): ValidationResult {
  if (payload === null || typeof payload !== 'object') {
    return { ok: false, reason: 'payload is not an object' };
  }
  const candidate = payload as Record<string, unknown>;

  if (candidate.app !== 'talki' && candidate.app !== 'lia-words') {
    return { ok: false, reason: `unrecognized app "${String(candidate.app)}" — not a Talki backup` };
  }

  if (!candidate.data || typeof candidate.data !== 'object') {
    return { ok: false, reason: 'payload has no data' };
  }

  return { ok: true };
}
