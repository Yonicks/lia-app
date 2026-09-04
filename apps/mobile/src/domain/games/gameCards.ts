import { gameCardAssets } from '../../design-system/assets';
import type { GameId } from '../types';

/**
 * Resolves production card art for a game id. Phase 21 registers art for
 * every menu game; returns undefined only if a future id lacks a registry
 * entry (caller may fall back to a labeled placeholder).
 */
export function gameCardImage(id: GameId): (typeof gameCardAssets)[keyof typeof gameCardAssets] | undefined {
  return (gameCardAssets as Partial<Record<GameId, (typeof gameCardAssets)[keyof typeof gameCardAssets]>>)[id];
}
