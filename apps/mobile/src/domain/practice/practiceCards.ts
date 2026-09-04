import { practiceCardAssets } from '../../design-system/assets';
import type { PracticeModeId } from '../types';

/**
 * Resolves production card art for a practice mode id. Phase 22 registers
 * art for every PRACTICE_LIST mode; returns undefined only if a future id
 * lacks a registry entry (caller may fall back to a labeled placeholder).
 */
export function practiceCardImage(
  id: PracticeModeId,
): (typeof practiceCardAssets)[keyof typeof practiceCardAssets] | undefined {
  return (
    practiceCardAssets as Partial<
      Record<PracticeModeId, (typeof practiceCardAssets)[keyof typeof practiceCardAssets]>
    >
  )[id];
}
