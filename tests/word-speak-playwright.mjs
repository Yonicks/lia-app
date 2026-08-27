/**
 * Verifies word-tile and flashcard taps speak and stay speaking past the old
 * 420ms cancel race. Injects a mock speechSynthesis because this Linux Chrome
 * has 0 system voices.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.TALKI_URL || 'http://localhost:8000/index.html';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: 760, height: 1100 } });

  await page.addInitScript(() => {
    const log = [];
    let speaking = false;
    let pending = false;
    let paused = false;
    let timer = null;
    let current = null;

    function finish(ok) {
      if (!current) return;
      const u = current;
      current = null;
      speaking = false;
      pending = false;
      if (timer) { clearTimeout(timer); timer = null; }
      try {
        if (ok && typeof u.onend === 'function') u.onend();
        if (!ok && typeof u.onerror === 'function') u.onerror({ error: 'canceled' });
      } catch (e) {}
    }

    const mock = {
      get speaking() { return speaking; },
      get pending() { return pending; },
      get paused() { return paused; },
      cancel() {
        log.push({ t: performance.now(), op: 'cancel', speaking, text: current && current.text });
        finish(false);
      },
      pause() { paused = true; },
      resume() { paused = false; },
      getVoices() {
        return [{ name: 'Mock Hebrew', lang: 'he-IL', default: true, localService: true, voiceURI: 'mock-he' }];
      },
      speak(u) {
        log.push({ t: performance.now(), op: 'speak', text: u && u.text, lang: u && u.lang, rate: u && u.rate });
        if (current) finish(false);
        current = u;
        pending = true;
        speaking = true;
        paused = false;
        try { if (typeof u.onstart === 'function') u.onstart(); } catch (e) {}
        const ms = Math.max(900, String(u.text || '').trim().length * 140);
        timer = setTimeout(() => finish(true), ms);
      },
      onvoiceschanged: null,
    };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => mock });
    window.SpeechSynthesisUtterance = function (text) {
      this.text = text;
      this.lang = '';
      this.rate = 1;
      this.pitch = 1;
      this.voice = null;
      this.onend = null;
      this.onerror = null;
      this.onstart = null;
    };
    window.__speechLog = log;
    window.__speechMock = mock;
  });

  await page.goto(BASE + '?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  if (await page.locator('#gateBtn').count()) {
    await page.locator('#gateBtn').click();
    await page.waitForTimeout(300);
  }

  await page.locator('[data-cat]').first().click();
  await page.waitForSelector('.tile');
  // Clear gate warm-up noise from the log
  await page.evaluate(() => { window.__speechLog.length = 0; });

  const tile = page.locator('.tile').first();
  const wordWithNiqqud = await tile.getAttribute('data-word');

  await tile.click();

  // Wait past the old 420ms render-cancel window
  await page.waitForTimeout(550);
  const mid = await page.evaluate(() => ({
    speaking: speechSynthesis.speaking,
    log: window.__speechLog.slice(),
    duck: AudioManager._debugState().duckFlags,
    learned: document.querySelector('.tile.learned') !== null,
  }));

  console.log('MID', JSON.stringify(mid, null, 2));

  const spokenWords = mid.log
    .filter(e => e.op === 'speak' && String(e.text || '').trim())
    .map(e => e.text);
  assert.ok(spokenWords.length >= 1, 'expected a real speak() call after tile tap');
  assert.equal(spokenWords[0], wordWithNiqqud, 'spoken word matches the tile (keep niqqud)');
  assert.equal(mid.speaking, true, 'speech should still be speaking at ~550ms (must not cancel mid-word)');
  assert.equal(mid.duck.voicePrompt, true, 'music should duck while word speaks');
  assert.equal(mid.learned, true, 'tile should mark learned without full re-render');

  const speakT = mid.log.find(e => e.op === 'speak' && String(e.text || '').trim()).t;
  const badCancel = mid.log.find(e =>
    e.op === 'cancel' && e.speaking && e.t > speakT + 20 && e.t < speakT + 450
  );
  assert.equal(badCancel, undefined, 'must not cancel mid-word within 450ms of speak');

  // Second tile also speaks
  await page.locator('.tile').nth(1).click();
  await page.waitForTimeout(120);
  const allSpoken = await page.evaluate(() =>
    window.__speechLog.filter(e => e.op === 'speak' && String(e.text || '').trim()).map(e => e.text)
  );
  assert.ok(allSpoken.length >= 2, 'second tile should also speak');
  assert.notEqual(allSpoken[0], allSpoken[1], 'second tile speaks a different word');

  // Flashcard tap must speak in-gesture (auto-read used to cancel+delay this)
  await page.locator('[data-cards]').first().click();
  await page.waitForSelector('#flash');
  await page.evaluate(() => { window.__speechLog.length = 0; });
  const cardWord = await page.locator('#flash').getAttribute('data-word');
  await page.locator('#flash').click();
  await page.waitForTimeout(80);
  const cardSpoken = await page.evaluate(() =>
    window.__speechLog.filter(e => e.op === 'speak' && String(e.text || '').trim()).map(e => e.text)
  );
  assert.ok(cardSpoken.length >= 1, 'flashcard tap should speak');
  assert.equal(cardSpoken[0], cardWord, 'flashcard speaks its word');

  console.log('PASS spoken words:', allSpoken, 'card:', cardSpoken);
  await browser.close();
}

main().catch(err => {
  console.error('FAIL', err);
  process.exit(1);
});
