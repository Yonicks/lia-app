/**
 * Proves `WordVoiceCore`'s three-step resolution order, the `opts.core`
 * gate, and never-throw error handling, against a `FakePorts` — see
 * voicePorts.ts's header comment for why this seam exists (`expo-speech`,
 * `expo-audio` and `react-native` all fail to parse under vitest; this is
 * what makes the real decision logic testable at all).
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '@/domain/settings/defaults';
import type { TalkiSettings } from '@/domain/types';
import { WordVoiceCore } from '@/services/voice/wordVoiceCore';
import type { VoicePorts } from '@/services/voice/voicePorts';

class FakePorts implements VoicePorts {
  recordings = new Map<string, { uri: string }>();
  bundled = new Map<string, string>();
  ttsAvailable: { available: boolean; reason?: string } = { available: true };
  settings: TalkiSettings = { ...DEFAULT_SETTINGS };
  playUriCalls: string[] = [];
  speakTtsCalls: { text: string; rate: number }[] = [];
  voicePromptFlags: boolean[] = [];
  stopPlaybackCalls = 0;
  stopTtsCalls = 0;

  async getRecordingRef(recKey: string) {
    return this.recordings.get(recKey) ?? null;
  }
  getBundledVoiceUri(catIdColonWord: string) {
    return this.bundled.get(catIdColonWord);
  }
  async checkTtsAvailability() {
    return this.ttsAvailable;
  }
  async readSettings() {
    return this.settings;
  }
  async playUri(uri: string) {
    this.playUriCalls.push(uri);
  }
  async speakTts(text: string, rate: number) {
    this.speakTtsCalls.push({ text, rate });
  }
  stopPlayback() {
    this.stopPlaybackCalls++;
  }
  stopTts() {
    this.stopTtsCalls++;
  }
  setVoicePromptPlaying(on: boolean) {
    this.voicePromptFlags.push(on);
  }
}

describe('WordVoiceCore resolution order', () => {
  let ports: FakePorts;
  let service: WordVoiceCore;

  beforeEach(() => {
    ports = new FakePorts();
    service = new WordVoiceCore(ports);
  });

  it('step 1: a parent recording for this exact catId:word wins over everything else', async () => {
    ports.recordings.set('animals:כֶּלֶב', { uri: 'file:///rec.m4a' });
    ports.bundled.set('animals:כֶּלֶב', 'bundled-uri');
    const source = await service.resolve('animals', 'כֶּלֶב');
    expect(source).toEqual({ kind: 'parentRecording', uri: 'file:///rec.m4a' });
  });

  it('step 2: with no parent recording, a bundled voice wins over TTS', async () => {
    ports.bundled.set('animals:כֶּלֶב', 'bundled-uri');
    const source = await service.resolve('animals', 'כֶּלֶב');
    expect(source).toEqual({ kind: 'bundledVoice', uri: 'bundled-uri' });
  });

  it('with no recording and no bundled voice, resolves to tts', async () => {
    const source = await service.resolve('animals', 'כֶּלֶב');
    expect(source).toEqual({ kind: 'tts', text: 'כֶּלֶב' });
  });

  it('with TTS unavailable, resolves to unavailable with a reason and does not throw', async () => {
    ports.ttsAvailable = { available: false, reason: 'no-tts-voices-installed' };
    await expect(service.resolve('animals', 'כֶּלֶב')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'no-tts-voices-installed',
    });
  });

  it('no Hebrew voice installed resolves to unavailable, never falling back to English', async () => {
    ports.ttsAvailable = { available: false, reason: 'no-hebrew-voice-installed' };
    const source = await service.resolve('animals', 'כֶּלֶב');
    expect(source.kind).toBe('unavailable');
    if (source.kind === 'unavailable') {
      expect(source.reason).toBe('no-hebrew-voice-installed');
    }
    await service.say('animals', 'כֶּלֶב');
    expect(ports.speakTtsCalls).toHaveLength(0); // never attempted, and never in English
  });

  it('a storage failure on step 1 falls through to step 3 rather than throwing', async () => {
    ports.getRecordingRef = async () => {
      throw new Error('storage exploded');
    };
    await expect(service.resolve('animals', 'כֶּלֶב')).resolves.toEqual({
      kind: 'tts',
      text: 'כֶּלֶב',
    });
  });

  describe('say()', () => {
    it('core: true speaks even when settings.voice is false', async () => {
      ports.settings = { ...DEFAULT_SETTINGS, voice: false };
      await service.say('animals', 'כֶּלֶב', { core: true });
      expect(ports.speakTtsCalls).toEqual([{ text: 'כֶּלֶב', rate: DEFAULT_SETTINGS.rate }]);
    });

    it('core absent and settings.voice false does not speak', async () => {
      ports.settings = { ...DEFAULT_SETTINGS, voice: false };
      await service.say('animals', 'כֶּלֶב');
      expect(ports.speakTtsCalls).toHaveLength(0);
    });

    it('settings.voice true speaks without opts.core', async () => {
      ports.settings = { ...DEFAULT_SETTINGS, voice: true };
      await service.say('animals', 'כֶּלֶב');
      expect(ports.speakTtsCalls).toEqual([{ text: 'כֶּלֶב', rate: DEFAULT_SETTINGS.rate }]);
    });

    it('a parent recording always plays regardless of settings.voice', async () => {
      ports.recordings.set('animals:כֶּלֶב', { uri: 'file:///rec.m4a' });
      ports.settings = { ...DEFAULT_SETTINGS, voice: false };
      await service.say('animals', 'כֶּלֶב'); // no opts.core at all
      expect(ports.playUriCalls).toEqual(['file:///rec.m4a']);
      expect(ports.speakTtsCalls).toHaveLength(0);
    });

    it('wraps playback/TTS with setVoicePromptPlaying(true) then (false), for ducking', async () => {
      await service.say('animals', 'כֶּלֶב', { core: true });
      expect(ports.voicePromptFlags).toEqual([true, false]);
    });

    it('never throws, even when the underlying tts call rejects', async () => {
      ports.speakTts = async () => {
        throw new Error('tts blew up');
      };
      await expect(service.say('animals', 'כֶּלֶב', { core: true })).resolves.toBeUndefined();
      // still leaves voicePromptPlaying(false) so ducking doesn't get stuck on
      expect(ports.voicePromptFlags.at(-1)).toBe(false);
    });
  });

  describe('cancel()', () => {
    it('stops both playback and tts ports unconditionally', () => {
      service.cancel();
      expect(ports.stopPlaybackCalls).toBe(1);
      expect(ports.stopTtsCalls).toBe(1);
    });

    it('is called at the start of every say(), interrupting whatever was in flight', async () => {
      await service.say('animals', 'כֶּלֶב', { core: true });
      // one cancel() inside say() itself, from the empty initial state
      expect(ports.stopPlaybackCalls).toBeGreaterThanOrEqual(1);
      expect(ports.stopTtsCalls).toBeGreaterThanOrEqual(1);
    });
  });

  describe('preload()', () => {
    it('warms the recording lookup for every word in the category', async () => {
      const seen: string[] = [];
      ports.getRecordingRef = async (k: string) => {
        seen.push(k);
        return null;
      };
      await service.preload('animals');
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.every((k) => k.startsWith('animals:'))).toBe(true);
    });

    it('an unknown/custom category (mine) is a safe no-op', async () => {
      await expect(service.preload('mine')).resolves.toBeUndefined();
    });
  });
});
