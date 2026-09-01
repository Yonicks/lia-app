import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radii } from '../theme/radii';
import { shadowCard } from '../theme/shadows';
import { v2 } from '../theme/colors';

export interface TalkiCardProps {
  children: ReactNode;
  onPress?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** index.html `.cat-card`/`.game-card` — a bordered, shadowed, rounded
 *  surface. Renders as a `Pressable` (with `accessibilityRole="button"`)
 *  when `onPress` is given, otherwise a plain `View` — static content is
 *  deliberately exempt from the touch-target/reachability audits (see
 *  tests/e2e/_helpers.ts). */
export function TalkiCard({ children, onPress, testID, style }: TalkiCardProps) {
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.base, shadowCard, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[styles.base, shadowCard, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 3,
    borderColor: v2.line,
    borderRadius: radii.card,
    backgroundColor: v2.paper,
    padding: 18,
  },
  pressed: {
    transform: [{ translateY: 4 }],
    shadowOpacity: 0,
    elevation: 0,
  },
});
