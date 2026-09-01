/**
 * Proves `RecordingCore`'s capture logic against a `FakePorts`: the
 * 4000ms hard cap fires even if the caller never calls stop(), and
 * permission denial is handled as a normal, catchable rejection rather
 * than corrupting state or crashing. Not named in phase-04-plan.md's Tier 1
 * list by file name, but the work item is explicit that "capture logic and
 * 4000ms cap can be built and unit-tested" — this is that test, to the
 * same rigor as audio-engine.test.ts and word-voice.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RecordingCore } from '@/services/recording/recordingCore';
import type { RecordingPorts } from '@/services/recording/recordingPorts';

class FakePorts implements RecordingPorts {
  available = true;
  permission: 'granted' | 'denied' | 'undetermined' = 'granted';
  startCaptureCalls = 0;
  stopCaptureCalls = 0;
  cancelCaptureCalls = 0;
  saveCalls: { catId: string; word: string; sourceUri: string; mime: string }[] = [];
  capturedDurationMs = 1234;

  async isAvailable() {
    return this.available;
  }
  async requestPermission() {
    return this.permission;
  }
  async startCapture() {
    this.startCaptureCalls++;
  }
  async stopCapture() {
    this.stopCaptureCalls++;
    return { uri: 'file:///tmp/raw.m4a', mime: 'audio/m4a', durationMs: this.capturedDurationMs };
  }
  async cancelCapture() {
    this.cancelCaptureCalls++;
  }
  async saveRecording(catId: string, word: string, sourceUri: string, mime: string) {
    this.saveCalls.push({ catId, word, sourceUri, mime });
    return { uri: `file:///saved/${catId}-${word}.m4a` };
  }
}

describe('RecordingCore', () => {
  let ports: FakePorts;
  let service: RecordingCore;

  beforeEach(() => {
    ports = new FakePorts();
    service = new RecordingCore(ports, () => 0);
  });

  it('exposes maxDurationMs = 4000, matching legacy', () => {
    expect(service.maxDurationMs).toBe(4000);
  });

  it('a normal start()/stop() cycle saves through the ports and returns the saved uri', async () => {
    await service.start('animals', 'כֶּלֶב');
    expect(ports.startCaptureCalls).toBe(1);
    const result = await service.stop();
    expect(ports.saveCalls).toEqual([
      { catId: 'animals', word: 'כֶּלֶב', sourceUri: 'file:///tmp/raw.m4a', mime: 'audio/m4a' },
    ]);
    expect(result.uri).toBe('file:///saved/animals-כֶּלֶב.m4a');
  });

  it('the reported duration is capped at maxDurationMs even if the raw capture ran longer', async () => {
    ports.capturedDurationMs = 4500;
    await service.start('animals', 'כֶּלֶב');
    const result = await service.stop();
    expect(result.durationMs).toBe(4000);
  });

  it('a shorter real capture reports its real duration, not the cap', async () => {
    ports.capturedDurationMs = 1500;
    await service.start('animals', 'כֶּלֶב');
    const result = await service.stop();
    expect(result.durationMs).toBe(1500);
  });

  describe('the 4000ms cap fires on its own', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('auto-stops (and saves) at 4000ms even if stop() is never called', async () => {
      await service.start('animals', 'כֶּלֶב');
      expect(ports.stopCaptureCalls).toBe(0);
      await vi.advanceTimersByTimeAsync(4000);
      expect(ports.stopCaptureCalls).toBe(1);
      expect(ports.saveCalls).toHaveLength(1);
    });

    it('an explicit stop() before 4000ms cancels the pending auto-stop (no double-save)', async () => {
      await service.start('animals', 'כֶּלֶב');
      await vi.advanceTimersByTimeAsync(1000);
      await service.stop();
      await vi.advanceTimersByTimeAsync(5000);
      expect(ports.stopCaptureCalls).toBe(1);
      expect(ports.saveCalls).toHaveLength(1);
    });
  });

  it('permission denial is handled without a crash: a catchable rejection, not a thrown native exception', async () => {
    ports.permission = 'denied';
    await expect(service.start('animals', 'כֶּלֶב')).rejects.toThrow('microphone-permission-denied');
    expect(ports.startCaptureCalls).toBe(0);
    // the service stays usable afterward
    ports.permission = 'granted';
    await expect(service.start('animals', 'כֶּלֶב')).resolves.toBeUndefined();
  });

  it('unavailable recording is handled without a crash', async () => {
    ports.available = false;
    await expect(service.start('animals', 'כֶּלֶב')).rejects.toThrow('recording-unavailable');
    expect(ports.startCaptureCalls).toBe(0);
  });

  it('a second start() while already recording is ignored rather than corrupting the capture', async () => {
    await service.start('animals', 'כֶּלֶב');
    await service.start('food', 'תַּפּוּחַ');
    expect(ports.startCaptureCalls).toBe(1);
    const result = await service.stop();
    expect(ports.saveCalls[0].catId).toBe('animals'); // the first capture wins
    expect(result).toBeDefined();
  });

  it('stop() without an active capture rejects cleanly rather than crashing', async () => {
    await expect(service.stop()).rejects.toThrow('not-recording');
  });

  it('cancel() discards the capture without saving anything', async () => {
    await service.start('animals', 'כֶּלֶב');
    await service.cancel();
    expect(ports.cancelCaptureCalls).toBe(1);
    expect(ports.saveCalls).toHaveLength(0);
  });

  it('cancel() with nothing active is a safe no-op', async () => {
    await expect(service.cancel()).resolves.toBeUndefined();
    expect(ports.cancelCaptureCalls).toBe(0);
  });
});
