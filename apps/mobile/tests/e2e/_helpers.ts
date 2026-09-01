import { mkdirSync } from 'node:fs';
import path from 'node:path';

import type { Page } from '@playwright/test';

import { MIN_TOUCH, VIEWPORTS } from './viewports';

export { VIEWPORTS, MIN_TOUCH };

/**
 * Ports of the real-user-interaction audits from tests/interaction_suite.py.
 * React Native Web renders every `testID` as `data-testid`. Every audit
 * returns a violation list rather than throwing, exactly as the legacy
 * `REACHABILITY` / `TOUCH_SIZES` helpers do, so a spec can assert on the list
 * and report every violation at once.
 */

export interface TouchViolation {
  testId: string;
  width: number;
  height: number;
}

export interface ReachabilityViolation {
  testId: string;
  coveredBy: string;
}

/** Navigate, skip the intro (once it exists), wait for the first interactive
 * screen. Phase 1 has no intro and no gate, so this is presently just a
 * navigation + settle; later phases extend it without changing the signature. */
export async function openApp(
  page: Page,
  opts: { skipIntro?: boolean } = {}
): Promise<void> {
  const { skipIntro = true } = opts;
  const url = skipIntro ? '/?intro=0' : '/';
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

/**
 * The legacy TOUCH_SIZES audit never scanned every element on the page — it
 * took an explicit list of interactive CSS classes (.pill-btn, .tile, .opt,
 * ...). react-native-web gives a plain Text no role at all, so there is no
 * attribute that distinguishes a label from a control unless the component
 * sets one explicitly. The convention going forward: every tappable control
 * gets both a testID and an explicit accessibilityRole (button, link, tab,
 * switch, checkbox or radio); a plain label gets a testID with no role and is
 * exempt, exactly as legacy static text was never in TOUCH_SIZES' selector
 * list. This selector is the interactive half of that convention.
 */
const INTERACTIVE_SELECTOR =
  '[data-testid][role="button"], [data-testid][role="link"], ' +
  '[data-testid][role="tab"], [data-testid][role="switch"], ' +
  '[data-testid][role="checkbox"], [data-testid][role="radio"]';

/**
 * Every interactive, testID-carrying element (see INTERACTIVE_SELECTOR) must
 * measure at least minSize x minSize in CSS pixels, including any
 * ::before/::after the element grows for a bigger hit area. Mirrors
 * TOUCH_SIZES in tests/interaction_suite.py.
 */
export async function auditTouchTargets(
  page: Page,
  minSize = MIN_TOUCH
): Promise<TouchViolation[]> {
  return page.evaluate(({ min, selector }) => {
    const out: { testId: string; width: number; height: number }[] = [];
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') {
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      let w = r.width;
      let h = r.height;
      for (const pseudo of ['::before', '::after']) {
        const ps = getComputedStyle(el, pseudo);
        if (ps.content && ps.content !== 'none' && ps.position === 'absolute') {
          w = Math.max(w, parseFloat(ps.width) || 0);
          h = Math.max(h, parseFloat(ps.height) || 0);
        }
      }
      if (Math.min(w, h) < min) {
        out.push({ testId: el.getAttribute('data-testid') || '', width: Math.round(w), height: Math.round(h) });
      }
    });
    return out;
  }, { min: minSize, selector: INTERACTIVE_SELECTOR });
}

/**
 * Scrolls each interactive [data-testid] element to the viewport centre and
 * hit-tests it with elementFromPoint. Fails when a child could never
 * actually tap the control because something else — a header, a bottom bar,
 * an ad slot — sits on top of it. Mirrors REACHABILITY.
 */
export async function auditReachability(page: Page): Promise<ReachabilityViolation[]> {
  return page.evaluate((selector) => {
    const out: { testId: string; coveredBy: string }[] = [];
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') return false;
      const r = el.getBoundingClientRect();
      return r.width >= 2 && r.height >= 2;
    });
    for (const el of els) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const ok = !!top && (el === top || el.contains(top) || top.contains(el));
      if (!ok) {
        out.push({
          testId: el.getAttribute('data-testid') || '',
          coveredBy: top ? `${top.tagName}.${String(top.className || '')}` : 'nothing',
        });
      }
    }
    window.scrollTo(0, 0);
    return out;
  }, INTERACTIVE_SELECTOR);
}

/** Fires n synchronous clicks with no delay between them, for
 * rapid-toddler-tap assertions. Mirrors the `burst()` closure used throughout
 * tests/interaction_suite.py (e.g. test_rapid_taps). */
export async function burst(page: Page, testId: string, n: number): Promise<void> {
  await page.evaluate(
    ([id, count]) => {
      const el = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      for (let i = 0; i < (count as number); i++) el?.click();
    },
    [testId, n] as const
  );
}

/**
 * Wraps EventTarget.prototype.addEventListener on a specific element to
 * detect handler growth across re-renders. Call once before triggering
 * re-renders, then again to read the delta. Mirrors test_no_listener_growth,
 * which is a direct response to the legacy app's full-innerHTML-replace
 * render loop; React does not re-bind on every render the same way, but the
 * audit stays valuable for any component that manually manages a listener
 * (e.g. a native audio or gesture callback) outside React's event system.
 */
export async function countListeners(page: Page, testId: string): Promise<number> {
  return page.evaluate((id) => {
    const w = window as unknown as { __listenerCounts?: Record<string, number> };
    if (!w.__listenerCounts) {
      w.__listenerCounts = {};
      const orig = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
      ) {
        const el = this as unknown as HTMLElement;
        const elId = el.getAttribute?.('data-testid');
        if (elId) {
          w.__listenerCounts![elId] = (w.__listenerCounts![elId] || 0) + 1;
        }
        return orig.call(this, type, listener, options);
      };
    }
    return w.__listenerCounts![id] || 0;
  }, testId);
}

/** Writes a screenshot under docs/migration/screenshots/phase-<phase>/ and
 * returns the path written. */
export async function captureMatrix(page: Page, phase: string, name: string): Promise<string> {
  const size = page.viewportSize();
  const projectName = size ? `${size.width}x${size.height}` : 'unknown';
  const dir = path.resolve(__dirname, `../../../../docs/migration/screenshots/phase-${phase}`);
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${projectName}-${name}.png`);
  await page.screenshot({ path: filePath });
  return filePath;
}

/**
 * Records every call made to the speech service so "speaks exactly once on
 * entry" is assertable, mirroring the legacy SPEECH_SPY pattern. Stubbed until
 * Phase 4 builds the speech service to spy on.
 * TODO(phase-04): install an init script that intercepts the real speech
 * module and records { text, at } for each call.
 */
export async function speechSpy(_page: Page): Promise<{ calls: unknown[] }> {
  return { calls: [] };
}

/**
 * Stubs the native service layer into its unavailable state so a screen can
 * be proven to survive missing TTS, missing microphone and missing
 * recognition, mirroring legacy STRIP_AUDIO. Stubbed until Phase 4 builds the
 * services to degrade.
 * TODO(phase-04): mock the speech/audio/recording modules to reject or return
 * "unavailable" and assert the screen still renders and stays interactive.
 */
export async function degradeNativeApis(_page: Page): Promise<void> {
  // no-op until Phase 4
}
