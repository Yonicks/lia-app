/**
 * The production seam for recognition. Phase 4 left this as an interface
 * only; Phase 11 registers `expoSpeechRecognition.ts`, which reports
 * unsupported until the he-IL POC is attested on a device. The isolated
 * POC at `poc/heIlRecognitionPoc.ts` is still imported by no application
 * code.
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
