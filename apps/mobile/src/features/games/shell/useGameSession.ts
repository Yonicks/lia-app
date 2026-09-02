import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { resolveStartCategory, START_GAME_TOAST } from '@/domain/games/startGame';
import type { CategoryId, GameId, TalkiCategory } from '@/domain/types';
import { allCats } from '@/domain/vocabulary/allCats';
import { orientationService } from '@/services/orientation';
import { useProgressStore } from '@/state/progressStore';

import { useGameAudio } from './useGameAudio';

export interface UseGameSessionArgs {
  gameId: GameId;
  requestedCatId: string | null;
}

export interface GameSession {
  ready: boolean;
  category: TalkiCategory | null;
  failed: boolean;
  toast: string | null;
  dismissToast: () => void;
  tryLock: () => boolean;
  unlock: () => void;
  isLocked: () => boolean;
  restart: () => void;
  epoch: number;
  audio: ReturnType<typeof useGameAudio>;
}

/**
 * Shared lifecycle: resolve category (`startGame` 2491-2495), fire
 * `game.levelStart`, lock landscape through OrientationService, and own
 * the rapid-tap lock. Per-game board state stays in the game's reducer.
 */
export function useGameSession({ gameId, requestedCatId }: UseGameSessionArgs): GameSession {
  const { hydrated, custom, hydrate } = useProgressStore();
  const audio = useGameAudio();
  const [toastHidden, setToastHidden] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const lockRef = useRef(false);
  const playedEpoch = useRef(-1);

  useEffect(() => {
    if (!hydrated) void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void orientationService.applyFor('games');
    return () => {
      void orientationService.unlock();
    };
  }, []);

  const result = useMemo(() => {
    if (!hydrated) return null;
    return resolveStartCategory(gameId, requestedCatId as CategoryId | null, allCats(custom));
  }, [hydrated, custom, gameId, requestedCatId]);

  useEffect(() => {
    if (!result?.ok) return;
    lockRef.current = false;
    if (playedEpoch.current === epoch) return;
    playedEpoch.current = epoch;
    audio.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, epoch]);

  const tryLock = useCallback(() => {
    if (lockRef.current) return false;
    lockRef.current = true;
    return true;
  }, []);

  const unlock = useCallback(() => {
    lockRef.current = false;
  }, []);

  const isLocked = useCallback(() => lockRef.current, []);

  const restart = useCallback(() => {
    setEpoch((n) => n + 1);
  }, []);

  return {
    ready: hydrated && result !== null,
    category: result?.ok ? result.category : null,
    failed: result !== null && !result.ok,
    toast: result && !result.ok && !toastHidden ? result.toast : null,
    dismissToast: () => setToastHidden(true),
    tryLock,
    unlock,
    isLocked,
    restart,
    epoch,
    audio,
  };
}

export { START_GAME_TOAST };
