import {
  computeDuckTarget,
  effectiveMusicVolume,
  effectiveSfxVolume,
  releaseDurationFor,
  resolveMusicFile,
  SFX_FILES,
  shouldPlaySfx,
  type DuckReason,
} from '../../domain/audio/audioPolicy';
import type { AudioDebugState, AudioEngine, MusicStateKey, SfxEvent } from './AudioEngine';
import type { AudioPlayerAdapter } from './playerAdapter';

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * The runtime shared by both the native (`expo-audio`) and web
 * (`HTMLAudioElement`) engines. This class makes every decision by calling
 * into `src/domain/audio/audioPolicy.ts` — `shouldPlaySfx`,
 * `computeDuckTarget`, `resolveMusicFile`, `effectiveMusicVolume`,
 * `effectiveSfxVolume`, `releaseDurationFor` — and does only I/O through
 * the injected `AudioPlayerAdapter`: crossfading, animating duck ramps with
 * a plain `setInterval` timer (no Reanimated — Phase 6 is the first
 * animation phase), and reacting to app lifecycle. It holds no duck value,
 * cooldown or volume constant of its own; every number in this file that
 * looks like a decision (0.72, 400ms, 500ms fades) is either a policy value
 * read from `audioPolicy` or a crossfade/pacing detail with no policy
 * meaning (matching audio-manager.js's own fade timings, which are a
 * runtime choice, not part of `assets/audio/audio-logic.js`).
 *
 * Ported runtime semantics from `audio-manager.js`: two-track crossfade,
 * SFX pool capped at `MAX_SIMULTANEOUS_SFX`, duck ramps with attack and
 * release, first-gesture unlock queues a pending music state, pause on
 * background / resume on foreground only if a track was actually playing.
 */
export class AudioEngineCore implements AudioEngine {
  private enabled = { music: true, sfx: true };
  private userMusicMultiplier = 1;
  private duckFlags: { voicePrompt: boolean; listening: boolean; speaking: boolean } = {
    voicePrompt: false,
    listening: false,
    speaking: false,
  };
  private duckMul = { music: 1, sfx: 1 };
  private lastDuckReason: DuckReason | null = null;
  private duckTimer: ReturnType<typeof setInterval> | null = null;
  private musicKey: MusicStateKey | 'rewardScreen' | null = null;
  private pendingMusicKey: MusicStateKey | 'rewardScreen' | null = null;
  private rewardScreen = false;
  private unlocked = false;
  private lastPlay: Partial<Record<string, number>> = {};
  private activeSfxCount = 0;
  private wasPlayingBeforeHide = false;

  constructor(
    private readonly adapter: AudioPlayerAdapter,
    private readonly now: () => number = () => Date.now()
  ) {}

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    this.unlocked = true;
    await this.adapter.unlock();
    if (this.pendingMusicKey) {
      const key = this.pendingMusicKey;
      this.pendingMusicKey = null;
      await this.setMusicState(key);
    }
  }

  async setMusicState(stateKey: MusicStateKey | 'rewardScreen' | null): Promise<void> {
    this.rewardScreen = stateKey === 'rewardScreen';
    const file = resolveMusicFile(stateKey ?? null);

    if (!this.enabled.music) {
      this.pendingMusicKey = stateKey;
      this.musicKey = null;
      return;
    }
    if (!file) {
      this.adapter.stopMusic(400);
      this.musicKey = null;
      this.pendingMusicKey = null;
      return;
    }
    if (this.musicKey === stateKey) {
      this.applyMusicVolumeNow();
      return; // already playing this state — no restart, mirrors audio-manager.js 132
    }
    if (!this.unlocked) {
      this.pendingMusicKey = stateKey; // first gesture hasn't happened yet
      return;
    }

    const fadeInMs = 600;
    const fadeOutMs = 500;
    this.adapter.crossfadeToMusic(file, this.effectiveMusicVolumeNow(), fadeInMs, fadeOutMs);
    this.musicKey = stateKey;
    this.pendingMusicKey = null;
  }

  playSfx(event: SfxEvent): void {
    // The policy decision happens first, and unconditionally: the adapter
    // is never touched unless shouldPlaySfx says yes. This is what
    // audio-engine.test.ts's "a blocked SFX never reaches the player"
    // assertion depends on.
    const ok = shouldPlaySfx(event, {
      sfxEnabled: this.enabled.sfx,
      speaking: this.duckFlags.speaking,
      lastPlay: this.lastPlay,
      now: this.now(),
      activeSfxCount: this.activeSfxCount,
    });
    if (!ok) return;

    const file = (SFX_FILES as Record<string, string>)[event];
    if (!file) return;

    const played = this.adapter.playSfxFile(file, this.effectiveSfxVolumeNow(), () => {
      this.activeSfxCount = Math.max(0, this.activeSfxCount - 1);
    });
    if (!played) return; // pool exhausted — silently drop, mirrors audio-manager.js 162

    this.lastPlay[event] = this.now();
    this.activeSfxCount++;
  }

  setListening(on: boolean): void {
    this.duckFlags.listening = on;
    this.updateDucking();
  }
  setChildSpeaking(on: boolean): void {
    this.duckFlags.speaking = on;
    this.updateDucking();
  }
  setVoicePromptPlaying(on: boolean): void {
    this.duckFlags.voicePrompt = on;
    this.updateDucking();
  }

  setMusicEnabled(on: boolean): void {
    this.enabled.music = on;
    if (!on) {
      this.adapter.stopMusic(300);
      this.musicKey = null;
    } else if (this.pendingMusicKey) {
      void this.setMusicState(this.pendingMusicKey);
    }
  }
  setSfxEnabled(on: boolean): void {
    this.enabled.sfx = on;
  }
  setMusicVolumeMultiplier(v: number): void {
    this.userMusicMultiplier = clamp01(v);
    this.applyMusicVolumeNow();
  }

  async stopMusic(fadeOutMs?: number): Promise<void> {
    this.adapter.stopMusic(fadeOutMs ?? 400);
    this.musicKey = null;
  }

  async stopAll(): Promise<void> {
    this.adapter.stopMusic(0);
    this.adapter.stopAllSfx();
    this.musicKey = null;
    this.pendingMusicKey = null;
    this.duckFlags = { voicePrompt: false, listening: false, speaking: false };
    this.duckMul = { music: 1, sfx: 1 };
    this.lastDuckReason = null;
    this.activeSfxCount = 0;
    if (this.duckTimer) {
      clearInterval(this.duckTimer);
      this.duckTimer = null;
    }
  }

  debugState(): AudioDebugState {
    return {
      enabled: { ...this.enabled },
      duckFlags: { ...this.duckFlags },
      duckMul: { ...this.duckMul },
      musicKey: this.musicKey,
      pendingMusicKey: this.pendingMusicKey,
      unlocked: this.unlocked,
      activeSfxCount: this.activeSfxCount,
    };
  }

  // ---- lifecycle hooks, called by the concrete engine's own platform
  // listener (AppState natively, visibilitychange/pagehide on web). Not
  // part of the public AudioEngine contract — no screen calls these. ----

  handleAppBackground(): void {
    this.wasPlayingBeforeHide = this.musicKey !== null && this.enabled.music;
    this.adapter.pauseMusicImmediate();
  }
  handleAppForeground(): void {
    if (this.wasPlayingBeforeHide && this.enabled.music && this.musicKey) {
      this.adapter.resumeMusicImmediate();
    }
  }
  handleAppTerminate(): void {
    void this.stopAll();
  }

  private updateDucking(): void {
    const target = computeDuckTarget(this.duckFlags);
    if (target.reason) {
      this.lastDuckReason = target.reason;
      this.animateDuckTo(target.music, target.sfx, target.durationMs ?? 200);
    } else {
      const release = releaseDurationFor(this.lastDuckReason);
      this.animateDuckTo(1, 1, release);
    }
  }

  private animateDuckTo(targetMusic: number, targetSfx: number, durMs: number): void {
    if (this.duckTimer) {
      clearInterval(this.duckTimer);
      this.duckTimer = null;
    }
    const startMusic = this.duckMul.music;
    const startSfx = this.duckMul.sfx;
    const t0 = this.now();
    const dur = Math.max(16, durMs);
    const tick = () => {
      const p = clamp01((this.now() - t0) / dur);
      this.duckMul.music = startMusic + (targetMusic - startMusic) * p;
      this.duckMul.sfx = startSfx + (targetSfx - startSfx) * p;
      this.applyMusicVolumeNow();
      if (p >= 1 && this.duckTimer) {
        clearInterval(this.duckTimer);
        this.duckTimer = null;
      }
    };
    tick();
    if (startMusic !== targetMusic || startSfx !== targetSfx) {
      this.duckTimer = setInterval(tick, 16);
    }
  }

  private applyMusicVolumeNow(): void {
    this.adapter.setMusicVolume(this.effectiveMusicVolumeNow());
  }

  private effectiveMusicVolumeNow(): number {
    return effectiveMusicVolume({
      userMultiplier: this.userMusicMultiplier,
      duckMultiplier: this.duckMul.music,
      rewardScreen: this.rewardScreen,
    });
  }
  private effectiveSfxVolumeNow(): number {
    return effectiveSfxVolume({ duckMultiplier: this.duckMul.sfx });
  }
}
