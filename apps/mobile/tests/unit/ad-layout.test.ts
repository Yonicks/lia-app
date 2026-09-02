import { describe, expect, it } from 'vitest';

import { AD_FALLBACK_PX, CHILD_SAFETY_FLAGS, TEST_BANNER_UNIT_ID, bannerUnitId, isTestBannerId } from '@/services/ads/adConfig';
import { composeContentBottom, reservedAdHeight } from '@/services/ads/adLayout';
import { noopAds } from '@/services/ads/noopAds';
import { tabBarHeight } from '@/design-system/theme/spacing';

describe('reserved ad height', () => {
  it('is 0 with no ad', () => {
    expect(reservedAdHeight(false, 80)).toBe(0);
    expect(reservedAdHeight(false, null)).toBe(0);
  });

  it('equals the reported banner height when present', () => {
    expect(reservedAdHeight(true, 80)).toBe(80);
    expect(reservedAdHeight(true, 32)).toBe(32);
  });

  it('falls back to 50 when the height is unknown', () => {
    expect(AD_FALLBACK_PX).toBe(50);
    expect(reservedAdHeight(true, null)).toBe(50);
    expect(reservedAdHeight(true, undefined)).toBe(50);
    expect(reservedAdHeight(true, 0)).toBe(50);
  });
});

describe('safe layout composition — no double counting', () => {
  it('adds inset, tab bar and ad height exactly once each', () => {
    expect(composeContentBottom(34, tabBarHeight, 50)).toBe(34 + tabBarHeight + 50);
    expect(composeContentBottom(34, tabBarHeight, 50)).not.toBe(34 + 34 + tabBarHeight + 50);
  });

  it('screens that already sit above the navigator tab bar pass tabBarHeight 0', () => {
    expect(composeContentBottom(34, 0, 50)).toBe(84);
    expect(composeContentBottom(34, 0, 50)).not.toBe(34 + tabBarHeight + 50);
  });
});

describe('ad config and web selection', () => {
  it('ports every child-safety flag verbatim', () => {
    expect(CHILD_SAFETY_FLAGS.tagForChildDirectedTreatment).toBe(true);
    expect(CHILD_SAFETY_FLAGS.maxAdContentRating).toBe('General');
    expect(CHILD_SAFETY_FLAGS.npa).toBe(true);
    expect(CHILD_SAFETY_FLAGS.adSize).toBe('ADAPTIVE_BANNER');
    expect(CHILD_SAFETY_FLAGS.position).toBe('BOTTOM_CENTER');
    expect(CHILD_SAFETY_FLAGS.margin).toBe(0);
  });

  it('uses the Google sample unit id by default', () => {
    expect(bannerUnitId()).toBe(TEST_BANNER_UNIT_ID);
    expect(isTestBannerId()).toBe(true);
  });

  it('noopAds is the web implementation', () => {
    expect(noopAds.isAvailable()).toBe(false);
  });
});
