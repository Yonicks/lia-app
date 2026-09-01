import type { CategoryId } from '../../domain/types';

/**
 * What a word actually sounds like, resolved in one place so no game
 * screen ever has to know the difference between a parent's own voice, a
 * bundled Talki voice, or robotic system TTS (phase-04-plan.md, "Word
 * voice resolution, in one place").
 */
export type VoiceSource =
  | { kind: 'parentRecording'; uri: string }
  | { kind: 'bundledVoice'; uri: string }
  | { kind: 'tts'; text: string }
  | { kind: 'unavailable'; reason: string };

/**
 * The one interface every screen, game and domain module is allowed to
 * touch to make a word audible. No direct `expo-speech` import from any
 * screen, game or domain module.
 */
export interface WordVoiceService {
  /**
   * Resolves `catId:word` and speaks it, in resolution order: a parent
   * recording for this exact word, then a bundled Talki voice recording (if
   * one exists — currently none do), then `he-IL` system TTS.
   *
   * `opts.core === true` bypasses the `settings.voice` gate for essential
   * speech (mirrors legacy `speakTTS`'s `!settings.voice && !opts.core`
   * check, index.html 1935). The gate applies only to the TTS step — a
   * parent recording or bundled voice always plays, exactly as legacy's
   * `say()` always plays a cached recording unconditionally (index.html
   * 1897-1906).
   *
   * Never throws: an `unavailable` resolution, a missing Hebrew voice, or a
   * storage read failure all resolve to silently doing nothing rather than
   * rejecting or falling back to English.
   */
  say(catId: CategoryId, word: string, opts?: { core?: boolean }): Promise<void>;
  /** Stops whatever is currently speaking/playing via `say()`, if anything. */
  cancel(): void;
  /** The resolution decision alone, with no side effect — used by
   *  app/dev/audio-lab.tsx to show which of the three steps a given word
   *  would use, and by word-voice.test.ts. */
  resolve(catId: CategoryId, word: string): Promise<VoiceSource>;
  /** Warms the parent-recording lookups for every word in `catId` ahead of
   *  time. Mirrors legacy `preloadRecs(catId)` (index.html 3921-3927). */
  preload(catId: CategoryId): Promise<void>;
}
