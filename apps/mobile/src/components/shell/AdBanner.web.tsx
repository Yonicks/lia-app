import { useEffect } from 'react';
import { View } from 'react-native';

import { setReservedAdHeight } from '@/services/ads/adLayout';
import { useReservedAdHeight } from '@/services/ads/useReservedAdHeight';
import { testIds } from '@/testing/testIds';

/** Web: never mounts an AdMob element. E2E can inject a reserved strip. */
export function AdBanner() {
  const reserved = useReservedAdHeight();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      __talkiAdReservedPx?: number;
      __talkiSetAdReserved?: (px: number) => void;
    };
    w.__talkiSetAdReserved = (px) => setReservedAdHeight(px);
    if (typeof w.__talkiAdReservedPx === 'number') setReservedAdHeight(w.__talkiAdReservedPx);
  }, []);

  if (reserved <= 0) return null;
  return <View testID={testIds.ads.reserved} style={{ height: reserved }} pointerEvents="none" />;
}
