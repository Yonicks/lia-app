import type { TalkiSettings } from '../types';

/**
 * Ported verbatim from index.html 1647. Two runtime keys are absent from
 * that literal but must round-trip through TalkiSettings (see types.ts):
 *   - lastBackup   ISO string, index.html 1771
 *   - puzzleLevel  1..5,       index.html 2973-2978
 * Neither has a default value in legacy — both stay `undefined` until set.
 */
export const DEFAULT_SETTINGS: TalkiSettings = {
  rate: 0.85,
  niqqud: true,
  sounds: true,
  effects: true,
  music: true,
  musicVol: 0.5,
  voice: true,
};
