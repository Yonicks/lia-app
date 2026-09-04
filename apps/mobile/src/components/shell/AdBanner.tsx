import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { adService } from '@/services/ads';
import { CHILD_SAFETY_FLAGS, bannerUnitId } from '@/services/ads/adConfig';
import { isBannerAdEligible } from '@/services/ads/adPlacement';
import { setReservedAdHeight } from '@/services/ads/adLayout';
import { useReservedAdHeight } from '@/services/ads/useReservedAdHeight';
import { testIds } from '@/testing/testIds';

/**
 * Native AdMob adaptive banner — only when the current route is eligible
 * (`adPlacement.ts` / `docs/design/landscape/ad-placement-policy.md`).
 * Child-safety flags are applied in `admobAds.start()` before this loads.
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
    void adService.start((px) => setReservedAdHeight(px));
    return () => {
      void adService.stop();
      setReservedAdHeight(0);
    };
  }, [eligible]);

  if (!eligible) return null;

  return (
    <View testID={testIds.ads.reserved} style={{ minHeight: reserved, alignItems: 'center' }}>
      <View testID={testIds.ads.banner}>
        <BannerAd
          unitId={bannerUnitId()}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: CHILD_SAFETY_FLAGS.npa,
          }}
          onAdLoaded={({ height }) => {
            if (height > 0) setReservedAdHeight(height);
          }}
          onAdFailedToLoad={() => setReservedAdHeight(0)}
          onSizeChange={({ height }) => {
            if (height > 0) setReservedAdHeight(height);
          }}
        />
      </View>
    </View>
  );
}
