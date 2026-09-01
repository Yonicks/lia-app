import type { CategoryId } from '../../domain/types';
import type { RecordingPorts } from './recordingPorts';
import type { RecordingService } from './RecordingService';

/**
 * The platform-independent half of `RecordingService`: the 4000ms hard cap
 * (enforced even if the caller never calls `stop()`, exactly like legacy's
 * own `setTimeout` safety stop at index.html 3957), permission-denial
 * handling that never crashes, and the single-active-capture guard. All
 * I/O goes through the injected `RecordingPorts`.
 */
export class RecordingCore implements RecordingService {
  readonly maxDurationMs = 4000;

  private active: { catId: CategoryId; word: string; startedAt: number } | null = null;
  private capTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly ports: RecordingPorts,
    private readonly now: () => number = () => Date.now()
  ) {}

  isAvailable(): Promise<boolean> {
    return this.ports.isAvailable();
  }

  requestPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
    return this.ports.requestPermission();
  }

  async start(catId: CategoryId, word: string): Promise<void> {
    if (this.active) {
      // Already recording — a second start() is a caller error, ignored
      // rather than corrupting the in-flight capture.
      return;
    }
    const available = await this.ports.isAvailable();
    if (!available) {
      throw new Error('recording-unavailable');
    }
    const permission = await this.ports.requestPermission();
    if (permission !== 'granted') {
      // Handled without a crash: a rejected Promise the caller can catch,
      // never an uncaught native exception. See
      // phase-04-native-report.md for what this environment could verify
      // about the real permission-denial dialog.
      throw new Error('microphone-permission-denied');
    }
    await this.ports.startCapture();
    this.active = { catId, word, startedAt: this.now() };
    this.capTimer = setTimeout(() => {
      void this.stop();
    }, this.maxDurationMs);
  }

  async stop(): Promise<{ uri: string; durationMs: number }> {
    if (!this.active) {
      throw new Error('not-recording');
    }
    if (this.capTimer) {
      clearTimeout(this.capTimer);
      this.capTimer = null;
    }
    const { catId, word } = this.active;
    this.active = null;
    const raw = await this.ports.stopCapture();
    const durationMs = Math.min(raw.durationMs, this.maxDurationMs);
    const saved = await this.ports.saveRecording(catId, word, raw.uri, raw.mime);
    return { uri: saved.uri, durationMs };
  }

  async cancel(): Promise<void> {
    if (this.capTimer) {
      clearTimeout(this.capTimer);
      this.capTimer = null;
    }
    if (!this.active) return;
    this.active = null;
    await this.ports.cancelCapture();
  }
}
