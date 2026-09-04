import { describe, expect, it } from 'vitest';

import {
  APP_OPEN_ADS_ENABLED,
  BANNER_ELIGIBLE_EXACT_PATHS,
  bannerAdIneligibilityReason,
  isBannerAdEligible,
  normalizeAdPathname,
} from '@/services/ads/adPlacement';

describe('ad placement eligibility', () => {
  it('exposes exact eligible hub/parent paths', () => {
    expect([...BANNER_ELIGIBLE_EXACT_PATHS]).toEqual(['/', '/games', '/practice', '/rewards', '/parent']);
  });

  it('marks hub and parent routes eligible', () => {
    for (const path of BANNER_ELIGIBLE_EXACT_PATHS) {
      expect(isBannerAdEligible(path), path).toBe(true);
      expect(bannerAdIneligibilityReason(path)).toBeNull();
    }
  });

  it('suppresses active gameplay and practice detail', () => {
    expect(isBannerAdEligible('/game/quiz')).toBe(false);
    expect(bannerAdIneligibilityReason('/game/quiz')).toBe('active_gameplay');
    expect(isBannerAdEligible('/practice/focus')).toBe(false);
    expect(bannerAdIneligibilityReason('/practice/focus')).toBe('active_practice');
  });

  it('suppresses category, cards, intro, and dev', () => {
    expect(bannerAdIneligibilityReason('/category/animals')).toBe('category_detail');
    expect(bannerAdIneligibilityReason('/cards/animals')).toBe('cards_detail');
    expect(bannerAdIneligibilityReason('/intro')).toBe('opening_sequence');
    expect(bannerAdIneligibilityReason('/dev/gallery')).toBe('developer_surface');
  });

  it('does not enable app-open advertising', () => {
    expect(APP_OPEN_ADS_ENABLED).toBe(false);
  });

  it('normalizes trailing slashes and query strings', () => {
    expect(normalizeAdPathname('/games/')).toBe('/games');
    expect(normalizeAdPathname('/games?x=1')).toBe('/games');
    expect(isBannerAdEligible('/games/')).toBe(true);
    expect(isBannerAdEligible('/practice/?seed=1')).toBe(true);
    expect(isBannerAdEligible(null)).toBe(false);
    expect(bannerAdIneligibilityReason(null)).toBe('no_compliant_placement');
  });
});
