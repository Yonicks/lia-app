/**
 * Unit tests for the pure audio logic module (assets/audio/audio-logic.js).
 * No DOM, no Audio(), no bundler — run with: node --test tests/audio-logic.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../assets/audio/audio-logic.js');

test('every SfxEvent from the audio map resolves to a real filename', () => {
  const expected = [
    'ui.primaryTap', 'ui.secondaryTap', 'ui.cardAppear', 'ui.backOrClose', 'ui.swipe',
    'interaction.dragPickup', 'interaction.dragDrop', 'interaction.correctMatch', 'interaction.invalidMove',
    'answer.correct', 'answer.retry', 'reward.star', 'reward.unlock', 'reward.confetti',
    'game.levelStart', 'game.levelComplete', 'game.countdownTick', 'game.countdownGo',
    'system.softAttention', 'speech.listeningReady', 'speech.recognized', 'speech.finished'
  ];
  for (const ev of expected) {
    assert.ok(L.SFX_FILES[ev], `missing SFX mapping for ${ev}`);
    assert.match(L.SFX_FILES[ev], /^sfx\/\d\d_.+\.mp3$/);
  }
  assert.equal(Object.keys(L.SFX_FILES).length, expected.length);
});

test('all supplied gameplay tracks resolve to their music files', () => {
  assert.equal(L.resolveMusicFile('home'), 'music/01_main_menu_welcome.mp3');
  assert.equal(L.resolveMusicFile('gameplay_playroom_a'), 'music/06_talki_playroom.mp3');
  assert.equal(L.resolveMusicFile('gameplay_playroom_b'), 'music/07_talki_playroom_b.mp3');
  assert.equal(L.resolveMusicFile('gameplay_discoveries_a'), 'music/08_little_discoveries_a.mp3');
  assert.equal(L.resolveMusicFile('gameplay_discoveries_b'), 'music/09_little_discoveries_b.mp3');
  assert.equal(L.resolveMusicFile('gameplay_parade_a'), 'music/10_sunny_card_parade_a.mp3');
  assert.equal(L.resolveMusicFile('gameplay_parade_b'), 'music/11_sunny_card_parade_b.mp3');
  assert.equal(L.resolveMusicFile('gameplay_carousel_a'), 'music/12_warm_card_carousel_a.mp3');
  assert.equal(L.resolveMusicFile('gameplay_carousel_b'), 'music/13_warm_card_carousel_b.mp3');
  assert.equal(L.resolveMusicFile('speechOrListeningTask'), 'music/05_listening_focus.mp3');
  assert.equal(L.resolveMusicFile(null), null);
  assert.equal(L.resolveMusicFile('nonsense'), null);
});

test('reward screen reuses the home track (per policy: "return to home identity", not a new track)', () => {
  assert.equal(L.resolveMusicFile('rewardScreen'), L.resolveMusicFile('home'));
});

test('ducking priority: child speaking always wins over listening and voice prompt', () => {
  const allThree = L.computeDuckTarget({ speaking: true, listening: true, voicePrompt: true });
  assert.equal(allThree.reason, 'speaking');
  assert.equal(allThree.music, L.DUCK.speaking.music);
  assert.equal(allThree.sfx, 0); // hard rule: sfx fully muted while child speaks
});

test('ducking priority: listening beats voice prompt when both are set', () => {
  const r = L.computeDuckTarget({ listening: true, voicePrompt: true });
  assert.equal(r.reason, 'listening');
});

test('ducking: no active reason returns to full volume', () => {
  const r = L.computeDuckTarget({});
  assert.equal(r.reason, null);
  assert.equal(r.music, 1);
  assert.equal(r.sfx, 1);
});

test('ducking values match the integration pack exactly', () => {
  assert.deepEqual(L.computeDuckTarget({ voicePrompt: true }), { reason: 'voicePrompt', music: 0.32, sfx: 0.55, durationMs: 100 });
  assert.deepEqual(L.computeDuckTarget({ listening: true }), { reason: 'listening', music: 0.18, sfx: 0.25, durationMs: 120 });
  assert.deepEqual(L.computeDuckTarget({ speaking: true }), { reason: 'speaking', music: 0.08, sfx: 0, durationMs: 80 });
});

test('release duration falls back sensibly for an unknown last reason', () => {
  assert.equal(L.releaseDurationFor('speaking'), L.DUCK.speaking.releaseMs);
  assert.equal(L.releaseDurationFor(null), L.DUCK.voicePrompt.releaseMs);
});

test('shouldPlaySfx: blocked when sfx disabled', () => {
  assert.equal(L.shouldPlaySfx('ui.primaryTap', { sfxEnabled: false, now: 1000, lastPlay: {} }), false);
});

test('shouldPlaySfx: hard-blocked while child is speaking, even for celebrations', () => {
  assert.equal(L.shouldPlaySfx('game.levelComplete', { speaking: true, now: 1000, lastPlay: {} }), false);
  assert.equal(L.shouldPlaySfx('answer.correct', { speaking: true, now: 1000, lastPlay: {} }), false);
});

test('shouldPlaySfx: unknown event never plays', () => {
  assert.equal(L.shouldPlaySfx('not.a.real.event', { now: 1000, lastPlay: {} }), false);
});

test('shouldPlaySfx: respects per-category cooldowns', () => {
  const lastPlay = { 'ui.primaryTap': 1000, 'answer.correct': 1000, 'reward.star': 1000 };
  // tap cooldown 60ms — still inside window at +30ms
  assert.equal(L.shouldPlaySfx('ui.primaryTap', { now: 1030, lastPlay }), false);
  assert.equal(L.shouldPlaySfx('ui.primaryTap', { now: 1070, lastPlay }), true);
  // answer cooldown 400ms
  assert.equal(L.shouldPlaySfx('answer.correct', { now: 1300, lastPlay }), false);
  assert.equal(L.shouldPlaySfx('answer.correct', { now: 1450, lastPlay }), true);
  // celebration cooldown 800ms
  assert.equal(L.shouldPlaySfx('reward.star', { now: 1700, lastPlay }), false);
  assert.equal(L.shouldPlaySfx('reward.star', { now: 1900, lastPlay }), true);
});

test('shouldPlaySfx: caps at max simultaneous SFX', () => {
  assert.equal(L.shouldPlaySfx('ui.primaryTap', { now: 5000, lastPlay: {}, activeSfxCount: 3 }), false);
  assert.equal(L.shouldPlaySfx('ui.primaryTap', { now: 5000, lastPlay: {}, activeSfxCount: 2 }), true);
});

test('rapid-tap protection: two taps 10ms apart — only the first plays', () => {
  const lastPlay = {};
  const first = L.shouldPlaySfx('ui.primaryTap', { now: 1000, lastPlay });
  assert.equal(first, true);
  lastPlay['ui.primaryTap'] = 1000; // simulate the caller recording the play
  const second = L.shouldPlaySfx('ui.primaryTap', { now: 1010, lastPlay });
  assert.equal(second, false);
});

test('volume math: master/music/user/duck multipliers compose correctly', () => {
  const v = L.effectiveMusicVolume({ master: 1, music: 0.42, userMultiplier: 0.5, duckMultiplier: 1 });
  assert.ok(Math.abs(v - 0.21) < 1e-9);
});

test('volume math: reward screen applies its 0.72 multiplier on top', () => {
  const normal = L.effectiveMusicVolume({ master: 1, music: 0.42, userMultiplier: 1, duckMultiplier: 1, rewardScreen: false });
  const reward = L.effectiveMusicVolume({ master: 1, music: 0.42, userMultiplier: 1, duckMultiplier: 1, rewardScreen: true });
  assert.ok(Math.abs(reward - normal * L.REWARD_SCREEN_MUSIC_MULTIPLIER) < 1e-9);
});

test('volume math: always clamped to [0,1]', () => {
  assert.equal(L.effectiveMusicVolume({ master: 5, music: 5, userMultiplier: 5, duckMultiplier: 5 }), 1);
  assert.equal(L.effectiveSfxVolume({ master: -1, sfx: 1 }), 0);
});

test('never-combine pairs are all real, distinct sfx events', () => {
  for (const [a, b] of L.NEVER_COMBINE) {
    assert.ok(L.SFX_FILES[a], `${a} in NEVER_COMBINE is not a real event`);
    assert.ok(L.SFX_FILES[b], `${b} in NEVER_COMBINE is not a real event`);
    assert.notEqual(a, b);
  }
  // the specific pair the policy calls out explicitly
  const hasCorrectVsComplete = L.NEVER_COMBINE.some(([a, b]) =>
    (a === 'answer.correct' && b === 'game.levelComplete') || (b === 'answer.correct' && a === 'game.levelComplete'));
  assert.ok(hasCorrectVsComplete, 'answer.correct + game.levelComplete must be in NEVER_COMBINE');
});
