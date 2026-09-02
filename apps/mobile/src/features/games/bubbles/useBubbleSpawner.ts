import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { createBubbleSpawner } from './bubbleSpawner';

export { BUBBLE_INTERVAL_MS, BUBBLE_STAGGER_MS, createBubbleSpawner } from './bubbleSpawner';

export function useBubbleSpawner(enabled: boolean, spawn: () => void): void {
  const spawnRef = useRef(spawn);
  useEffect(() => {
    spawnRef.current = spawn;
  }, [spawn]);

  useEffect(() => {
    if (!enabled) return undefined;
    const s = createBubbleSpawner(() => spawnRef.current());
    s.start();
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') s.resume();
      else s.pause();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      s.stop();
      sub.remove();
    };
  }, [enabled]);
}
