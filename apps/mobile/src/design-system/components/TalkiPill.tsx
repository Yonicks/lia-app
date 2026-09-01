import { StyleSheet, View } from 'react-native';

import { v2 } from '../theme/colors';
import { TalkiText } from './TalkiText';

export interface TalkiPillProps {
  label: string;
  testID?: string;
  color?: string;
  backgroundColor?: string;
}

/** index.html `.cat-card .stickers` / `.tb-points` — a small rounded badge
 *  for a count or short label. Static (no accessibilityRole), same as
 *  TalkiProgress — exempt from the touch-target audit. */
export function TalkiPill({ label, testID, color = v2.ink, backgroundColor = v2.cream }: TalkiPillProps) {
  return (
    <View testID={testID} style={[styles.base, { backgroundColor }]}>
      <TalkiText weight="bold" color={color} style={styles.text}>
        {label}
      </TalkiText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 24,
    paddingInline: 8,
    paddingBlock: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: v2.line,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
  },
});
