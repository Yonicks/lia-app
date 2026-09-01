import { Asset } from 'expo-asset';

import type { AudioEngine } from './AudioEngine';
import { AudioEngineCore } from './audioEngineCore';
import { assetModuleFor } from './assetSource';
import type { AudioPlayerAdapter } from './playerAdapter';

/**
 * The Expo web target's `AudioEngine`. THE WEB TARGET IS A TEST SURFACE —
 * it is never shipped (standing rule). This exists so Tier 2 Playwright
 * specs (audio-lab.spec.ts) can exercise real crossfade/pooling/ducking
 * mechanics end to end in a real browser, and so `degradeNativeApis` has a
 * real "unavailable" state to force. It is a direct structural port of
 * `audio-manager.js`'s DOM-based runtime (two `Audio()` elements for
 * crossfade, a small reusable pool for SFX) — NOT of `expo-audio`, which is
 * what actually ships. Nothing here is evidence of native audio behaviour
 * (validation.md §4).
 */
function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function uriFor(policyFile: string): string {
  return Asset.fromModule(assetModuleFor(policyFile)).uri;
}

function fadeElementTo(el: HTMLAudioElement, targetVol: number, durMs: number, onDone?: () => void): void {
  const t0 = performance.now();
  const start = el.volume;
  const dur = Math.max(16, durMs);
  const step = () => {
    const p = clamp01((performance.now() - t0) / dur);
    el.volume = start + (targetVol - start) * p;
    if (p < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  step();
}

class WebPlayerAdapter implements AudioPlayerAdapter {
  private musicA = new window.Audio();
  private musicB = new window.Audio();
  private activeMusicEl = this.musicA;
  private idleMusicEl = this.musicB;
  private sfxPool: HTMLAudioElement[] = [];
  private readonly POOL_SIZE = 4;
  private lastMusicVolume = 0;

  constructor() {
    this.musicA.loop = true;
    this.musicA.preload = 'auto';
    this.musicB.loop = true;
    this.musicB.preload = 'auto';
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const el = new window.Audio();
      el.preload = 'auto';
      this.sfxPool.push(el);
    }
  }

  unlock(): void {
    [this.musicA, this.musicB, ...this.sfxPool].forEach((el) => {
      try {
        const p = el.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        el.pause();
      } catch {
        // autoplay still blocked — later explicit play() calls will retry
      }
    });
  }

  crossfadeToMusic(file: string, volume: number, fadeInMs: number, fadeOutMs: number): void {
    const target = this.idleMusicEl;
    const leaving = this.activeMusicEl;
    const src = uriFor(file);
    if (target.src !== src) {
      target.src = src;
      try {
        target.currentTime = 0;
      } catch {
        // some browsers reject currentTime reset before metadata loads
      }
    }
    target.volume = 0;
    const p = target.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    fadeElementTo(target, volume, fadeInMs);
    this.lastMusicVolume = volume;
    if (leaving !== target) {
      if (!leaving.paused) {
        fadeElementTo(leaving, 0, fadeOutMs, () => leaving.pause());
      } else {
        leaving.pause();
      }
    }
    this.activeMusicEl = target;
    this.idleMusicEl = leaving;
  }

  stopMusic(fadeOutMs: number): void {
    [this.musicA, this.musicB].forEach((el) => {
      if (!el.paused) {
        fadeElementTo(el, 0, fadeOutMs, () => el.pause());
      }
    });
  }

  setMusicVolume(volume: number): void {
    this.lastMusicVolume = volume;
    if (!this.activeMusicEl.paused) this.activeMusicEl.volume = volume;
  }

  pauseMusicImmediate(): void {
    this.activeMusicEl.pause();
  }

  resumeMusicImmediate(): void {
    this.activeMusicEl.volume = this.lastMusicVolume;
    const p = this.activeMusicEl.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  playSfxFile(file: string, volume: number, onEnded: () => void): boolean {
    const src = uriFor(file);
    const el = this.sfxPool.find((candidate) => candidate.paused);
    if (!el) return false; // pool exhausted
    if (el.src !== src) el.src = src;
    try {
      el.currentTime = 0;
    } catch {
      // ignore — some browsers reject before metadata is loaded
    }
    el.volume = volume;
    const cleanup = () => {
      el.removeEventListener('ended', cleanup);
      onEnded();
    };
    el.addEventListener('ended', cleanup, { once: true });
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(cleanup);
    return true;
  }

  stopAllSfx(): void {
    this.sfxPool.forEach((el) => {
      try {
        el.pause();
      } catch {
        // ignore
      }
    });
  }
}

function createWebAudioEngine(): AudioEngine {
  const adapter = new WebPlayerAdapter();
  const core = new AudioEngineCore(adapter);

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') core.handleAppBackground();
      else core.handleAppForeground();
    });
    window.addEventListener('pagehide', () => core.handleAppTerminate());
  }

  return core;
}

export const webAudioEngine: AudioEngine = createWebAudioEngine();
