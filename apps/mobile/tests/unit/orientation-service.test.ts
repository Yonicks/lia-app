/**
 * Phase 17 (docs/migration/phase-17-report.md) replaced the Phase 4
 * per-route orientation policy — pure lookup tests lived in the deleted
 * orientation-policy.test.ts — with a single app-wide landscape contract.
 * There is no longer a route-to-policy table to unit-test; what remains
 * testable without a live native module is the fallback wrapper every
 * `OrientationService` call goes through (see OrientationService.ts's
 * `withOrientationFallback` — the real `expo-screen-orientation` import
 * pulls in React Native's Flow-syntax source, which vitest/jsdom cannot
 * parse, so the service implementation itself is exercised by Playwright,
 * not here).
 */
import { describe, expect, it } from 'vitest';

import { withOrientationFallback } from '@/services/orientation/OrientationService';

describe('withOrientationFallback', () => {
  it('returns the real result when the call succeeds', async () => {
    await expect(withOrientationFallback(async () => 'landscape' as const, 'portrait')).resolves.toBe('landscape');
  });

  it('returns the fallback value when the call throws synchronously', async () => {
    await expect(
      withOrientationFallback(() => {
        throw new Error('no native orientation API');
      }, 'landscape'),
    ).resolves.toBe('landscape');
  });

  it('returns the fallback value when the call rejects', async () => {
    await expect(withOrientationFallback(() => Promise.reject(new Error('rejected')), 'landscape')).resolves.toBe(
      'landscape',
    );
  });

  it('never throws, whatever the wrapped call does', async () => {
    await expect(
      withOrientationFallback(() => Promise.reject(new Error('boom')), undefined),
    ).resolves.toBeUndefined();
  });
});
