import { useCallback } from 'react';
import { useRouter } from 'expo-router';

/**
 * The one sanctioned way a feature screen pops itself. Screens must not
 * import `expo-router` (or any other `expo-*` package) directly — phase-07
 * standing rule "No direct expo-* import from a screen. Services only."
 * Route files under `app/` are the exception; they are the router.
 */
export function useGoBack(): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);
}
