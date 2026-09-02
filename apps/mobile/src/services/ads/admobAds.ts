import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

import { AD_FALLBACK_PX, CHILD_SAFETY_FLAGS, bannerUnitId, formatAdRequestLog } from './adConfig';
import type { AdService } from './AdService';

function maxRating(): MaxAdContentRating {
  // Talki stores the legacy string 'General'; the SDK enum is G.
  return CHILD_SAFETY_FLAGS.maxAdContentRating === 'General' ? MaxAdContentRating.G : MaxAdContentRating.G;
}

export const admobAds: AdService = {
  async start(onHeight) {
    console.info(formatAdRequestLog());
    try {
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: maxRating(),
        tagForChildDirectedTreatment: CHILD_SAFETY_FLAGS.tagForChildDirectedTreatment,
      });
      await mobileAds().initialize();
      void bannerUnitId();
      onHeight(AD_FALLBACK_PX);
    } catch (e) {
      console.warn('AdMob', e);
      onHeight(0);
    }
  },
  async stop() {
    /* banner unmount handles teardown */
  },
  isAvailable() {
    return true;
  },
};
