import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { v2, v3 } from '@/design-system/theme/colors';

export interface LandscapeProgressProps {
  /** 0..1 */
  value: number;
  label?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Child-facing landscape progress bar — purple fill matching the Home
 * reference language. Reuses the TalkiProgress accessibility contract.
 */
export function LandscapeProgress({ value, label, testID, style }: LandscapeProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View testID={testID} style={[styles.wrap, style]}>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      >
        <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
      </View>
      {label ? (
        <TalkiText weight="bold" color={v3.textSecondary} style={styles.label}>
          {label}
        </TalkiText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: v3.purple100,
    borderWidth: 1,
    borderColor: v2.line,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: v3.purple600,
  },
  label: { fontSize: 12, alignSelf: 'flex-end' },
});
