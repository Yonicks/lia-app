import { useCallback, useRef } from 'react';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

/**
 * Mirror of `useGuardedPush` for hub-to-hub switches that must not grow the
 * back stack. Same busy/focus guard; calls `router.replace` instead of push.
 */
export function useGuardedReplace() {
  const router = useRouter();
  const busy = useRef(false);

  useFocusEffect(
    useCallback(() => {
      busy.current = false;
    }, []),
  );

  return useCallback(
    (href: Href) => {
      if (busy.current) return;
      busy.current = true;
      router.replace(href);
    },
    [router],
  );
}
