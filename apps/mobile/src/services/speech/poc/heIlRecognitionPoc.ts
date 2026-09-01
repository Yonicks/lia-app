/**
 * ISOLATED PROOF OF CONCEPT — imported by no application code (verified in
 * phase-04-report.md by grep). Do not import this from `app/dev/audio-lab.tsx`
 * or anywhere else; the dev lab exercises the same underlying
 * `expo-speech-recognition` capability through its own inline call so this
 * file can stay genuinely unreferenced, exactly as
 * phase-04-plan.md requires ("Run in isolation... The POC must not be
 * imported by any application code").
 *
 * Purpose: establish whether `he-IL`, single-word, non-continuous speech
 * recognition is viable on the current Expo SDK (57), using
 * `expo-speech-recognition@57.0.0` — the one npm dist-tag that actually
 * matches this SDK version (its `sdk-56`/`sdk-55`/... tags exist precisely
 * because this ecosystem's version has historically lagged the Expo SDK,
 * which is the risk phase-04-plan.md calls out by name).
 *
 * HONEST STATUS (see docs/migration/phase-04-native-report.md for the full
 * writeup):
 *   - Package installs and resolves under this SDK: YES, confirmed — see
 *     "Speech recognition POC" in phase-04-report.md for the exact
 *     `expo-doctor`/`tsc`/`expo export --platform web` evidence.
 *   - Whether `recognizeHeIlWord()` below actually returns a result on a
 *     real Android or iOS device: UNVERIFIED. This sandbox has no Android
 *     SDK, no adb, no emulator, no iOS simulator and no physical device
 *     (the same limitation phase-01-report.md and phase-03-report.md
 *     recorded for their own native surfaces). Nothing in this file has
 *     ever actually executed.
 *   - Recommendation: ship the speech recognition game (`speech`, one of
 *     the 11 `GameId`s) behind a feature flag until this function is run
 *     for real on at least one Android and one iOS device. Do not treat
 *     "it compiles" as "it works" — that is exactly the gap this POC
 *     exists to close, and closing it needs hardware this environment does
 *     not have.
 */
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

export interface HeIlPocResult {
  outcome: 'recognized' | 'no-match' | 'permission-denied' | 'unavailable' | 'timeout' | 'error';
  transcript: string | null;
  detail?: string;
}

/**
 * Attempts one non-continuous `he-IL` single-word recognition, matching
 * legacy `startListening()`'s shape (index.html 3841-3876: `lang='he-IL'`,
 * `interimResults=false`, single result, no continuous mode) rather than
 * `listenForAnything()`'s open-ended 8s listen (index.html 3885-3917).
 * Talki needs exactly the narrower capability — see phase-04-plan.md,
 * "Speech recognition is proven in isolation": "Talki needs exactly one
 * narrow capability — short single-word he-IL, non-continuous — and that
 * is a much easier target than a general voice interface."
 */
export async function recognizeHeIlWord(timeoutMs = 8000): Promise<HeIlPocResult> {
  const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
  if (!available) {
    return { outcome: 'unavailable', transcript: null, detail: 'no recognizer available on this device' };
  }

  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    return { outcome: 'permission-denied', transcript: null, detail: permission.status };
  }

  return new Promise<HeIlPocResult>((resolve) => {
    let settled = false;
    const finish = (result: HeIlPocResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resultSub.remove();
      errorSub.remove();
      endSub.remove();
      resolve(result);
    };

    const timer = setTimeout(() => {
      ExpoSpeechRecognitionModule.abort();
      finish({ outcome: 'timeout', transcript: null, detail: `no result within ${timeoutMs}ms` });
    }, timeoutMs);

    const resultSub = ExpoSpeechRecognitionModule.addListener(
      'result',
      (event: ExpoSpeechRecognitionResultEvent) => {
        const transcript = event.results[0]?.transcript ?? null;
        if (transcript) {
          finish({ outcome: 'recognized', transcript });
        } else {
          finish({ outcome: 'no-match', transcript: null });
        }
      }
    );
    const errorSub = ExpoSpeechRecognitionModule.addListener('error', (event) => {
      finish({ outcome: 'error', transcript: null, detail: `${event.error}: ${event.message}` });
    });
    const endSub = ExpoSpeechRecognitionModule.addListener('end', () => {
      finish({ outcome: 'no-match', transcript: null, detail: 'ended with no result' });
    });

    ExpoSpeechRecognitionModule.start({
      lang: 'he-IL',
      interimResults: false,
      continuous: false,
      maxAlternatives: 1,
    });
  });
}
