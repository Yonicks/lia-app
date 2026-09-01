/**
 * Interface ONLY this phase (phase-04-plan.md, "Speech recognition is
 * proven in isolation and integrated nowhere"). No implementation of this
 * interface is registered or wired into anything — the POC at
 * `poc/heIlRecognitionPoc.ts` is a separate, isolated exploration of
 * whether `he-IL` single-word recognition is viable at all, and is
 * imported by no application code (see that file's header for the honest
 * result, and phase-04-native-report.md for what could and could not be
 * verified in this environment).
 */
export interface RecognitionResult {
  recognized: boolean;
  transcript: string | null;
}

export interface SpeechRecognitionService {
  isSupported(): Promise<boolean>;
  requestPermission(): Promise<'granted' | 'denied' | 'undetermined'>;
  recognizeOnce(opts: { lang: 'he-IL'; timeoutMs: number }): Promise<RecognitionResult>;
  abort(): void;
}
