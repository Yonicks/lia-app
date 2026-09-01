import type { TalkiSettings } from '../../domain/types';

/**
 * Everything `WordVoiceCore`'s decision logic needs from the outside
 * world, behind one small interface — the same seam `AudioEngineCore` uses
 * for `AudioPlayerAdapter` (see audio/playerAdapter.ts's header comment for
 * the rationale). This is what lets word-voice.test.ts exercise the real
 * three-step resolution order, the `opts.core` gate, and the
 * no-Hebrew-voice/unavailable handling under plain `vitest` — `expo-speech`,
 * `expo-audio` and `react-native` itself all fail to even parse under
 * vitest (they transitively contain Flow syntax; see
 * phase-03-report.md "Deviations" §6 for the identical finding about
 * `expo-file-system`/`expo-sqlite`), so a test that imported the real
 * `expoSpeechVoice.ts` could never run at all.
 */
export interface VoicePorts {
  /** Step 1: look up a parent recording's `{uri, mime}` reference by its
   *  storage key (`K.rec(key(catId, word))`). Returns `null` if none. */
  getRecordingRef(recKey: string): Promise<{ uri: string } | null>;
  /** Step 2: look up a bundled Talki voice recording's uri by
   *  `key(catId, word)`. `undefined` if none — always the case today
   *  (bundledVoice.ts). */
  getBundledVoiceUri(catIdColonWord: string): string | undefined;
  /** Step 3: whether `he-IL` system TTS can actually speak right now, and
   *  why not if it can't (no TTS engine at all vs. no Hebrew voice
   *  installed — two different real-world scenarios). */
  checkTtsAvailability(): Promise<{ available: boolean; reason?: string }>;
  /** Current settings, defaulting to `DEFAULT_SETTINGS` on any read
   *  failure — there is no app-state layer yet (phase-03-report.md,
   *  "Risks carried into the next phase"). */
  readSettings(): Promise<TalkiSettings>;
  /** Plays a recording/bundled-voice uri to completion (or a safety-net
   *  timeout). Resolves once, never rejects. */
  playUri(uri: string): Promise<void>;
  /** Speaks `text` via `he-IL` TTS at `rate` (pitch is always 1.1, ported
   *  verbatim from index.html 1940). Resolves once, never rejects. */
  speakTts(text: string, rate: number): Promise<void>;
  /** Interrupts whatever `playUri` started, if anything is in flight. */
  stopPlayback(): void;
  /** Interrupts whatever `speakTts` started, if anything is in flight. */
  stopTts(): void;
  /** Forwarded to `AudioEngine.setVoicePromptPlaying` so ducking reacts to
   *  spoken words exactly as it does in legacy (index.html 1898, 1936). */
  setVoicePromptPlaying(on: boolean): void;
}
