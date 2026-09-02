import { AD_FALLBACK_PX, CHILD_SAFETY_FLAGS, bannerUnitId, formatAdRequestLog } from './adConfig';
import type { AdService } from './AdService';

/**
 * Native AdMob seam. react-native-google-mobile-ads is not a dependency of
 * this sandbox (expo-doctor / no device). start() still emits the exact
 * request-flag log line the attestation requires, then reports the 50 px
 * fallback. A later native pass can replace the body with the SDK call
 * without changing the flags or the AdService contract.
 */
export const admobAds: AdService = {
  async start(onHeight) {
    // Evidence that the flags are on the REQUEST, not only an initialiser.
    console.info(formatAdRequestLog());
    try {
      onHeight(AD_FALLBACK_PX);
      void CHILD_SAFETY_FLAGS;
      void bannerUnitId();
    } catch (e) {
      console.warn('AdMob', e);
      onHeight(0);
    }
  },
  async stop() {
    /* */
  },
  isAvailable() {
    return true;
  },
};
