import { Platform } from 'react-native';

import { wordVoiceService } from '../services/voice';

/**
 * Test-only bridge: when a Playwright `page.addInitScript()` has already
 * set `window.__talkiSpeechSpyEnabled = true` *before* this bundle loads
 * (see tests/e2e/_helpers.ts's `speechSpy()`), every call to the real
 * `WordVoiceService.say()` is recorded into `window.__talkiSpeechSpyLog`
 * before being forwarded unchanged to the real implementation. Mirrors
 * legacy `SPEECH_SPY` (tests/interaction_suite.py 915-926), which wraps
 * `speechSynthesis.speak` the same way for the same reason: "speaks
 * exactly once on entry" is only assertable if every call is recorded
 * somewhere Playwright can read it back.
 *
 * A no-op on native and whenever the spy hasn't been armed, so normal
 * operation (including every other Tier 2 spec) is completely unaffected.
 */
declare global {
  interface Window {
    __talkiSpeechSpyEnabled?: boolean;
    __talkiSpeechSpyLog?: { catId: string; word: string; core: boolean; at: number }[];
  }
}

export function installE2EVoiceSpyBridge(): void {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  if (!window.__talkiSpeechSpyEnabled) return;

  window.__talkiSpeechSpyLog = window.__talkiSpeechSpyLog ?? [];
  const log = window.__talkiSpeechSpyLog;
  const originalSay = wordVoiceService.say.bind(wordVoiceService);
  wordVoiceService.say = async (catId, word, opts) => {
    log.push({ catId, word, core: !!opts?.core, at: Date.now() });
    return originalSay(catId, word, opts);
  };
}
