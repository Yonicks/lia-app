import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { adService } from '@/services/ads';
import { setReservedAdHeight } from '@/services/ads/adLayout';
import { useReservedAdHeight } from '@/services/ads/useReservedAdHeight';
import { testIds } from '@/testing/testIds';

/**
 * Reserves banner height in layout. On web this never mounts an ad element
 * (index.html 4092 — AdMob is native-only). E2E can simulate a reserved
 * strip via `window.__talkiAdReservedPx`.
 */
export function AdBanner() {
  const reserved = useReservedAdHeight();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const w = window as unknown as {
        __talkiAdReservedPx?: number;
        __talkiSetAdReserved?: (px: number) => void;
      };
      w.__talkiSetAdReserved = (px) => setReservedAdHeight(px);
      if (typeof w.__talkiAdReservedPx === 'number') setReservedAdHeight(w.__talkiAdReservedPx);
      return;
    }
    if (Platform.OS === 'web') return;
    void adService.start((px) => setReservedAdHeight(px));
    return () => {
      void adService.stop();
      setReservedAdHeight(0);
    };
  }, []);

  if (reserved <= 0) return null;
  return <View testID={testIds.ads.reserved} style={{ height: reserved }} pointerEvents="none" />;
}
