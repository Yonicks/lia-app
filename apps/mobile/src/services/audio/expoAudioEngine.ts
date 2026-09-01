import { AppState, type AppStateStatus } from 'react-native';

import { AudioModule, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

import type { AudioEngine } from './AudioEngine';
import { AudioEngineCore } from './audioEngineCore';
import { assetModuleFor } from './assetSource';
import type { AudioPlayerAdapter } from './playerAdapter';

/**
 * The native `AudioEngine`, backed by `expo-audio`. This is what actually
 * ships — see webAudioEngine.ts for the Playwright-only test surface.
 * Nothing about this file can be exercised in this sandbox (no Android
 * SDK/emulator, no iOS simulator, no device — see
 * phase-04-native-report.md): it is built and unit-tested against a fake
 * adapter (audio-engine.test.ts exercises `AudioEngineCore` directly,
 * platform-independent), but never actually run.
 *
 * Once per process, `setAudioModeAsync` configures the audio session so
 * playback continues in silent mode (a child's game being silenced by an
 * iOS mute switch would be a broken product) and ducks — rather than
 * fully interrupting — anything else already playing.
 */
void setAudioModeAsync({
  playsInSilentMode: true,
  interruptionMode: 'duckOthers',
  shouldPlayInBackground: false,
});

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function fadePlayerTo(player: AudioPlayer, targetVol: number, durMs: number, onDone?: () => void): void {
  const t0 = Date.now();
  const start = player.volume;
  const dur = Math.max(16, durMs);
  const step = () => {
    const p = clamp01((Date.now() - t0) / dur);
    try {
      player.volume = start + (targetVol - start) * p;
    } catch {
      return; // player was released mid-fade
    }
    if (p < 1) setTimeout(step, 16);
    else onDone?.();
  };
  step();
}

class ExpoPlayerAdapter implements AudioPlayerAdapter {
  private musicA: AudioPlayer = createAudioPlayer(null, { updateInterval: 250 });
  private musicB: AudioPlayer = createAudioPlayer(null, { updateInterval: 250 });
  private activeMusic = this.musicA;
  private idleMusic = this.musicB;
  private lastMusicVolume = 0;

  private readonly POOL_SIZE = 4;
  private sfxPool: AudioPlayer[] = [];

  constructor() {
    this.musicA.loop = true;
    this.musicB.loop = true;
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.sfxPool.push(createAudioPlayer(null, { updateInterval: 100 }));
    }
  }

  unlock(): void {
    // Native playback is never gated behind a user-gesture the way Web
    // Audio/autoplay policy gates it — expo-audio has no equivalent lock.
    // Kept as a no-op so the interface (and unlock-then-flush-pending-music
    // behaviour in AudioEngineCore) stays identical across platforms.
  }

  crossfadeToMusic(file: string, volume: number, fadeInMs: number, fadeOutMs: number): void {
    const target = this.idleMusic;
    const leaving = this.activeMusic;
    target.replace(assetModuleFor(file));
    target.volume = 0;
    target.play();
    fadePlayerTo(target, volume, fadeInMs);
    this.lastMusicVolume = volume;
    if (leaving !== target) {
      if (leaving.playing) {
        fadePlayerTo(leaving, 0, fadeOutMs, () => leaving.pause());
      } else {
        leaving.pause();
      }
    }
    this.activeMusic = target;
    this.idleMusic = leaving;
  }

  stopMusic(fadeOutMs: number): void {
    [this.musicA, this.musicB].forEach((player) => {
      if (player.playing) {
        fadePlayerTo(player, 0, fadeOutMs, () => player.pause());
      }
    });
  }

  setMusicVolume(volume: number): void {
    this.lastMusicVolume = volume;
    if (this.activeMusic.playing) this.activeMusic.volume = volume;
  }

  pauseMusicImmediate(): void {
    this.activeMusic.pause();
  }

  resumeMusicImmediate(): void {
    this.activeMusic.volume = this.lastMusicVolume;
    this.activeMusic.play();
  }

  playSfxFile(file: string, volume: number, onEnded: () => void): boolean {
    const player = this.sfxPool.find((candidate) => !candidate.playing);
    if (!player) return false; // pool exhausted
    player.replace(assetModuleFor(file));
    player.volume = volume;
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        subscription.remove();
        onEnded();
      }
    });
    player.play();
    return true;
  }

  stopAllSfx(): void {
    this.sfxPool.forEach((player) => {
      if (player.playing) player.pause();
    });
  }
}

function createExpoAudioEngine(): AudioEngine {
  const adapter = new ExpoPlayerAdapter();
  const core = new AudioEngineCore(adapter);

  let appState: AppStateStatus = AppState.currentState;
  AppState.addEventListener('change', (next) => {
    const wasActive = appState === 'active';
    const isActive = next === 'active';
    if (wasActive && !isActive) core.handleAppBackground();
    else if (!wasActive && isActive) core.handleAppForeground();
    appState = next;
  });

  return core;
}

export const expoAudioEngine: AudioEngine = createExpoAudioEngine();

/** Exposed only so a diagnostic screen can show whether the native
 *  recording permission has already been granted; not part of the
 *  AudioEngine contract. */
export { AudioModule };
