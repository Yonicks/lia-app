import { AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';

import { key } from '../../domain/progress/keys';
import { saveRecordingFromFile } from '../recordings/recordingStore';
import { K, storage } from '../storage';
import { RecordingCore } from './recordingCore';
import type { RecordingPorts } from './recordingPorts';
import type { RecordingService } from './RecordingService';

/**
 * The real, native `RecordingPorts`, wired to `expo-audio`'s
 * `AudioModule.AudioRecorder` and the Phase 3 recording store
 * (`saveRecordingFromFile`). This is the only file in
 * `services/recording/` that imports `expo-audio`'s native module surface
 * — `index.ts`/`index.web.ts` select this file only on native. See
 * webRecording.ts's header comment for why: `expo-audio`'s web bundle
 * has no `AudioModule.AudioRecorder` at all (it exports a differently
 * shaped `AudioRecorderWeb` instead, discovered when
 * `new AudioModule.AudioRecorder(...)` — evaluated eagerly at module load
 * as a class field — threw `is not a constructor` and crashed the entire
 * `expo export --platform web` bundle on first render, before this file
 * was split from the web path).
 *
 * Legacy tries several `MediaRecorder` mime candidates in order
 * (index.html 3931-3933: webm/opus, mp4/aac, ...) because the browser
 * picks what it admits to supporting. `expo-audio`'s `RecordingPresets`
 * plays the same role natively — `HIGH_QUALITY` resolves to a
 * platform-appropriate container (`.m4a`/AAC) without the app choosing a
 * codec by hand.
 */
class RealRecordingPorts implements RecordingPorts {
  /* `AudioModule` is a default export re-exported by name (see
   * expo-audio's index.d.ts: `export { AudioModule }` of a `import
   * AudioModule from './AudioModule'`), which eslint-plugin-import's
   * namespace resolver cannot see through even though `tsc --noEmit`
   * type-checks `AudioModule.AudioRecorder` cleanly against the real
   * declaration (`NativeAudioModule.AudioRecorder: typeof AudioRecorder`).
   * There is no other public, non-hook factory for an `AudioRecorder`
   * instance — `useAudioRecorder` exists only for components, and this is
   * a singleton service, not a component. */
  // eslint-disable-next-line import/namespace
  private recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);

  async isAvailable(): Promise<boolean> {
    // expo-audio recording is compiled into every native build; this file
    // is native-only (see the header comment), so there is no platform
    // branch to make here — webRecording.ts carries the equivalent check
    // for the web test surface.
    return true;
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
      const response = await AudioModule.requestRecordingPermissionsAsync();
      return response.status as 'granted' | 'denied' | 'undetermined';
    } catch {
      // Handled without a crash — see RecordingCore.start().
      return 'denied';
    }
  }

  async startCapture(): Promise<void> {
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    this.recorder.record();
  }

  async stopCapture(): Promise<{ uri: string; mime: string; durationMs: number }> {
    const durationMs = Math.round(this.recorder.currentTime * 1000);
    await this.recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    const uri = this.recorder.uri;
    if (!uri) {
      throw new Error('recording-produced-no-file');
    }
    // RecordingPresets.HIGH_QUALITY's shared extension is '.m4a' (AAC) on
    // both iOS and Android — see RecordingConstants.d.ts.
    return { uri, mime: 'audio/m4a', durationMs };
  }

  async cancelCapture(): Promise<void> {
    try {
      await this.recorder.stop();
    } catch {
      // already stopped/never started
    }
    await setAudioModeAsync({ allowsRecording: false });
  }

  async saveRecording(
    catId: string,
    word: string,
    sourceUri: string,
    mime: string
  ): Promise<{ uri: string }> {
    const k = key(catId, word);
    const ref = await saveRecordingFromFile(k, sourceUri, mime);
    await storage.set(K.rec(k), ref);
    return { uri: ref.uri };
  }
}

export const recordingService: RecordingService = new RecordingCore(new RealRecordingPorts());
