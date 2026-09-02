import type { RecognitionResult, SpeechRecognitionService } from './SpeechRecognitionService';

type E2EWindow = {
  __talkiForceSpeechSupported?: boolean;
  __talkiRecognitionResult?: RecognitionResult;
};

function e2e(): E2EWindow {
  if (typeof window === 'undefined') return {};
  return window as unknown as E2EWindow;
}

/**
 * Phase 4 never executed the he-IL POC on a device. Until that is
 * attested, this service reports unsupported everywhere this sandbox
 * can reach. Temptation stays usable via its manual open. E2E may
 * stub support and an arbitrary result through window hooks.
 */
export const speechRecognitionService: SpeechRecognitionService = {
  async isSupported() {
    if (e2e().__talkiForceSpeechSupported === true) return true;
    return false;
  },
  async requestPermission() {
    return 'denied';
  },
  async recognizeOnce() {
    const stub = e2e().__talkiRecognitionResult;
    if (stub) return stub;
    return { recognized: false, transcript: null } satisfies RecognitionResult;
  },
  abort() {
    /* no-op while unsupported */
  },
};
