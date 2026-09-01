import { useEffect, useState } from 'react';

import { Asset } from 'expo-asset';

import { INTRO_IMAGE_SOURCES } from './layers';

/**
 * Resolves once every intro image is decoded and ready to paint —
 * "Preload every intro asset before the first frame; start only when
 * ready" (phase-06-plan.md work item 2). This is what makes the sequence
 * deterministic: the first animated frame never races an image decode, so
 * the same wall-clock offset from "ready" always produces the same visual
 * frame, which is the property `intro.spec.ts`'s fixed-timestamp captures
 * depend on.
 *
 * `Asset.loadAsync` accepts the numeric module IDs `require()` returns
 * directly; on web this resolves once the underlying `<img>` fetch
 * completes, and on native once the bundled file is registered — both
 * "ready to paint", not just "requested".
 */
export function useIntroPreload(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Asset.loadAsync(INTRO_IMAGE_SOURCES as number[])
      .catch(() => {
        // A missing/corrupt asset must not hang the intro forever — fall
        // through to "ready" so the sequence still starts and skip/finish
        // still work; a broken image simply doesn't paint.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
