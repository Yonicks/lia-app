import type { CategoryId } from '../../domain/types';

/**
 * The one interface every screen is allowed to touch to capture a parent's
 * voice. No direct `expo-audio` recording import from any screen. Writes
 * through the Phase 3 recording store (`services/recordings/recordingStore.ts`)
 * so a captured word is immediately eligible for `WordVoiceService`'s step-1
 * resolution and for backup export/import, unchanged.
 */
export interface RecordingService {
  isAvailable(): Promise<boolean>;
  requestPermission(): Promise<'granted' | 'denied' | 'undetermined'>;
  /** Begins capturing `catId:word`. Resolves once capture has actually
   *  started. Rejects (without ever crashing the native layer) if
   *  recording is unavailable or permission was not granted — callers are
   *  expected to check `isAvailable()`/`requestPermission()` first, or
   *  simply catch this. A `start()` call while already recording is a
   *  no-op. */
  start(catId: CategoryId, word: string): Promise<void>;
  /** Stops the in-flight capture, saves it through the Phase 3 recording
   *  store, and returns where it landed. The capture is hard-capped at
   *  `maxDurationMs` regardless of whether `stop()` is ever called —
   *  mirrors legacy's own `setTimeout` safety stop (index.html 3957). */
  stop(): Promise<{ uri: string; durationMs: number }>;
  /** Discards the in-flight capture without saving anything. */
  cancel(): Promise<void>;
  /** 4000, matching legacy (index.html 3957). */
  readonly maxDurationMs: number;
}
