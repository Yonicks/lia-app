/**
 * Ported verbatim from index.html 1633-1637. The `lia:` prefix is the
 * product's former name and is kept unchanged deliberately — see
 * phase-03-plan.md, "Preserve the legacy key names verbatim". Raw keys
 * appear inside every backup file's `data` object, so renaming this prefix
 * would require a translation layer on every import: a second place for the
 * mapping to be wrong, for zero user-visible benefit.
 *
 * Seven key patterns, exactly as legacy:
 *   K.progress    'lia:progress'        string[] of "catId:word"
 *   K.settings    'lia:settings'        settings object
 *   K.stats       'lia:stats'           { [key]: { seen, wrong } }
 *   K.customIndex 'lia:custom:index'    string[] of custom ids
 *   K.custom(id)  'lia:custom:' + id    { id, word, emoji, photo }
 *   K.rec(key)    'lia:rec:' + key      recording (data URL on legacy, a
 *                                       file reference natively — see
 *                                       services/recordings/recordingStore.ts)
 *   K.lastcat     'lia:lastcat'         category id string
 */
export const K = {
  progress: 'lia:progress',
  settings: 'lia:settings',
  stats: 'lia:stats',
  customIndex: 'lia:custom:index',
  custom: (id: string) => 'lia:custom:' + id,
  rec: (key: string) => 'lia:rec:' + key,
  lastcat: 'lia:lastcat',
} as const;

/** Every `lia:rec:*` key starts with this literal prefix. Used by the backup
 *  service to recognise a recording key without maintaining a second list of
 *  "which keys are recordings" that could drift from `K.rec`. */
export const REC_KEY_PREFIX = 'lia:rec:';

export function isRecordingKey(key: string): boolean {
  return key.startsWith(REC_KEY_PREFIX);
}
