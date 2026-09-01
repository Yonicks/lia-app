import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import { audioEngine } from '../audio';
import type { TalkiSettings } from '../../domain/types';
import { DEFAULT_SETTINGS } from '../../domain/settings/defaults';
import { isRecordingRef, type RecordingRef } from '../recordings/recordingStore';
import { K, storage } from '../storage';
import { bundledVoiceModuleFor } from './bundledVoice';
import type { VoicePorts } from './voicePorts';
import { WordVoiceCore } from './wordVoiceCore';
import type { WordVoiceService } from './WordVoiceService';

/** `say()`/`speakTTS()`'s "safety net" timeout — some engines never fire an
 *  end event (no Hebrew voice, a muted tab, iOS quirks). Legacy's own
 *  cached-recording safety net is a fixed 6s (index.html 1904,
 *  `setTimeout(done, 6000)`) — more than any single Talki word takes to
 *  say twice over — reused here for both the recording and TTS paths. */
const SAFETY_NET_MS = 6000;

/**
 * The real `VoicePorts`, wired to `expo-audio`, `expo-speech`, and the
 * Phase 3 storage/recording services. This is the only file in
 * `services/voice/` that imports a native module.
 */
class RealVoicePorts implements VoicePorts {
  private currentPlayer: AudioPlayer | null = null;

  async getRecordingRef(recKey: string): Promise<{ uri: string } | null> {
    const rec = await storage.get<RecordingRef>(K.rec(recKey));
    return isRecordingRef(rec) ? { uri: rec.uri } : null;
  }

  getBundledVoiceUri(catIdColonWord: string): string | undefined {
    const mod = bundledVoiceModuleFor(catIdColonWord);
    return mod != null ? String(mod) : undefined;
  }

  async checkTtsAvailability(): Promise<{ available: boolean; reason?: string }> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (!voices || voices.length === 0) {
        return { available: false, reason: 'no-tts-voices-installed' };
      }
      const hasHebrew = voices.some((v) => /^he/i.test(v.language));
      if (!hasHebrew) {
        // A real user scenario, not a test-environment problem
        // (phase-04-plan.md risk: "No Hebrew TTS voice on the test
        // device"). Deliberately does NOT fall back to English.
        return { available: false, reason: 'no-hebrew-voice-installed' };
      }
      return { available: true };
    } catch {
      return { available: false, reason: 'tts-unavailable' };
    }
  }

  async readSettings(): Promise<TalkiSettings> {
    try {
      const stored = await storage.get<TalkiSettings>(K.settings);
      return stored ?? DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async playUri(uri: string): Promise<void> {
    const player = createAudioPlayer({ uri });
    this.currentPlayer = player;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        subscription.remove();
        try {
          player.release();
        } catch {
          // already released
        }
        if (this.currentPlayer === player) this.currentPlayer = null;
        resolve();
      };
      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) finish();
      });
      const timer = setTimeout(finish, SAFETY_NET_MS);
      player.play();
    });
  }

  async speakTts(text: string, rate: number): Promise<void> {
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, SAFETY_NET_MS);
      // he-IL, rate from settings, pitch 1.1 — ported verbatim from
      // speakTTS (index.html 1935-1957).
      Speech.speak(text, {
        language: 'he-IL',
        rate,
        pitch: 1.1,
        onDone: finish,
        onStopped: finish,
        onError: finish,
      });
    });
  }

  stopPlayback(): void {
    if (this.currentPlayer) {
      try {
        this.currentPlayer.pause();
        this.currentPlayer.release();
      } catch {
        // already released
      }
      this.currentPlayer = null;
    }
  }

  stopTts(): void {
    Speech.stop().catch(() => {});
  }

  setVoicePromptPlaying(on: boolean): void {
    audioEngine.setVoicePromptPlaying(on);
  }
}

export const wordVoiceService: WordVoiceService = new WordVoiceCore(new RealVoicePorts());
