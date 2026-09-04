import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { v3 } from '@/design-system/theme/colors';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';

import { landscapeTokens, LANDSCAPE_MIN_TOUCH } from './tokens';

export interface LandscapePageIndicatorProps {
  pageCount: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Child-friendly page dots for multi-page 3×2 hubs. Each dot is a ≥48 hit
 * target even when the visible circle is smaller. Respects reduce-motion by
 * skipping the pressed translate animation.
 */
export function LandscapePageIndicator({
  pageCount,
  activeIndex,
  onSelect,
  testID,
  style,
}: LandscapePageIndicatorProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const reduceMotion = useReducedMotion();
  const dot = tokens.pageDotSize;

  if (pageCount <= 1) return null;

  return (
    <View testID={testID} style={[styles.row, { gap: tokens.gap }, style]} accessibilityRole="adjustable">
      {Array.from({ length: pageCount }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <Pressable
            key={`dot-${i}`}
            testID={testID ? `${testID}-dot-${i}` : undefined}
            onPress={() => onSelect?.(i)}
            accessibilityRole="button"
            accessibilityLabel={`עמוד ${i + 1} מתוך ${pageCount}`}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.hit,
              !reduceMotion && pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  backgroundColor: active ? v3.purple600 : v3.purple200,
                },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: 4,
  },
  hit: {
    minWidth: LANDSCAPE_MIN_TOUCH,
    minHeight: LANDSCAPE_MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
  pressed: { transform: [{ translateY: 1 }] },
});
