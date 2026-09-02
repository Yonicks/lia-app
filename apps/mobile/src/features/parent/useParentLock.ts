import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Leaving the parent view re-locks (index.html 2098-2100). The unlocked
 * flag is local to this screen — never a global store.
 */
export function useParentLock() {
  const [unlocked, setUnlocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => setUnlocked(false);
    }, []),
  );

  return {
    unlocked,
    unlock: () => setUnlocked(true),
    lock: () => setUnlocked(false),
  };
}
