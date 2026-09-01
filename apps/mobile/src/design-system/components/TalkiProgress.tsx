import { StyleSheet, View } from 'react-native';

import { v2, v3 } from '../theme/colors';

export interface TalkiProgressProps {
  /** 0..1. Clamped defensively — legacy computes this from live counters and
   *  occasionally overshoots by a rounding hair. */
  value: number;
  testID?: string;
}

/** index.html `.bar-track`/`.bar-fill` — a rounded track with a gradient-ish
 *  (flattened to a single warm gold here — RN has no two-stop fill without a
 *  gradient view, and the bar is thin enough that the difference is
 *  imperceptible) fill. Purely presentational: no accessibilityRole of
 *  button/link/etc, so it is correctly exempt from the touch-target audit. */
export function TalkiProgress({ value, testID }: TalkiProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      testID={testID}
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 9,
    borderRadius: 999,
    backgroundColor: v2.cream,
    borderWidth: 1,
    borderColor: v2.line,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: v3.gold500,
  },
});
