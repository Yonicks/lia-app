import { key } from '../../domain/progress/keys';
import { K, storage } from '../storage';
import { RecordingCore } from './recordingCore';
import type { RecordingPorts } from './recordingPorts';
import type { RecordingService } from './RecordingService';

/**
 * The Expo web target's `RecordingService` — THE WEB TARGET IS A TEST
 * SURFACE (standing rule), never shipped. `expo-audio`'s own web
 * `AudioRecorder` implementation (`AudioModule.AudioRecorder` on native vs.
 * the differently-shaped, separately-exported `AudioRecorderWeb` on web —
 * see expoRecording.ts's header comment) turned out not to be a drop-in
 * replacement, so this file goes straight to the same browser APIs legacy
 * already used for exactly this (`navigator.mediaDevices.getUserMedia` +
 * `MediaRecorder`, index.html 3928-3953) rather than fighting an
 * unofficial-feeling web shim of a native-first API.
 *
 * One deliberate simplification versus the native path
 * (expoRecording.ts, which writes through the Phase 3 `recordingStore`
 * file-on-disk abstraction): this stores the captured audio as a `data:`
 * URL directly in `TalkiStorage` under `K.rec(key)`, the same shape legacy
 * itself used (index.html 3943-3947) and the same shape
 * `BackupService`/`recordingStore.saveRecordingFromDataUrl` already
 * round-trip on import — rather than also proving `expo-file-system`'s web
 * `Directory`/`File` implementation, which nothing in this migration has
 * exercised through a real browser yet. `isRecordingRef()`
 * (recordingStore.ts) only requires `{uri: string, mime: string}`, and a
 * `data:` URL satisfies that just as well as a `file://` one — `WordVoiceService`
 * and `<audio src>` both play a `data:` URL directly. Not evidence of
 * native file-based recording storage (validation.md §4).
 */
class WebRecordingPorts implements RecordingPorts {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;

  async isAvailable(): Promise<boolean> {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function' &&
      typeof window !== 'undefined' &&
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return 'granted';
    } catch {
      // Browsers vary in how precisely they report denial vs. "no device
      // at all" vs. a blocked-by-policy iframe; legacy treats every
      // getUserMedia failure the same way (index.html 3953, a single
      // catch -> toast), so this does too.
      return 'denied';
    }
  }

  async startCapture(): Promise<void> {
    if (!this.stream) {
      throw new Error('no-microphone-stream');
    }
    this.chunks = [];
    // Same candidate order as legacy (index.html 3931-3933): Chrome/Firefox
    // admit webm/opus, Safari admits mp4/aac.
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4'];
    const mime =
      typeof window.MediaRecorder.isTypeSupported === 'function'
        ? candidates.find((t) => window.MediaRecorder.isTypeSupported(t))
        : undefined;
    this.mediaRecorder = mime ? new MediaRecorder(this.stream, { mimeType: mime }) : new MediaRecorder(this.stream);
    this.mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    });
    this.startedAt = Date.now();
    this.mediaRecorder.start();
  }

  async stopCapture(): Promise<{ uri: string; mime: string; durationMs: number }> {
    const recorder = this.mediaRecorder;
    if (!recorder) {
      throw new Error('not-capturing');
    }
    const durationMs = Date.now() - this.startedAt;
    const mime = recorder.mimeType || 'audio/webm';
    const blob = await new Promise<Blob>((resolve) => {
      recorder.addEventListener('stop', () => resolve(new Blob(this.chunks, { type: mime })), { once: true });
      recorder.stop();
    });
    this.mediaRecorder = null;
    const dataUrl = await blobToDataUrl(blob);
    return { uri: dataUrl, mime, durationMs };
  }

  async cancelCapture(): Promise<void> {
    try {
      this.mediaRecorder?.stop();
    } catch {
      // already stopped/never started
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  async saveRecording(
    catId: string,
    word: string,
    sourceUri: string,
    mime: string
  ): Promise<{ uri: string }> {
    // `sourceUri` is already a `data:` URL here — see stopCapture() above.
    const k = key(catId, word);
    const ref = { uri: sourceUri, mime };
    await storage.set(K.rec(k), ref);
    return { uri: ref.uri };
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const recordingService: RecordingService = new RecordingCore(new WebRecordingPorts());
