/**
 * Everything `RecordingCore`'s capture logic and 4000ms cap need from the
 * outside world, behind one small interface — the same seam
 * `AudioEngineCore`/`WordVoiceCore` use (see audio/playerAdapter.ts's
 * header comment for the rationale). `expo-audio`'s `AudioRecorder` and
 * `react-native`'s `PermissionStatus` both fail to parse under vitest
 * (Flow syntax — phase-03-report.md "Deviations" §6), so this is what
 * makes the capture-length cap and permission-denial handling testable
 * under plain `vitest` at all.
 */
export interface RecordingPorts {
  isAvailable(): Promise<boolean>;
  requestPermission(): Promise<'granted' | 'denied' | 'undetermined'>;
  /** Begins a raw capture. Throws only for a genuine device/OS failure —
   *  permission and availability are checked by `RecordingCore` first. */
  startCapture(): Promise<void>;
  /** Stops the raw capture and returns where the native layer put it
   *  (before it is moved into the Phase 3 recordings directory) and how
   *  long it ran. */
  stopCapture(): Promise<{ uri: string; mime: string; durationMs: number }>;
  /** Stops and discards the raw capture; the temp file (if any) is not
   *  expected to survive this call. */
  cancelCapture(): Promise<void>;
  /** Moves/saves the raw capture into the Phase 3 recording store under
   *  `K.rec(key(catId, word))`, returning its final `{uri}`. */
  saveRecording(
    catId: string,
    word: string,
    sourceUri: string,
    mime: string
  ): Promise<{ uri: string }>;
}
