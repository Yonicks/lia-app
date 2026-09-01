/**
 * The native entry point (iOS/Android, and Metro's fallback for any
 * platform without a more specific file). `index.web.ts` is the web entry
 * point — same file-extension-selection mechanism Phase 3 used for
 * `services/storage` (phase-03-report.md "Deviations" §1) and Phase 4 uses
 * for `services/audio`: `expoRecording.ts`'s `AudioModule.AudioRecorder`
 * construction is native-only (see expoRecording.ts and webRecording.ts's
 * header comments for why the web shim isn't a drop-in replacement), so
 * the split keeps each platform's bundle structurally incapable of
 * reaching the other's implementation.
 */
export { recordingService } from './expoRecording';
export type { RecordingService } from './RecordingService';
export { RecordingCore } from './recordingCore';
export type { RecordingPorts } from './recordingPorts';
