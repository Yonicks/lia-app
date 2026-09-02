import { gameCardAssets } from '../../design-system/assets';
import type { GameId } from '../types';

/**
 * index.html 2355-2377 (`renderGamesMenu`) gives seven of the eleven games a
 * dedicated card image and renders the rest — `match`, `bubbles`, `sort`,
 * `speech` — as a plain/emoji card. That split is legacy's own, not a
 * substitute this port invented, so it is preserved exactly rather than
 * treated as a "missing asset" to work around.
 */
export function gameCardImage(id: GameId): (typeof gameCardAssets)[keyof typeof gameCardAssets] | undefined {
  return (gameCardAssets as Partial<Record<GameId, (typeof gameCardAssets)[keyof typeof gameCardAssets]>>)[id];
}
