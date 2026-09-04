import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { View } from 'react-native';

import { isBannerAdEligible } from '@/services/ads/adPlacement';
import { setReservedAdHeight } from '@/services/ads/adLayout';
import { useReservedAdHeight } from '@/services/ads/useReservedAdHeight';
import { testIds } from '@/testing/testIds';

/**
 * Web: never mounts an AdMob element. E2E can inject a reserved strip on
 * eligible routes only (`ad-placement-policy.md`).
 */
export function AdBanner() {
  const pathname = usePathname();
  const eligible = isBannerAdEligible(pathname);
  const reserved = useReservedAdHeight();

  useEffect(() => {
    if (!eligible) {
      setReservedAdHeight(0);
      return;
    }
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      __talkiAdReservedPx?: number;
      __talkiSetAdReserved?: (px: number) => void;
    };
    w.__talkiSetAdReserved = (px) => setReservedAdHeight(px);
    if (typeof w.__talkiAdReservedPx === 'number') setReservedAdHeight(w.__talkiAdReservedPx);
    return () => {
      setReservedAdHeight(0);
    };
  }, [eligible]);

  if (!eligible || reserved <= 0) return null;
  return <View testID={testIds.ads.reserved} style={{ height: reserved }} pointerEvents="none" />;
}
