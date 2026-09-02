import { useCallback, useRef } from 'react';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

/**
 * A rapid burst of taps on a card (a real toddler failure mode —
 * `tests/interaction_suite.py`'s `burst()` exists for exactly this) fires
 * `onPress` once per tap, and `router.push()` has no built-in de-duplication:
 * ten taps on the same category card push the same screen ten times onto
 * the stack. This wraps `router.push` with a "one navigation in flight"
 * guard, reset by `useFocusEffect` when the screen that did the pushing
 * regains focus (i.e. after the pushed screen is popped back to it) — so a
 * card is tappable again once its own screen is visible again, but never
 * while a navigation it already triggered is still in flight.
 */
export function useGuardedPush() {
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
      router.push(href);
    },
    [router],
  );
}
