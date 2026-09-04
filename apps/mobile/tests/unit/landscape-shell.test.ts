import { describe, expect, it } from 'vitest';

import {
  LANDSCAPE_BG_FOCAL,
  LANDSCAPE_BG_SOURCE,
  coverCropAxis,
  focalToContentPosition,
} from '@/design-system/landscape/backgrounds';
import { LANDSCAPE_MIN_TOUCH, landscapeTokens } from '@/design-system/landscape/tokens';
import type { DeviceClass } from '@/design-system/responsive/breakpoints';

const CLASSES: DeviceClass[] = ['compactPhone', 'phone', 'tablet', 'largeTablet'];

describe('landscapeTokens', () => {
  it('keeps child touch-related sizes at or above 48 across device classes', () => {
    for (const deviceClass of CLASSES) {
      const t = landscapeTokens(deviceClass);
      expect(t.sideNavSize).toBeGreaterThanOrEqual(LANDSCAPE_MIN_TOUCH);
      expect(t.categoryCardWidth).toBeGreaterThanOrEqual(LANDSCAPE_MIN_TOUCH);
      expect(t.categoryCardHeight).toBeGreaterThanOrEqual(LANDSCAPE_MIN_TOUCH);
      expect(t.topBarMinHeight).toBeGreaterThanOrEqual(LANDSCAPE_MIN_TOUCH);
    }
  });

  it('reduces gaps/padding on compactPhone relative to phone', () => {
    const compact = landscapeTokens('compactPhone');
    const phone = landscapeTokens('phone');
    expect(compact.gap).toBeLessThanOrEqual(phone.gap);
    expect(compact.padInline).toBeLessThanOrEqual(phone.padInline);
    expect(compact.titleSize).toBeLessThanOrEqual(phone.titleSize);
  });

  it('gives tablets more breathing room than phones without uniform giant scale', () => {
    const phone = landscapeTokens('phone');
    const tablet = landscapeTokens('tablet');
    expect(tablet.gap).toBeGreaterThan(phone.gap);
    expect(tablet.padInline).toBeGreaterThan(phone.padInline);
    expect(tablet.activityCardMaxHeight).toBeGreaterThan(phone.activityCardMaxHeight);
    // Not a naive ×2 of phone — bounded growth.
    expect(tablet.activityCardMaxHeight).toBeLessThan(phone.activityCardMaxHeight * 1.5);
  });

  it('always uses a 3×2 hub grid contract', () => {
    for (const deviceClass of CLASSES) {
      const t = landscapeTokens(deviceClass);
      expect(t.gridColumns).toBe(3);
      expect(t.gridRows).toBe(2);
    }
  });

  it('exposes a landscape word-grid contract with ≥5×2 density', () => {
    for (const deviceClass of CLASSES) {
      const t = landscapeTokens(deviceClass);
      expect(t.wordGridColumns).toBeGreaterThanOrEqual(5);
      expect(t.wordGridRows).toBe(2);
      expect(t.wordArtSize).toBeGreaterThanOrEqual(32);
      expect(t.wordLabelSize).toBeGreaterThanOrEqual(12);
    }
    const compact = landscapeTokens('compactPhone');
    const tablet = landscapeTokens('tablet');
    expect(tablet.wordGridColumns).toBeGreaterThan(compact.wordGridColumns);
  });

  it('exposes Phase 24 game-board tokens without local breakpoints', () => {
    for (const deviceClass of CLASSES) {
      const t = landscapeTokens(deviceClass);
      expect(t.quizOptionMin).toBeGreaterThanOrEqual(LANDSCAPE_MIN_TOUCH);
      expect(t.memoryCardMin).toBeGreaterThanOrEqual(LANDSCAPE_MIN_TOUCH);
      expect(t.missingCardSize).toBeGreaterThanOrEqual(LANDSCAPE_MIN_TOUCH);
      expect(t.matchRowMinHeight).toBeGreaterThanOrEqual(LANDSCAPE_MIN_TOUCH);
      expect(t.memoryColumns).toBe(4);
      expect(t.gameTitleSize).toBeGreaterThanOrEqual(14);
      expect(t.cardsStageMaxWidth).toBeGreaterThan(200);
    }
    expect(landscapeTokens('compactPhone').quizGridMode).toBe('2x2');
    expect(landscapeTokens('phone').quizGridMode).toBe('2x2');
    expect(landscapeTokens('tablet').quizGridMode).toBe('1x4');
    expect(landscapeTokens('largeTablet').quizGridMode).toBe('1x4');
    expect(landscapeTokens('compactPhone').cardsSplitLayout).toBe(false);
    expect(landscapeTokens('tablet').cardsSplitLayout).toBe(true);
  });
});

describe('landscape backgrounds', () => {
  it('records verified source dimensions 1672×941', () => {
    expect(LANDSCAPE_BG_SOURCE).toEqual({ width: 1672, height: 941 });
  });

  it('maps focal points into expo-image contentPosition objects', () => {
    expect(focalToContentPosition({ x: 0.5, y: 0.4 })).toEqual({ left: '50%', top: '40%' });
    expect(focalToContentPosition({ x: 0, y: 1 })).toEqual({ left: '0%', top: '100%' });
    expect(focalToContentPosition({ x: 1.2, y: -0.1 })).toEqual({ left: '100%', top: '0%' });
  });

  it('crops vertically on 4:3 tablet vs 16:9 source (taller viewport)', () => {
    // 1024×768 tablet vs 1672×941 art — viewport is taller relatively.
    expect(coverCropAxis(1024, 768, LANDSCAPE_BG_SOURCE.width, LANDSCAPE_BG_SOURCE.height)).toBe(
      'vertical'
    );
  });

  it('crops horizontally on wide phone vs source when viewport is wider', () => {
    // Extreme wide viewport relative to source.
    expect(coverCropAxis(2000, 900, LANDSCAPE_BG_SOURCE.width, LANDSCAPE_BG_SOURCE.height)).toBe(
      'horizontal'
    );
  });

  it('defines a focal point for every world id', () => {
    expect(LANDSCAPE_BG_FOCAL.home.x).toBeGreaterThan(0);
    expect(LANDSCAPE_BG_FOCAL.games.x).toBeGreaterThan(0);
    expect(LANDSCAPE_BG_FOCAL.practice.x).toBeGreaterThan(0);
  });
});
