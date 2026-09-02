import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { resolveStartCategory, START_GAME_TOAST } from '@/domain/games/startGame';
import type { CategoryId, GameId, PracticeModeId, TalkiCategory } from '@/domain/types';
import { allCats } from '@/domain/vocabulary/allCats';
import { orientationService } from '@/services/orientation';
import { useProgressStore } from '@/state/progressStore';

import { createManagedTimers, type TimerId } from './managedTimers';
import { useGameAudio } from './useGameAudio';

export interface UseGameSessionArgs {
  gameId: GameId | PracticeModeId;
  requestedCatId: string | null;
  /** `browse` is cards: no MIN_ITEMS gate, no levelStart, empty → home. */
  mode?: 'game' | 'browse';
  /** sounds: ignore the requested category and pin this one. */
  fixedCatId?: CategoryId;
}

export interface GameSession {
  ready: boolean;
  category: TalkiCategory | null;
  failed: boolean;
  toast: string | null;
  dismissToast: () => void;
  showToast: (message: string) => void;
  tryLock: () => boolean;
  unlock: () => void;
  isLocked: () => boolean;
  restart: () => void;
  epoch: number;
  audio: ReturnType<typeof useGameAudio>;
  schedule: (ms: number, fn: () => void) => TimerId;
  cancel: (id: TimerId) => void;
  cancelAll: () => void;
  pendingTimers: () => number;
}

/**
 * Shared lifecycle: resolve category (`startGame` 2491-2495), fire
 * `game.levelStart`, lock landscape through OrientationService, and own
 * the rapid-tap lock. Per-game board state stays in the game's reducer.
 */
export function useGameSession({ gameId, requestedCatId, mode = 'game', fixedCatId }: UseGameSessionArgs): GameSession {
  const { hydrated, custom, hydrate } = useProgressStore();
  const audio = useGameAudio();
  const [toastHidden, setToastHidden] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);
  const lockRef = useRef(false);
  const playedEpoch = useRef(-1);
  const timers = useRef(createManagedTimers());

  useEffect(() => {
    if (!hydrated) void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void orientationService.applyFor('games');
    const t = timers.current;
    return () => {
      t.cancelAll();
      void orientationService.unlock();
    };
  }, []);

  const result = useMemo(() => {
    if (!hydrated) return null;
    const cats = allCats(custom);
    if (mode === 'browse') {
      if (requestedCatId) {
        const requested = cats.find((c) => c.id === requestedCatId);
        if (!requested || requested.items.length === 0) return { ok: false as const, toast: null };
        return { ok: true as const, category: requested };
      }
      const category = cats[0];
      if (!category || category.items.length === 0) return { ok: false as const, toast: null };
      return { ok: true as const, category };
    }
    return resolveStartCategory(gameId, (fixedCatId ?? requestedCatId) as CategoryId | null, cats);
  }, [hydrated, custom, gameId, requestedCatId, mode, fixedCatId]);

  useEffect(() => {
    if (!result?.ok) return;
    lockRef.current = false;
    timers.current.cancelAll();
    if (playedEpoch.current === epoch) return;
    playedEpoch.current = epoch;
    if (mode === 'game') audio.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, epoch, mode]);

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
    timers.current.cancelAll();
    setEpoch((n) => n + 1);
  }, []);

  const schedule = useCallback((ms: number, fn: () => void) => timers.current.schedule(ms, fn), []);
  const cancel = useCallback((id: TimerId) => timers.current.cancel(id), []);
  const cancelAll = useCallback(() => timers.current.cancelAll(), []);
  const pendingTimers = useCallback(() => timers.current.pending(), []);

  const gateToast = result && !result.ok && !toastHidden ? result.toast : null;

  return {
    ready: hydrated && result !== null,
    category: result?.ok ? result.category : null,
    failed: result !== null && !result.ok,
    toast: localToast ?? gateToast,
    dismissToast: () => {
      setToastHidden(true);
      setLocalToast(null);
    },
    showToast: (message) => setLocalToast(message),
    tryLock,
    unlock,
    isLocked,
    restart,
    epoch,
    audio,
    schedule,
    cancel,
    cancelAll,
    pendingTimers,
  };
}

export { START_GAME_TOAST };
