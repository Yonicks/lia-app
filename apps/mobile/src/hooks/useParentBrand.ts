import { useCallback, useState } from 'react';
import type { Href } from 'expo-router';

import { parentHref } from '@/domain/navigation/routes';

import { useGuardedPush } from './useGuardedPush';

const SHORT_TAP_TOAST = 'להורים: לחיצה ארוכה על הכפתור';

export function useParentBrand() {
  const push = useGuardedPush();
  const [toast, setToast] = useState<string | null>(null);

  const onBrandLongPress = useCallback(() => {
    push(parentHref as Href);
  }, [push]);

  const onBrandShortPress = useCallback(() => {
    setToast(SHORT_TAP_TOAST);
  }, []);

  return {
    toast,
    dismissToast: () => setToast(null),
    onBrandLongPress,
    onBrandShortPress,
  };
}
