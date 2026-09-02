import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { radii } from '../theme/radii';
import { shadowSm } from '../theme/shadows';
import { v2 } from '../theme/colors';

export interface TalkiIconButtonProps {
  icon: ImageSourcePropType;
  onPress?: () => void;
  accessibilityLabel: string;
  testID?: string;
  active?: boolean;
}

/** index.html `.tb-util-btn` — a square icon-only chrome button (TopBar
 *  music/settings, GameHeader back, ...). 44x44 icon slot inside a chip
 *  padded up to the 48x48 touch-target floor. */
export function TalkiIconButton({ icon, onPress, accessibilityLabel, testID, active = false }: TalkiIconButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.base, shadowSm, active && styles.active, pressed && styles.pressed]}
    >
      <View pointerEvents="none">
        <Image source={icon} style={styles.icon} resizeMode="contain" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 48,
    height: 48,
    borderRadius: radii.btn,
    borderWidth: 1,
    borderColor: v2.line,
    backgroundColor: v2.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    borderColor: v2.purple,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  icon: {
    width: 26,
    height: 26,
  },
});
