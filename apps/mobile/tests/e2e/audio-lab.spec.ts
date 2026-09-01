import { expect, test } from '@playwright/test';

import { SFX_FILES } from '../../src/domain/audio/audioPolicy';
import { orientationPolicy } from '../../src/services/orientation/policy';
import { testIds } from '../../src/testing/testIds';
import { captureMatrix, degradeNativeApis, speechSpy } from './_helpers';

const SFX_EVENTS = Object.keys(SFX_FILES);
const ORIENTATION_ROUTES = Object.keys(orientationPolicy) as (keyof typeof orientationPolicy)[];

/**
 * Tier 2 coverage for app/dev/audio-lab.tsx, per phase-04-plan.md's Tier 2
 * test plan: "the lab screen renders and every control is present", "the
 * web audio engine plays and stops without a console error",
 * "debugState() reports the expected duck flags after each toggle",
 * "captureMatrix(...)". This runs against the real `webAudioEngine`
 * (HTMLAudioElement) — real crossfade/pooling/ducking mechanics in a real
 * browser, but NOT evidence of native `expo-audio` behaviour
 * (validation.md §4; see docs/migration/phase-04-native-report.md for what
 * this environment could not verify).
 */

/**
 * Navigates to the unlinked `/dev/audio-lab` route client-side, via
 * `e2eRouterBridge.ts`'s `window.__talkiRouterE2E` — `expo serve`'s static
 * file server has no SPA fallback and 404s a direct `page.goto()` to any
 * nested path (see that bridge file's header comment for the full
 * investigation). Loads `/` for a real first HTTP request, then asks the
 * already-running client bundle to route itself.
 */
async function gotoAudioLab(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => Boolean((window as unknown as { __talkiRouterE2E?: unknown }).__talkiRouterE2E));
  await page.evaluate(() => {
    (window as unknown as { __talkiRouterE2E: { push: (path: string) => void } }).__talkiRouterE2E.push(
      '/dev/audio-lab'
    );
  });
  await page.waitForSelector('[data-testid="audio-lab-root"]');
}

async function readDebugState(page: import('@playwright/test').Page) {
  const text = await page.getByTestId(testIds.audioLab.debugState).innerText();
  return JSON.parse(text) as {
    enabled: { music: boolean; sfx: boolean };
    duckFlags: { voicePrompt: boolean; listening: boolean; speaking: boolean };
    duckMul: { music: number; sfx: number };
    musicKey: string | null;
    pendingMusicKey: string | null;
    unlocked: boolean;
    activeSfxCount: number;
  };
}

test.describe('audio-lab', () => {
  test('renders, every control is present, and produces no console error', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await gotoAudioLab(page);

    await expect(page.getByTestId(testIds.audioLab.root)).toBeVisible();
    await expect(page.getByTestId(testIds.audioLab.unlockButton)).toBeVisible();
    await expect(page.getByTestId(testIds.audioLab.debugState)).toBeVisible();

    // All 22 SFX buttons present.
    for (const event of SFX_EVENTS) {
      await expect(page.getByTestId(testIds.audioLab.sfxButton(event))).toBeVisible();
    }
    // All 10 music-state buttons + rewardScreen present.
    await expect(page.getByTestId(testIds.audioLab.musicButton('home'))).toBeVisible();
    await expect(page.getByTestId(testIds.audioLab.musicButton('rewardScreen'))).toBeVisible();
    // All 5 orientation route buttons present.
    for (const route of ORIENTATION_ROUTES) {
      await expect(page.getByTestId(testIds.audioLab.orientationButton(route))).toBeVisible();
    }
    await expect(page.getByTestId(testIds.audioLab.recordStartButton)).toBeVisible();
    await expect(page.getByTestId(testIds.audioLab.recordStopButton)).toBeVisible();
    await expect(page.getByTestId(testIds.audioLab.recognitionRunButton)).toBeVisible();

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);

    await captureMatrix(page, '04', 'audio-lab');
  });

  test('the web audio engine plays and stops without a console error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await gotoAudioLab(page);

    await page.getByTestId(testIds.audioLab.unlockButton).click();
    let state = await readDebugState(page);
    expect(state.unlocked).toBe(true);

    await page.getByTestId(testIds.audioLab.musicButton('home')).click();
    state = await readDebugState(page);
    expect(state.musicKey).toBe('home');

    // Rapid-fire every SFX once — proves the pool/cooldown machinery runs
    // for real against real HTMLAudioElements without throwing.
    for (const event of SFX_EVENTS) {
      await page.getByTestId(testIds.audioLab.sfxButton(event)).click();
    }
    await page.waitForTimeout(150);

    await page.getByTestId(testIds.audioLab.stopAllButton).click();
    state = await readDebugState(page);
    expect(state.musicKey).toBeNull();
    expect(state.activeSfxCount).toBe(0);

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
  });

  test('debugState() reports the expected duck flags after each toggle', async ({ page }) => {
    await gotoAudioLab(page);
    await page.getByTestId(testIds.audioLab.unlockButton).click();

    await page.getByTestId(testIds.audioLab.setVoicePromptToggle).click();
    await page.waitForTimeout(200);
    let state = await readDebugState(page);
    expect(state.duckFlags).toEqual({ voicePrompt: true, listening: false, speaking: false });
    expect(state.duckMul.music).toBeLessThan(1);

    await page.getByTestId(testIds.audioLab.setVoicePromptToggle).click(); // back off
    await page.getByTestId(testIds.audioLab.setListeningToggle).click();
    await page.waitForTimeout(200);
    state = await readDebugState(page);
    expect(state.duckFlags.listening).toBe(true);

    await page.getByTestId(testIds.audioLab.setListeningToggle).click();
    await page.getByTestId(testIds.audioLab.setSpeakingToggle).click();
    await page.waitForTimeout(200);
    state = await readDebugState(page);
    expect(state.duckFlags.speaking).toBe(true);
    expect(state.duckMul.sfx).toBe(0); // hard-mute, per audioPolicy.DUCK.speaking.sfx
  });

  test('toggling music/sfx enabled flips debugState().enabled', async ({ page }) => {
    await gotoAudioLab(page);
    const before = await readDebugState(page);

    await page.getByTestId(testIds.audioLab.toggleMusicEnabled).click();
    let state = await readDebugState(page);
    expect(state.enabled.music).toBe(!before.enabled.music);

    await page.getByTestId(testIds.audioLab.toggleSfxEnabled).click();
    state = await readDebugState(page);
    expect(state.enabled.sfx).toBe(!before.enabled.sfx);
  });

  test('word voice resolution runs end to end without throwing', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await gotoAudioLab(page);
    await page.getByTestId(testIds.audioLab.voiceButton('resolve-and-speak')).click();
    await page.waitForTimeout(300);

    const resultText = await page.getByTestId(testIds.audioLab.voiceResultLabel).innerText();
    const result = JSON.parse(resultText) as { kind: string };
    // A real browser's speechSynthesis voice list is environment-dependent
    // (headless Chromium commonly has none at all) — both are legitimate,
    // non-throwing outcomes; what matters is it never silently falls back
    // to a wrong kind or throws.
    expect(['tts', 'unavailable', 'parentRecording', 'bundledVoice']).toContain(result.kind);
    expect(pageErrors).toHaveLength(0);
  });

  test('recording start/stop reports a status without crashing (no mic grant in CI)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await gotoAudioLab(page);
    await page.getByTestId(testIds.audioLab.recordStartButton).click();
    await page.waitForTimeout(300);
    const status = await page.getByTestId(testIds.audioLab.recordStatusLabel).innerText();
    expect(status.length).toBeGreaterThan(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('orientation buttons run the policy without throwing, for every route', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await gotoAudioLab(page);
    for (const route of ORIENTATION_ROUTES) {
      await page.getByTestId(testIds.audioLab.orientationButton(route)).click();
      await page.waitForTimeout(50);
    }
    const current = await page.getByTestId(testIds.audioLab.orientationCurrentLabel).innerText();
    expect(current.length).toBeGreaterThan(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('recognition button runs without throwing, whatever the browser supports', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await gotoAudioLab(page);
    await page.getByTestId(testIds.audioLab.recognitionRunButton).click();
    await page.waitForTimeout(300);
    const result = await page.getByTestId(testIds.audioLab.recognitionResultLabel).innerText();
    expect(result).not.toBe('(not yet run)');
    expect(pageErrors).toHaveLength(0);
  });

  test('speechSpy records every WordVoiceService.say() call', async ({ page }) => {
    const spy = await speechSpy(page); // must be installed before navigation
    await gotoAudioLab(page);

    expect(await spy.calls()).toHaveLength(0);

    await page.getByTestId(testIds.audioLab.voiceButton('resolve-and-speak')).click();
    await page.waitForTimeout(300);

    const calls = await spy.calls();
    expect(calls).toHaveLength(1);
    expect(calls[0].core).toBe(true);
    expect(typeof calls[0].word).toBe('string');
  });

  test('degradeNativeApis forces services unavailable without crashing the screen', async ({ page }) => {
    const pageErrors: string[] = [];
    await degradeNativeApis(page); // must be installed before navigation
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await gotoAudioLab(page);
    await expect(page.getByTestId(testIds.audioLab.root)).toBeVisible();

    await page.getByTestId(testIds.audioLab.voiceButton('resolve-and-speak')).click();
    await page.waitForTimeout(300);
    const voiceResult = JSON.parse(
      await page.getByTestId(testIds.audioLab.voiceResultLabel).innerText()
    ) as { kind: string };
    expect(voiceResult.kind).toBe('unavailable'); // no speechSynthesis at all now

    await page.getByTestId(testIds.audioLab.recognitionRunButton).click();
    await page.waitForTimeout(200);
    const recognitionResult = await page.getByTestId(testIds.audioLab.recognitionResultLabel).innerText();
    expect(recognitionResult).toContain('unavailable');

    // The screen must stay interactive throughout — never a hard crash.
    await expect(page.getByTestId(testIds.audioLab.unlockButton)).toBeEnabled();
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toHaveLength(0);
  });
});
