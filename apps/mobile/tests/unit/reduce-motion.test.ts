import { describe, expect, it } from 'vitest';

import {
  REDUCED_MOTION_FLUSH_MS,
  REDUCED_MOTION_INTRO_HOLD_MS,
  modalAnimationType,
  motionDurationMs,
} from '@/design-system/motion/reduceMotion';

describe('reduce-motion policy helpers', () => {
  it('keeps intended duration when motion is allowed', () => {
    expect(motionDurationMs(150, false)).toBe(150);
    expect(motionDurationMs(0, false)).toBe(0);
  });

  it('collapses motion to a flush tick when reduced', () => {
    expect(motionDurationMs(150, true)).toBe(REDUCED_MOTION_FLUSH_MS);
    expect(motionDurationMs(1800, true)).toBe(REDUCED_MOTION_FLUSH_MS);
    expect(motionDurationMs(0, true)).toBe(0);
  });

  it('forces modal animationType none under reduce-motion', () => {
    expect(modalAnimationType(true, 'fade')).toBe('none');
    expect(modalAnimationType(false, 'fade')).toBe('fade');
  });

  it('documents intro hold timing', () => {
    expect(REDUCED_MOTION_INTRO_HOLD_MS).toBe(400);
  });
});
