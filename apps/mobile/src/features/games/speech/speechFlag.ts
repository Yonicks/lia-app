/**
 * Phase 4 never executed the he-IL POC on a device (phase-04-report.md).
 * The speech game stays behind this flag, defaulting off. Temptation
 * remains usable via its manual open. E2E may flip
 * `window.__talkiSpeechGameEnabled` to exercise the board.
 */
export const SPEECH_GAME_ENABLED_DEFAULT = false;

export function isSpeechGameEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const flag = (window as unknown as { __talkiSpeechGameEnabled?: boolean }).__talkiSpeechGameEnabled;
    if (typeof flag === 'boolean') return flag;
  }
  return SPEECH_GAME_ENABLED_DEFAULT;
}
