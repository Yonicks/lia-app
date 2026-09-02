/**
 * Child-safety flags ported VERBATIM from index.html 4105-4124.
 * These are not library defaults — they are the shipping children's-app
 * configuration. Do not "improve" them from AdMob docs.
 */
export const CHILD_SAFETY_FLAGS = {
  tagForChildDirectedTreatment: true,
  maxAdContentRating: 'General',
  npa: true,
  adSize: 'ADAPTIVE_BANNER',
  position: 'BOTTOM_CENTER',
  margin: 0,
} as const;

/** Google SAMPLE banner unit — index.html 4095-4097. */
export const TEST_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

export const AD_FALLBACK_PX = 50;

/**
 * Real AdMob unit ids MUST be set via env before a store release.
 * Never commit a real ca-app-pub-… id that is not the Google sample.
 */
export function bannerUnitId(): string {
  const fromEnv = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_ADMOB_BANNER_ID : undefined;
  if (fromEnv && fromEnv.length > 0 && fromEnv !== TEST_BANNER_UNIT_ID) {
    return fromEnv;
  }
  return TEST_BANNER_UNIT_ID;
}

export function isTestBannerId(id: string = bannerUnitId()): boolean {
  return id === TEST_BANNER_UNIT_ID;
}

export const AD_REQUEST_LOG_PREFIX = 'Talki AdMob request';

export function formatAdRequestLog(): string {
  return `${AD_REQUEST_LOG_PREFIX} ${JSON.stringify({
    tagForChildDirectedTreatment: CHILD_SAFETY_FLAGS.tagForChildDirectedTreatment,
    maxAdContentRating: CHILD_SAFETY_FLAGS.maxAdContentRating,
    npa: CHILD_SAFETY_FLAGS.npa,
    adSize: CHILD_SAFETY_FLAGS.adSize,
    position: CHILD_SAFETY_FLAGS.position,
    margin: CHILD_SAFETY_FLAGS.margin,
    adId: bannerUnitId(),
  })}`;
}
