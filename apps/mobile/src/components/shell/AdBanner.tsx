import { useEffect } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { adService } from '@/services/ads';
import { CHILD_SAFETY_FLAGS, bannerUnitId } from '@/services/ads/adConfig';
import { setReservedAdHeight } from '@/services/ads/adLayout';
import { useReservedAdHeight } from '@/services/ads/useReservedAdHeight';
import { testIds } from '@/testing/testIds';

/**
 * Native AdMob adaptive banner, bottom centre (index.html 4092-4131).
 * Child-safety flags are applied in `admobAds.start()` before this loads.
 */
export function AdBanner() {
  const reserved = useReservedAdHeight();

  useEffect(() => {
    void adService.start((px) => setReservedAdHeight(px));
    return () => {
      void adService.stop();
      setReservedAdHeight(0);
    };
  }, []);

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
