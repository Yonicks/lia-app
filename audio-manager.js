/**
 * Talki AudioManager — centralized music + SFX layer.
 * Components emit semantic events; this file is the only place that knows filenames.
 * Named AudioManager (not "Audio") so it never shadows window.Audio, which the app
 * already uses elsewhere to play parent-recorded custom words.
 *
 * Depends on TalkiAudioLogic (assets/audio/audio-logic.js) for the pure config/decisions,
 * loaded via <script> before this file.
 */
(function () {
  'use strict';

  var L = window.TalkiAudioLogic;
  var BASE = 'assets/audio/';

  var state = {
    enabled: { music: true, sfx: true, voice: true },
    userMusicMultiplier: 1,
    duckFlags: { voicePrompt: false, listening: false, speaking: false },
    duckMul: { music: 1, sfx: 1 },
    lastDuckReason: null,
    duckRaf: 0,
    musicKey: null,          // resolved state key currently playing (or queued)
    pendingMusicKey: null,   // wanted, but blocked until unlock()
    rewardScreen: false,
    unlocked: false,
    wasPlayingBeforeHide: false,
    lastPlay: {},
    activeSfxCount: 0,
    playingSrcs: Object.create(null)
  };

  // ---- music: two elements so we can crossfade ----
  var musicA = new window.Audio(); musicA.loop = true; musicA.preload = 'auto';
  var musicB = new window.Audio(); musicB.loop = true; musicB.preload = 'auto';
  var activeMusicEl = musicA, idleMusicEl = musicB;
  var fadeRaf = 0;

  // ---- sfx: small reusable pool so overlapping sounds don't cut each other off ----
  var POOL_SIZE = 4;
  var sfxPool = [];
  for (var i = 0; i < POOL_SIZE; i++) { var a = new window.Audio(); a.preload = 'auto'; sfxPool.push(a); }

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function currentDuckMultiplier(kind) { return kind === 'music' ? state.duckMul.music : state.duckMul.sfx; }

  function effectiveMusicVolume() {
    return L.effectiveMusicVolume({
      userMultiplier: state.userMusicMultiplier,
      duckMultiplier: state.duckMul.music,
      rewardScreen: state.rewardScreen
    });
  }
  function effectiveSfxVolume() {
    return L.effectiveSfxVolume({ duckMultiplier: state.duckMul.sfx });
  }

  // ---- ducking animation (attack when getting quieter, release when returning to normal) ----
  function animateDuckTo(targetMusic, targetSfx, durMs) {
    cancelAnimationFrame(state.duckRaf);
    var startMusic = state.duckMul.music, startSfx = state.duckMul.sfx;
    var t0 = now(), dur = Math.max(16, durMs || 200);
    function step() {
      var p = clamp01((now() - t0) / dur);
      state.duckMul.music = startMusic + (targetMusic - startMusic) * p;
      state.duckMul.sfx = startSfx + (targetSfx - startSfx) * p;
      applyMusicVolumeNow();
      if (p < 1) state.duckRaf = requestAnimationFrame(step);
    }
    step();
  }

  function updateDucking() {
    var target = L.computeDuckTarget(state.duckFlags);
    if (target.reason) {
      state.lastDuckReason = target.reason;
      animateDuckTo(target.music, target.sfx, target.durationMs);
    } else {
      var release = L.releaseDurationFor(state.lastDuckReason);
      animateDuckTo(1, 1, release);
    }
  }

  function applyMusicVolumeNow() {
    if (!activeMusicEl.paused) activeMusicEl.volume = effectiveMusicVolume();
  }

  // ---- music playback ----
  function fadeElementTo(el, targetVol, durMs, onDone) {
    var t0 = now(), start = el.volume, dur = Math.max(16, durMs || 400);
    (function step() {
      var p = clamp01((now() - t0) / dur);
      el.volume = start + (targetVol - start) * p;
      if (p < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    })();
  }

  function crossfadeTo(fileRelPath, fadeInMs, fadeOutMs) {
    var target = idleMusicEl, leaving = activeMusicEl;
    var src = BASE + fileRelPath;
    if (target.getAttribute('src') !== src) { target.src = src; try { target.currentTime = 0; } catch (e) { } }
    target.volume = 0;
    var p = target.play();
    if (p && p.catch) p.catch(function () { /* still locked; will retry after unlock() */ });
    fadeElementTo(target, effectiveMusicVolume(), fadeInMs);
    if (leaving !== target) {
      if (!leaving.paused) fadeElementTo(leaving, 0, fadeOutMs, function () { leaving.pause(); });
      else leaving.pause();
    }
    activeMusicEl = target; idleMusicEl = leaving;
  }

  function stopMusic(fadeOutMs) {
    [musicA, musicB].forEach(function (el) {
      if (!el.paused) fadeElementTo(el, 0, fadeOutMs != null ? fadeOutMs : 400, function () { el.pause(); });
    });
    state.musicKey = null;
  }

  /**
   * @param {string} stateKey one of 'home' | 'gameplay_bouncy' | 'gameplay_curious' |
   *   'gameplay_gentle' | 'speechOrListeningTask' | 'rewardScreen' | null
   * @param {{fadeInMs?:number, fadeOutMs?:number}} [opts]
   */
  function setMusicState(stateKey, opts) {
    opts = opts || {};
    state.rewardScreen = stateKey === 'rewardScreen';
    var file = L.resolveMusicFile(stateKey);

    if (!state.enabled.music) { state.pendingMusicKey = stateKey; state.musicKey = null; return; }
    if (!file) { stopMusic(); state.musicKey = null; state.pendingMusicKey = null; return; }

    if (state.musicKey === stateKey) { applyMusicVolumeNow(); return; } // already playing this state — no restart

    if (!state.unlocked) { state.pendingMusicKey = stateKey; return; } // first user gesture hasn't happened yet

    var fadeInMs = opts.fadeInMs != null ? opts.fadeInMs : 600;
    var fadeOutMs = opts.fadeOutMs != null ? opts.fadeOutMs : 500;
    crossfadeTo(file, fadeInMs, fadeOutMs);
    state.musicKey = stateKey;
    state.pendingMusicKey = null;
  }

  // ---- sfx playback ----
  function playSfx(event) {
    var ok = L.shouldPlaySfx(event, {
      sfxEnabled: state.enabled.sfx,
      speaking: state.duckFlags.speaking,
      lastPlay: state.lastPlay,
      now: now(),
      activeSfxCount: state.activeSfxCount
    });
    if (!ok) return;

    var file = L.SFX_FILES[event];
    var src = BASE + file;
    if (state.playingSrcs[src]) return; // don't restart a sound that's already playing

    var el = null;
    for (var i = 0; i < sfxPool.length; i++) { if (sfxPool[i].paused) { el = sfxPool[i]; break; } }
    if (!el) return; // pool exhausted — silently drop rather than cut off another sound

    state.lastPlay[event] = now();
    if (el.getAttribute('src') !== src) el.src = src;
    try { el.currentTime = 0; } catch (e) { }
    el.volume = effectiveSfxVolume();
    state.playingSrcs[src] = true;
    state.activeSfxCount++;
    var cleanup = function () {
      delete state.playingSrcs[src];
      state.activeSfxCount = Math.max(0, state.activeSfxCount - 1);
      el.removeEventListener('ended', cleanup);
    };
    el.addEventListener('ended', cleanup, { once: true });
    var p = el.play();
    if (p && p.catch) p.catch(cleanup);
  }

  // ---- speech-turn state ----
  function setVoicePromptPlaying(on) { state.duckFlags.voicePrompt = !!on; updateDucking(); }
  function setListening(on) { state.duckFlags.listening = !!on; updateDucking(); }
  function setChildSpeaking(on) { state.duckFlags.speaking = !!on; updateDucking(); }

  // ---- settings ----
  function setMusicEnabled(on) {
    state.enabled.music = !!on;
    if (!on) stopMusic(300);
    else if (state.pendingMusicKey) setMusicState(state.pendingMusicKey);
  }
  function setSfxEnabled(on) { state.enabled.sfx = !!on; }
  function setVoiceEnabled(on) { state.enabled.voice = !!on; }
  function setMusicVolumeMultiplier(v) { state.userMusicMultiplier = clamp01(v); applyMusicVolumeNow(); }

  // ---- unlock (must be called from within a real user gesture, e.g. the start-gate tap) ----
  function unlock() {
    if (state.unlocked) return;
    state.unlocked = true;
    [musicA, musicB].concat(sfxPool).forEach(function (el) {
      try {
        var p = el.play();
        if (p && p.catch) p.catch(function () { });
        el.pause();
      } catch (e) { }
    });
    if (state.pendingMusicKey) setMusicState(state.pendingMusicKey);
  }

  // ---- preload short, frequently-used SFX so the first trigger isn't laggy ----
  function preload() {
    ['ui.primaryTap', 'ui.secondaryTap', 'answer.correct', 'answer.retry',
      'interaction.dragPickup', 'interaction.dragDrop', 'interaction.correctMatch',
      'speech.listeningReady', 'speech.recognized'
    ].forEach(function (ev) {
      var file = L.SFX_FILES[ev];
      if (!file) return;
      var el = new window.Audio(); el.preload = 'auto'; el.src = BASE + file;
    });
  }

  // ---- lifecycle ----
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      state.wasPlayingBeforeHide = !activeMusicEl.paused;
      activeMusicEl.pause();
    } else if (state.wasPlayingBeforeHide && state.enabled.music && state.musicKey) {
      var p = activeMusicEl.play();
      if (p && p.catch) p.catch(function () { });
    }
  });
  window.addEventListener('pagehide', function () { stopAll(); });

  function stopAll() {
    [musicA, musicB].concat(sfxPool).forEach(function (el) { try { el.pause(); } catch (e) { } });
    state.musicKey = null;
    state.duckFlags = { voicePrompt: false, listening: false, speaking: false };
  }

  preload();

  window.AudioManager = {
    unlock: unlock,
    setMusicState: setMusicState,
    playSfx: playSfx,
    setListening: setListening,
    setChildSpeaking: setChildSpeaking,
    setVoicePromptPlaying: setVoicePromptPlaying,
    setMusicEnabled: setMusicEnabled,
    setSfxEnabled: setSfxEnabled,
    setVoiceEnabled: setVoiceEnabled,
    setMusicVolumeMultiplier: setMusicVolumeMultiplier,
    stopMusic: stopMusic,
    stopAll: stopAll,
    // read-only snapshot, handy for debugging and Playwright assertions
    _debugState: function () {
      return {
        enabled: Object.assign({}, state.enabled),
        duckFlags: Object.assign({}, state.duckFlags),
        duckMul: Object.assign({}, state.duckMul),
        musicKey: state.musicKey,
        pendingMusicKey: state.pendingMusicKey,
        unlocked: state.unlocked,
        activeSfxCount: state.activeSfxCount
      };
    }
  };
})();
